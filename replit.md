# Overview

Terminal Chat PWA is a professional real-time chat application built with a terminal-style interface that functions as a Progressive Web App. The application supports user authentication (email/password + JWT), real-time messaging through WebSockets, and can be installed on mobile devices and desktops as a PWA. It features a distinctive terminal aesthetic with green text on black background using JetBrains Mono font, providing an elegant monospace terminal experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with vanilla HTML5, CSS3, and JavaScript ES6, following a PWA architecture pattern. The application uses a terminal-style UI design with JetBrains Mono font and implements Service Workers for offline functionality. Socket.IO client enables real-time bidirectional communication with the server.

## Backend Architecture
The backend follows a Node.js/Express.js architecture with Socket.IO for real-time WebSocket connections. The application uses JWT tokens for stateless authentication and bcryptjs for password hashing. Currently implements in-memory storage using JavaScript Maps for users, rooms, and messages.

## Authentication System
JWT-based authentication system with bcryptjs for password hashing. Tokens are used for maintaining user sessions and the system is designed to support future OAuth integration (Google OAuth mentioned in documentation).

## Real-time Communication
Socket.IO handles real-time messaging features including direct messages, group chats, typing indicators, and online/offline status. The WebSocket connection enables instant message delivery and presence awareness.

## PWA Implementation
Progressive Web App features include installability through manifest.json, Service Workers for offline functionality, push notifications capability, and responsive design that adapts to all screen sizes.

## Security Measures
Express Rate Limit provides protection against attacks, Helmet middleware adds security headers, CORS is configured for cross-origin requests, and the application includes compression middleware for performance optimization.

# External Dependencies

## Core Framework Dependencies
- **Express.js** - Web application framework for Node.js
- **Socket.IO** - Real-time bidirectional event-based communication
- **Node.js 20** - JavaScript runtime environment

## Authentication & Security
- **jsonwebtoken** - JWT token generation and verification
- **bcryptjs** - Password hashing and comparison
- **helmet** - Security middleware for Express
- **express-rate-limit** - Rate limiting middleware
- **cors** - Cross-Origin Resource Sharing middleware

## Database & Storage
- **pg** - PostgreSQL client (prepared for future database integration)
- Currently uses in-memory storage with JavaScript Maps

## Performance & Utilities
- **compression** - Response compression middleware
- **multer** - Multipart/form-data handling for file uploads
- **dotenv** - Environment variable management

## Additional Integrations
- **discord.js** - Discord bot integration (separate bot.js file)
- **JetBrains Mono** - Google Fonts integration for terminal aesthetic

## Development Tools
- **nodemon** - Development server with auto-restart
- **@types/node** - TypeScript definitions for Node.js

## Hosting Platform
- **Replit** - Cloud hosting platform with HTTPS support on port 5000