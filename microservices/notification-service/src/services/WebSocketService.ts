/**
 * WebSocket Service
 * Real-time notification delivery via Socket.IO
 */

import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { Notification } from '../models/Notification';

export interface WebSocketNotification {
  id: string;
  type: string;
  title?: string;
  message: string;
  data?: any;
  timestamp: Date;
  priority?: 'high' | 'normal' | 'low';
}

export class WebSocketService {
  private io: Server;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socketIds
  private socketUsers: Map<string, string>; // socketId -> userId

  constructor(io: Server) {
    this.io = io;
    this.userSockets = new Map();
    this.socketUsers = new Map();
    logger.info('WebSocketService initialized');
  }

  /**
   * Handle socket connection
   */
  handleConnection(socket: Socket, userId: string): void {
    logger.info('WebSocket client connected', { 
      socketId: socket.id, 
      userId 
    });

    // Track user-socket mapping
    this.socketUsers.set(socket.id, userId);
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socket.id);

    // Join user-specific room
    socket.join(`user-${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      userId,
      timestamp: new Date().toISOString(),
      message: 'Connected to notification service',
    });

    logger.debug('User socket tracking updated', {
      userId,
      socketCount: this.userSockets.get(userId)?.size,
    });
  }

  /**
   * Handle socket disconnection
   */
  handleDisconnection(socket: Socket): void {
    const userId = this.socketUsers.get(socket.id);

    if (userId) {
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.socketUsers.delete(socket.id);

      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId,
        remainingSockets: userSocketSet?.size || 0,
      });
    } else {
      logger.debug('WebSocket client disconnected (no user mapped)', {
        socketId: socket.id,
      });
    }
  }

  /**
   * Handle user subscription
   */
  handleSubscription(socket: Socket, subscription: any): void {
    const userId = this.socketUsers.get(socket.id);
    
    logger.debug('Handling subscription', { 
      socketId: socket.id, 
      userId,
      subscription 
    });

    if (subscription.channels) {
      subscription.channels.forEach((channel: string) => {
        socket.join(`channel-${channel}`);
      });
    }

    if (subscription.notificationTypes) {
      subscription.notificationTypes.forEach((type: string) => {
        socket.join(`type-${type}`);
      });
    }

    socket.emit('subscribed', {
      channels: subscription.channels,
      types: subscription.notificationTypes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send notification to user via WebSocket
   */
  sendToUser(userId: string, notification: WebSocketNotification | Notification): void {
    const formattedNotification = this.formatNotification(notification);

    this.io.to(`user-${userId}`).emit('notification:new', formattedNotification);

    logger.debug('WebSocket notification sent to user', {
      userId,
      notificationId: formattedNotification.id,
      type: formattedNotification.type,
    });
  }

  /**
   * Send notification to organization
   */
  sendToOrganization(organizationId: string, notification: WebSocketNotification | Notification): void {
    const formattedNotification = this.formatNotification(notification);

    this.io.to(`organization-${organizationId}`).emit('notification:new', formattedNotification);

    logger.debug('WebSocket notification sent to organization', {
      organizationId,
      notificationId: formattedNotification.id,
    });
  }

  /**
   * Send notification to all subscribers of a channel
   */
  sendToChannel(channel: string, notification: WebSocketNotification): void {
    this.io.to(`channel-${channel}`).emit('notification:new', notification);

    logger.debug('WebSocket notification sent to channel', {
      channel,
      notificationId: notification.id,
    });
  }

  /**
   * Send notification to all subscribers of a type
   */
  sendToType(type: string, notification: WebSocketNotification): void {
    this.io.to(`type-${type}`).emit('notification:new', notification);

    logger.debug('WebSocket notification sent to type', {
      type,
      notificationId: notification.id,
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
    logger.debug('WebSocket broadcast sent', { event });
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get total socket connections count
   */
  getTotalConnectionsCount(): number {
    return this.socketUsers.size;
  }

  /**
   * Get user's socket IDs
   */
  getUserSockets(userId: string): string[] {
    return Array.from(this.userSockets.get(userId) || []);
  }

  /**
   * Emit notification read event
   */
  emitNotificationRead(userId: string, notificationId: string): void {
    this.io.to(`user-${userId}`).emit('notification:read', {
      notificationId,
      timestamp: new Date().toISOString(),
    });

    logger.debug('Notification read event emitted', { userId, notificationId });
  }

  /**
   * Emit typing indicator
   */
  emitTyping(userId: string, isTyping: boolean): void {
    this.io.to(`user-${userId}`).emit('typing', {
      isTyping,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Format notification for WebSocket transmission
   */
  private formatNotification(notification: WebSocketNotification | Notification): WebSocketNotification {
    // If it's already a WebSocketNotification, return as is
    if ('message' in notification) {
      return notification as WebSocketNotification;
    }

    // Convert Notification to WebSocketNotification
    const dbNotification = notification as Notification;
    return {
      id: dbNotification.id,
      type: dbNotification.type,
      title: dbNotification.subject,
      message: dbNotification.body,
      data: dbNotification.payload,
      timestamp: dbNotification.created_at,
      priority: this.determinePriority(dbNotification.type),
    };
  }

  /**
   * Determine notification priority based on type
   */
  private determinePriority(type: string): 'high' | 'normal' | 'low' {
    const highPriorityTypes = ['critical_alert', 'emergency', 'urgent_care'];
    const lowPriorityTypes = ['marketing', 'newsletter', 'survey'];

    if (highPriorityTypes.includes(type)) {
      return 'high';
    } else if (lowPriorityTypes.includes(type)) {
      return 'low';
    }
    return 'normal';
  }

  /**
   * Get connection statistics
   */
  getStats(): any {
    return {
      connectedUsers: this.getConnectedUsersCount(),
      totalConnections: this.getTotalConnectionsCount(),
      rooms: this.io.sockets.adapter.rooms.size,
      timestamp: new Date().toISOString(),
    };
  }
}

export default WebSocketService;

