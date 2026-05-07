import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import AppError from '../utils/AppError.js';
import { createDeliveryNoteSchema, updateDeliveryNoteSchema } from '../validators/deliveryNote.validator.js';
import { notifyCompany } from '../services/socket.service.js';
import { uploadFile } from '../services/storage.service.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import path from 'path';
import fs from 'fs';

export const createDeliveryNote = async (req, res, next) => {
  try {
    const validatedData = createDeliveryNoteSchema.parse(req.body);

    const project = await Project.findOne({ 
      _id: validatedData.project, 
      company: req.user.company,
      client: validatedData.client
    });

    if (!project) {
      throw new AppError('Project not found or not linked to this client/company', 404);
    }

    const deliveryNote = await DeliveryNote.create({
      ...validatedData,
      user: req.user._id,
      company: req.user.company
    });

    notifyCompany(req.user.company, 'deliverynote:new', {
      message: `New delivery note created for project: ${project.name}`,
      deliveryNoteId: deliveryNote._id
    });

    res.status(201).json({
      status: 'success',
      data: { deliveryNote }
    });
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
    next(error);
  }
};

export const getDeliveryNotes = async (req, res, next) => {
  try {
    const { 
      projectId, 
      clientId, 
      format, 
      signed, 
      from, 
      to, 
      page = 1, 
      limit = 10,
      sort = '-workDate' 
    } = req.query;

    const filter = { company: req.user.company, deleted: false };

    if (projectId) filter.project = projectId;
    if (clientId) filter.client = clientId;
    if (format) filter.format = format;
    if (signed) filter.signed = signed === 'true';
    
    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const totalItems = await DeliveryNote.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    const deliveryNotes = await DeliveryNote.find(filter)
      .populate('project', 'name projectCode')
      .populate('client', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      status: 'success',
      data: { 
        deliveryNotes,
        pagination: {
          totalItems,
          totalPages,
          currentPage: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNote = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    }).populate('project client');

    if (!deliveryNote) throw new AppError('Delivery note not found', 404);

    res.status(200).json({
      status: 'success',
      data: { deliveryNote }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryNote = async (req, res, next) => {
  try {
    const validatedData = updateDeliveryNoteSchema.parse(req.body);

    const deliveryNote = await DeliveryNote.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, signed: false },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!deliveryNote) {
      throw new AppError('Delivery note not found or already signed (cannot edit)', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { deliveryNote }
    });
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
    next(error);
  }
};

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    });
    
    if (!deliveryNote) throw new AppError('Delivery note not found', 404);
    if (deliveryNote.signed) throw new AppError('Cannot delete or archive a signed delivery note', 400);

    deliveryNote.deleted = true;
    await deliveryNote.save();

    if (!deliveryNote) throw new AppError('Delivery note not found', 404);

    res.status(200).json({
      status: 'success',
      message: 'Delivery note archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const signDeliveryNote = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('Signature image is required', 400);

    const deliveryNote = await DeliveryNote.findOne({ 
      _id: req.params.id, 
      company: req.user.company,
      signed: false 
    }).populate('project client company');

    if (!deliveryNote) throw new AppError('Delivery note not found or already signed', 404);

    const signatureUpload = await uploadFile(req.file.path, 'signatures');
    
    deliveryNote.signed = true;
    deliveryNote.signatureUrl = signatureUpload.url;

    const tempPdfPath = path.join(process.cwd(), 'temp', `albaran_${deliveryNote._id}.pdf`);
    if (!fs.existsSync(path.dirname(tempPdfPath))) {
      fs.mkdirSync(path.dirname(tempPdfPath), { recursive: true });
    }

    await generateDeliveryNotePDF(deliveryNote, tempPdfPath);
    const pdfUpload = await uploadFile(tempPdfPath, 'pdfs');
    
    if (!pdfUpload || !pdfUpload.url) {
      throw new AppError('Failed to upload PDF', 500);
    }

    const updatedNote = await DeliveryNote.findByIdAndUpdate(deliveryNote._id, {
      $set: {
        signed: true,
        signatureUrl: signatureUpload.url,
        pdfUrl: pdfUpload.url
      }
    }, { new: true });

    fs.unlinkSync(tempPdfPath);

    res.status(200).json({
      status: 'success',
      message: 'Delivery note signed and PDF generated',
      data: { deliveryNote: updatedNote }
    });

    notifyCompany(req.user.company, 'deliverynote:signed', {
      message: `Delivery note for project ${deliveryNote.project.name} has been signed`,
      deliveryNoteId: deliveryNote._id
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryNotePDF = async (req, res, next) => {
  try {
    const deliveryNote = await DeliveryNote.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    });

    if (!deliveryNote || !deliveryNote.pdfUrl) {
      throw new AppError('PDF not found for this delivery note', 404);
    }

    if (deliveryNote.pdfUrl.startsWith('http')) {
      return res.redirect(deliveryNote.pdfUrl);
    }

    const fullPath = path.join(process.cwd(), deliveryNote.pdfUrl);
    res.sendFile(fullPath);
  } catch (error) {
    next(error);
  }
};
