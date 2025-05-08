const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

// Serve static files from public directory
app.use(express.static('public'));

// Handle WebSocket connections
wss.on('connection', (ws) => {
  // Assign a unique client ID and a random user ID
  const clientId = uuidv4();
  const userId = `User${Math.floor(Math.random() * 10000)}`; // e.g., User1234
  ws.clientId = clientId;
  ws.userId = userId;
  logger.info('New client connected', { clientId, userId });

  // Send welcome message, client ID, and user ID to the new client
  ws.send(JSON.stringify({ type: 'welcome', message: `Welcome to the chat! Your ID is ${userId}`, clientId, userId }));
  logger.info('Sent welcome message to client', { clientId, userId });

  // Handle incoming messages and broadcast to all clients
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message.text) {
        logger.info('Message received from client', { clientId, userId, message: message.text });
        const broadcastMessage = {
          type: 'message',
          text: message.text,
          senderId: clientId,
          userId: ws.userId // Ensure userId is from the current connection
        };
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(broadcastMessage));
            logger.info('Broadcasted message to client', { clientId: client.clientId, userId: client.userId, message: message.text });
          }
        });
      }
    } catch (error) {
      logger.error('Error processing message', { clientId, userId, error: error.message });
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    logger.info('Client disconnected', { clientId, userId });
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    logger.error('WebSocket error', { clientId, userId, error: error.message });
  });
});

// Start server on port 8088
server.listen(8088, () => {
  logger.info('Server started on port 8088');
});