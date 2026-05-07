import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import { notifyCompany } from '../services/socket.service.js';

export const createProject = async (req, res, next) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);

    const client = await Client.findOne({ _id: validatedData.client, company: req.user.company });
    if (!client) {
      throw new AppError('Client not found or does not belong to your company', 404);
    }

    const existingProject = await Project.findOne({ 
      company: req.user.company, 
      projectCode: validatedData.projectCode 
    });

    if (existingProject) {
      throw new AppError('Project with this code already exists in your company', 409);
    }

    const project = await Project.create({
      ...validatedData,
      user: req.user._id,
      company: req.user.company
    });

    res.status(201).json({
      status: 'success',
      data: { project }
    });

    notifyCompany(req.user.company, 'project:new', {
      message: `New project created: ${project.name}`,
      project
    });
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, client: clientId, name, active, sort = '-createdAt' } = req.query;
    const filter = { company: req.user.company, deleted: false };
    
    if (clientId) filter.client = clientId;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active) filter.active = active === 'true';

    const skip = (page - 1) * limit;
    
    const [projects, totalItems] = await Promise.all([
      Project.find(filter)
        .populate('client', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter)
    ]);

    res.status(200).json({
      status: 'success',
      results: projects.length,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page)
      },
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id, 
      company: req.user.company 
    }).populate('client');

    if (!project) throw new AppError('Project not found', 404);

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const validatedData = updateProjectSchema.parse(req.body);

    if (validatedData.client) {
      const client = await Client.findOne({ _id: validatedData.client, company: req.user.company });
      if (!client) throw new AppError('Client not found or does not belong to your company', 404);
    }

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!project) throw new AppError('Project not found', 404);

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    if (error.name === 'ZodError') return next(new AppError(error.issues[0].message, 400));
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { soft = 'true' } = req.query;
    let project;

    if (soft === 'true') {
      project = await Project.findOneAndUpdate(
        { _id: req.params.id, company: req.user.company },
        { deleted: true },
        { new: true }
      );
    } else {
      project = await Project.findOneAndDelete({ _id: req.params.id, company: req.user.company });
    }

    if (!project) throw new AppError('Project not found', 404);

    res.status(200).json({
      status: 'success',
      message: `Project ${soft === 'true' ? 'archived' : 'deleted'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

export const getArchivedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ company: req.user.company, deleted: true }).populate('client');
    res.status(200).json({
      status: 'success',
      data: { projects }
    });
  } catch (error) {
    next(error);
  }
};

export const restoreProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company, deleted: true },
      { deleted: false },
      { new: true }
    );

    if (!project) throw new AppError('Archived project not found', 404);

    res.status(200).json({
      status: 'success',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
};
