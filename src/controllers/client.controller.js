import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

export const createClient = async (req, res, next) => {
  try {
    const validatedData = createClientSchema.parse(req.body);
    
    if (!req.user.company) {
      throw new AppError('User has no company associated', 400);
    }

    const existingClient = await Client.findOne({ 
      company: req.user.company, 
      cif: validatedData.cif 
    });

    if (existingClient) {
      throw new AppError('Client with this CIF already exists in your company', 409);
    }

    const client = await Client.create({
      ...validatedData,
      user: req.user._id,
      company: req.user.company
    });

    res.status(201).json({
      status: 'success',
      data: { client }
    });
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const validatedData = updateClientSchema.parse(req.body);
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!client) throw new AppError('Client not found', 404);

    res.status(200).json({
      status: 'success',
      data: { client }
    });
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
    next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name, sort = 'createdAt' } = req.query;
    const filter = { company: req.user.company, deleted: false };
    
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    
    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Client.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: clients.length,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page)
      },
      data: { clients }
    });
  } catch (error) {
    next(error);
  }
};

export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, company: req.user.company });
    if (!client) throw new AppError('Client not found', 404);

    res.status(200).json({
      status: 'success',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const { soft = 'true' } = req.query;
    let client;

    if (soft === 'true') {
      client = await Client.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true },
        { new: true }
      );
    } else {
      client = await Client.findOneAndDelete({ _id: req.params.id, company: req.user.company });
    }

    if (!client) throw new AppError('Client not found', 404);

    res.status(200).json({
      status: 'success',
      message: `Client ${soft === 'true' ? 'archived' : 'deleted'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const getArchivedClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ company: req.user.company, deleted: true });
    res.status(200).json({
      status: 'success',
      data: { clients }
    });
  } catch (error) {
    next(error);
  }
};

export const restoreClient = async (req, res, next) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );

    if (!client) throw new AppError('Archived client not found', 404);

    res.status(200).json({
      status: 'success',
      data: { client }
    });
  } catch (error) {
    next(error);
  }
};
