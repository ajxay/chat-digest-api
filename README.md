# Chat Digest API v1

A NestJS backend application with MongoDB integration.

## Features

- 🚀 NestJS framework
- 🍃 MongoDB with Mongoose
- 📝 TypeScript
- ✅ Validation with class-validator
- 🔧 Environment configuration
- 🎯 RESTful API structure

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or remote instance)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/chat-digest
```

3. Make sure MongoDB is running on your system.

## Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

## API Endpoints

- `GET /api` - Welcome message
- `GET /api/health` - Health check endpoint

## Project Structure

```
src/
├── main.ts              # Application entry point
├── app.module.ts        # Root module
├── app.controller.ts    # Root controller
├── app.service.ts       # Root service
└── database/           # Database configuration
    └── database.module.ts
```

## Scripts

- `npm run build` - Build the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string

## License

MIT

# chat-digest-api
