import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';
import path from 'path';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'API REST for managing delivery notes, clients, and projects.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Client: {
          type: 'object',
          required: ['name', 'cif', 'email', 'phone', 'address'],
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            name: { type: 'string', example: 'Construcciones García' },
            cif: { type: 'string', example: 'B12345678' },
            email: { type: 'string', format: 'email', example: 'contacto@garcia.com' },
            phone: { type: 'string', example: '912345678' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: 'Calle Mayor' },
                number: { type: 'string', example: '10' },
                postal: { type: 'string', example: '28001' },
                city: { type: 'string', example: 'Madrid' },
                province: { type: 'string', example: 'Madrid' }
              }
            },
            deleted: { type: 'boolean', example: false }
          }
        },
        Project: {
          type: 'object',
          required: ['client', 'name', 'projectCode', 'email', 'address'],
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            client: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            name: { type: 'string', example: 'Reforma Local Centro' },
            projectCode: { type: 'string', example: 'PRJ-2024-001' },
            email: { type: 'string', example: 'obras@centro.com' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: 'Gran Vía' },
                number: { type: 'string', example: '1' },
                postal: { type: 'string', example: '28013' },
                city: { type: 'string', example: 'Madrid' },
                province: { type: 'string', example: 'Madrid' }
              }
            },
            active: { type: 'boolean', example: true },
            deleted: { type: 'boolean', example: false }
          }
        },
        DeliveryNote: {
          type: 'object',
          required: ['project', 'client', 'format', 'description', 'workDate'],
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            project: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            client: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            format: { type: 'string', enum: ['material', 'hours'], example: 'hours' },
            hours: { type: 'number', example: 8 },
            material: { type: 'string', example: 'Cemento 50kg' },
            workers: {
              type: 'array',
              items: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
              description: 'Worker user IDs assigned to this delivery note (hours format)'
            },
            description: { type: 'string', example: 'Trabajos de cimentación' },
            workDate: { type: 'string', format: 'date', example: '2024-03-20' },
            signed: { type: 'boolean', example: false },
            signatureUrl: { type: 'string', example: 'https://res.cloudinary.com/...' },
            pdfUrl: { type: 'string', example: 'https://res.cloudinary.com/...' },
            deleted: { type: 'boolean', example: false }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'García' },
            nif: { type: 'string', example: '12345678A' },
            role: { type: 'string', enum: ['admin', 'guest'], example: 'admin' },
            status: { type: 'string', enum: ['pending', 'verified'], example: 'pending' },
            company: { type: 'string', example: '65f8b3a2c9d1e20012345678' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'material: Material is required for material format' }
          }
        },
        ConflictError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'A client with this CIF already exists in your company' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Error message description' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpecs = await swaggerJsdoc(options);
export default swaggerSpecs;
