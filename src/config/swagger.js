import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

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
  apis: [`${process.cwd()}/src/routes/*.js`]
};

export default swaggerJsdoc(options);
