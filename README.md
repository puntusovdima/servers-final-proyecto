# BildyApp Backend

Backend for BildyApp, a REST API for managing delivery notes, clients, and projects.

## Technologies

- **Core**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest, Supertest, mongodb-memory-server
- **Real-time**: Socket.IO
- **Storage**: Multer, Cloudinary (with Sharp optimization)
- **PDF**: pdfkit
- **Security**: Helmet, Rate Limiting, Mongo Sanitize, Zod
- **CI/CD**: GitHub Actions
- **Containerization**: Docker, Docker Compose

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in the required variables.

## Running the App

### Local Development
```bash
npm run dev
```

### With Docker
```bash
docker-compose up --build
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## API Documentation

Once the server is running, you can access the Swagger UI at:
`http://localhost:3000/api-docs`

## Health Check

Check the server status:
`GET /health`

## Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals to close MongoDB connections and the HTTP server gracefully.
