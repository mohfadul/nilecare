/**
 * WebSocket Hook
 * Real-time connection to notification service
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSnackbar } from 'notistack';

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
}

export function useWebSocket(options: WebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const {
    url = process.env.REACT_APP_WS_URL || 'ws://localhost:3002',
    autoConnect = true,
    reconnection = true,
  } = options;

  useEffect(() => {
    if (!autoConnect) return;

    // Get auth token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No auth token available for WebSocket connection');
      return;
    }

    // Create socket connection
    const socket = io(url, {
      auth: {
        token: token,
      },
      reconnection,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Notification events
    socket.on('notification-received', (data: any) => {
      enqueueSnackbar(data.message, {
        variant: data.type === 'error' ? 'error' : 'info',
        autoHideDuration: 5000,
      });
    });

    // Clinical alerts
    socket.on('clinical-alert', (data: any) => {
      enqueueSnackbar(data.message, {
        variant: 'error',
        persist: true, // Don't auto-hide critical alerts
      });
    });

    // Appointment events
    socket.on('appointment-booked', (data: any) => {
      enqueueSnackbar(`Appointment booked: ${data.appointmentId}`, {
        variant: 'success',
      });
    });

    socket.on('appointment-cancelled', (data: any) => {
      enqueueSnackbar(`Appointment cancelled: ${data.appointmentId}`, {
        variant: 'warning',
      });
    });

    // Payment events
    socket.on('payment-processed', (data: any) => {
      enqueueSnackbar(`Payment processed: ${data.transactionId}`, {
        variant: 'success',
      });
    });

    // Lab results
    socket.on('lab-result-available', (data: any) => {
      enqueueSnackbar(`Lab results available for order ${data.labOrderId}`, {
        variant: 'info',
      });
    });

    socket.on('critical-lab-value', (data: any) => {
      enqueueSnackbar(`🚨 CRITICAL LAB VALUE: ${data.criticalValues.join(', ')}`, {
        variant: 'error',
        persist: true,
      });
    });

    // Medication events
    socket.on('medication-administered', (data: any) => {
      enqueueSnackbar(`Medication administered to patient ${data.patientId}`, {
        variant: 'success',
      });
    });

    socket.on('high-alert-medication-administered', (data: any) => {
      enqueueSnackbar(`⚠️ HIGH-ALERT medication administered: ${data.medicationId}`, {
        variant: 'warning',
        persist: true,
      });
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [url, autoConnect, reconnection, enqueueSnackbar]);

  /**
   * Join a room
   */
  const joinRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', room);
    }
  };

  /**
   * Leave a room
   */
  const leaveRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', room);
    }
  };

  /**
   * Emit custom event
   */
  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  /**
   * Listen to custom event
   */
  const on = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  /**
   * Disconnect socket
   */
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    emit,
    on,
    disconnect,
  };
}

export default useWebSocket;

