/**
 * WebSocket Service
 * ✅ PHASE 3: Real-time updates for notifications, vitals, and appointments
 * 
 * Manages WebSocket connection to Main NileCare Service
 * Provides real-time updates across the application
 */

import { io, Socket } from 'socket.io-client';

type EventCallback = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private subscribers: Map<string, Set<EventCallback>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:7000';

    console.log(`[WebSocket] Connecting to ${wsUrl}...`);

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ [WebSocket] Connected');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`⚠️  [WebSocket] Disconnected: ${reason}`);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`[WebSocket] Reconnected after ${attemptNumber} attempts`);
    });

    // Set up event listeners for subscribed events
    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.subscribers.clear();
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  /**
   * Subscribe to patient updates
   */
  subscribeToPatient(patientId: string): void {
    if (!this.socket) {
      console.warn('[WebSocket] Not connected. Call connect() first.');
      return;
    }

    console.log(`[WebSocket] Subscribing to patient: ${patientId}`);
    this.socket.emit('subscribe:patient', patientId);
  }

  /**
   * Unsubscribe from patient updates
   */
  unsubscribeFromPatient(patientId: string): void {
    if (!this.socket) return;

    console.log(`[WebSocket] Unsubscribing from patient: ${patientId}`);
    this.socket.emit('unsubscribe:patient', patientId);
  }

  /**
   * Subscribe to room (for role-based broadcasts)
   */
  subscribeToRoom(room: string): void {
    if (!this.socket) return;

    console.log(`[WebSocket] Subscribing to room: ${room}`);
    this.socket.emit('subscribe:room', room);
  }

  /**
   * Generic event subscription
   */
  on(event: string, callback: EventCallback): () => void {
    // Add callback to subscribers map
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    // If socket exists, add listener immediately
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.get(event)?.delete(callback);
      this.socket?.off(event, callback);
    };
  }

  /**
   * Emit event to server
   */
  emit(event: string, data?: any): void {
    if (!this.socket) {
      console.warn('[WebSocket] Cannot emit - not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Set up event listeners for all subscribed events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Register all existing subscribers
    this.subscribers.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket!.on(event, callback);
      });
    });
  }

  /**
   * Convenience methods for common events
   */

  // Vital signs updates
  onVitalsUpdate(callback: EventCallback): () => void {
    return this.on('vitals:update', callback);
  }

  // New notification
  onNotification(callback: EventCallback): () => void {
    return this.on('notification:new', callback);
  }

  // Appointment updated
  onAppointmentUpdate(callback: EventCallback): () => void {
    return this.on('appointment:updated', callback);
  }

  // Lab result available
  onLabResult(callback: EventCallback): () => void {
    return this.on('lab:result', callback);
  }

  // Critical alert
  onCriticalAlert(callback: EventCallback): () => void {
    return this.on('alert:critical', callback);
  }

  // Chat message (for future messaging feature)
  onChatMessage(callback: EventCallback): () => void {
    return this.on('chat:message', callback);
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// Export class for testing
export default WebSocketService;

