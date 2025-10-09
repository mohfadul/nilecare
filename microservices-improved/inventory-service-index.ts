import { Pool } from 'pg';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

// Import routes
import inventoryRoutes from './routes/inventory';
import itemRoutes from './routes/items';
import supplierRoutes from './routes/suppliers';
import orderRoutes from './routes/orders';
import locationRoutes from './routes/locations';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import { validateRequest } from './middleware/validation';

// Import services
import { InventoryService } from './services/InventoryService';
import { SupplierService } from './services/SupplierService';
import { OrderService } from './services/OrderService';
import { NotificationService } from './services/NotificationService';
import { EventService } from './services/EventService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5004;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NileCare Inventory Service API',
      version: '1.0.0',
      description: 'Multi-location inventory management and supply chain service',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'inventory-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/inventory', authMiddleware, inventoryRoutes);
app.use('/api/v1/items', authMiddleware, itemRoutes);
app.use('/api/v1/suppliers', authMiddleware, supplierRoutes);
app.use('/api/v1/orders', authMiddleware, orderRoutes);
app.use('/api/v1/locations', authMiddleware, locationRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join location-specific room
  socket.on('join-location', (locationId: string) => {
    socket.join(`location-${locationId}`);
    console.log(`Client ${socket.id} joined location ${locationId}`);
  });

  // Join supplier-specific room
  socket.on('join-supplier', (supplierId: string) => {
    socket.join(`supplier-${supplierId}`);
    console.log(`Client ${socket.id} joined supplier ${supplierId}`);
  });

  // Handle inventory updates
  socket.on('inventory-update', async (data: any) => {
    try {
      const { locationId, itemId, quantity, type } = data;
      
      const inventoryService = new InventoryService();
      await inventoryService.updateInventory(locationId, itemId, quantity, type);
      
      // Broadcast update to location room
      io.to(`location-${locationId}`).emit('inventory-changed', {
        itemId,
        quantity,
        type,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error updating inventory:', error);
      socket.emit('error', { message: 'Failed to update inventory' });
    }
  });

  // Handle order placement
  socket.on('place-order', async (data: any) => {
    try {
      const { supplierId, items, locationId } = data;
      
      const orderService = new OrderService();
      const order = await orderService.placeOrder({
        supplierId,
        items,
        locationId,
        status: 'pending'
      });
      
      // Notify supplier
      io.to(`supplier-${supplierId}`).emit('new-order', order);
      
      // Notify location
      io.to(`location-${locationId}`).emit('order-placed', order);
      
    } catch (error) {
      console.error('Error placing order:', error);
      socket.emit('error', { message: 'Failed to place order' });
    }
  });

  // Handle low stock alerts
  socket.on('low-stock-alert', async (data: any) => {
    try {
      const { locationId, itemId, currentStock, minThreshold } = data;
      
      const inventoryService = new InventoryService();
      await inventoryService.createLowStockAlert(locationId, itemId, currentStock, minThreshold);
      
      // Broadcast alert to location room
      io.to(`location-${locationId}`).emit('low-stock-alert', {
        itemId,
        currentStock,
        minThreshold,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error creating low stock alert:', error);
      socket.emit('error', { message: 'Failed to create low stock alert' });
    }
  });

  // Handle expiry alerts
  socket.on('expiry-alert', async (data: any) => {
    try {
      const { locationId, itemId, expiryDate, batchNumber } = data;
      
      const inventoryService = new InventoryService();
      await inventoryService.createExpiryAlert(locationId, itemId, expiryDate, batchNumber);
      
      // Broadcast alert to location room
      io.to(`location-${locationId}`).emit('expiry-alert', {
        itemId,
        expiryDate,
        batchNumber,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error creating expiry alert:', error);
      socket.emit('error', { message: 'Failed to create expiry alert' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Scheduled tasks
// Check for low stock items every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking for low stock items...');
  try {
    const inventoryService = new InventoryService();
    await inventoryService.checkLowStockItems();
  } catch (error) {
    console.error('Error checking low stock items:', error);
  }
});

// Check for expiring items daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Checking for expiring items...');
  try {
    const inventoryService = new InventoryService();
    await inventoryService.checkExpiringItems();
  } catch (error) {
    console.error('Error checking expiring items:', error);
  }
});

// Process automated reordering daily at 10 AM
cron.schedule('0 10 * * *', async () => {
  console.log('Processing automated reordering...');
  try {
    const inventoryService = new InventoryService();
    await inventoryService.processAutomatedReordering();
  } catch (error) {
    console.error('Error processing automated reordering:', error);
  }
});

// Generate inventory reports daily at 11 PM
cron.schedule('0 23 * * *', async () => {
  console.log('Generating inventory reports...');
  try {
    const inventoryService = new InventoryService();
    await inventoryService.generateInventoryReports();
  } catch (error) {
    console.error('Error generating inventory reports:', error);
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`📦 Inventory Service running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔌 WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export { app, server, io };
