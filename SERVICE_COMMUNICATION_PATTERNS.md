# 🔄 SERVICE COMMUNICATION PATTERNS

**Version:** 1.0.0  
**Date:** October 16, 2025  
**Status:** ✅ Complete

---

## 📋 OVERVIEW

This document details all inter-service communication patterns used in the NileCare platform, including protocols, message formats, retry strategies, and best practices.

---

## 🎯 COMMUNICATION TYPES SUMMARY

| Pattern | Protocol | Use Case | Latency | Reliability | Complexity |
|---------|----------|----------|---------|-------------|------------|
| **Synchronous HTTP** | REST/JSON | Direct request-response | Low (10-100ms) | High | Low |
| **Asynchronous Events** | Kafka | Event broadcasting | Medium (100-500ms) | Very High | Medium |
| **Task Queues** | RabbitMQ | Background jobs | High (1-30s) | High | Medium |
| **Real-Time Streaming** | WebSocket | Live updates | Very Low (<10ms) | Medium | High |
| **Device Communication** | MQTT | IoT devices | Low (10-50ms) | High | Medium |
| **Service Mesh** | gRPC | Internal microservice calls | Very Low (<5ms) | Very High | High |

---

## 1️⃣ SYNCHRONOUS HTTP/REST

### Pattern Description

Traditional request-response communication where the client waits for the server's response before continuing.

### When to Use

✅ **Use for:**
- User-initiated actions requiring immediate feedback
- Data retrieval (GET requests)
- Simple CRUD operations
- Service-to-service calls that need immediate results
- Authentication and authorization checks

❌ **Don't use for:**
- Long-running operations (>3 seconds)
- Operations that don't need immediate response
- Fan-out to multiple services
- Events that multiple services need to know about

### Implementation Details

#### Request Format

```typescript
// Standard NileCare REST Request
POST /api/v1/appointments
Headers:
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
  X-Request-ID: <correlation_id>
  X-User-ID: <user_id>

Body:
{
  "patient_id": "PAT-12345",
  "doctor_id": "DOC-67890",
  "appointment_date": "2025-10-20T14:00:00Z",
  "type": "consultation",
  "notes": "Follow-up visit"
}
```

#### Response Format (NileCareResponse Wrapper)

```typescript
// Success Response
HTTP/1.1 201 Created
{
  "status": 201,
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "appointment_id": "APT-98765",
    "patient_id": "PAT-12345",
    "doctor_id": "DOC-67890",
    "appointment_date": "2025-10-20T14:00:00Z",
    "status": "scheduled"
  },
  "timestamp": "2025-10-16T10:30:00Z",
  "request_id": "req_abc123xyz"
}

// Error Response
HTTP/1.1 400 Bad Request
{
  "status": 400,
  "success": false,
  "message": "Doctor is not available at the requested time",
  "error": {
    "code": "DOCTOR_NOT_AVAILABLE",
    "details": {
      "doctor_id": "DOC-67890",
      "requested_time": "2025-10-20T14:00:00Z",
      "next_available": "2025-10-20T15:00:00Z"
    }
  },
  "timestamp": "2025-10-16T10:30:00Z",
  "request_id": "req_abc123xyz"
}
```

### Service-to-Service Communication

```typescript
// Example: Main Orchestrator calling Auth Service
import axios from 'axios';

class AuthServiceClient {
  private baseURL = process.env.AUTH_SERVICE_URL || 'http://localhost:7020';

  async validateToken(token: string): Promise<User> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/v1/auth/validate`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Name': 'main-orchestrator',
            'X-Request-ID': this.generateRequestId()
          },
          timeout: 5000, // 5 second timeout
        }
      );

      if (response.data.success) {
        return response.data.data.user;
      }

      throw new Error(response.data.message);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Auth service timeout');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid token');
        }
      }
      throw error;
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Retry Strategy

```typescript
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configure retry for transient failures
axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.response?.status === 429 || // Rate limit
           error.response?.status === 503;   // Service unavailable
  },
});
```

### Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 5000, // If function takes longer than 5s, trigger failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open circuit
  resetTimeout: 30000, // After 30s, try again
};

const breaker = new CircuitBreaker(async (url: string) => {
  return await axios.get(url);
}, options);

breaker.on('open', () => {
  console.error('Circuit breaker opened - service is down');
});

breaker.on('halfOpen', () => {
  console.warn('Circuit breaker half-open - testing service');
});

breaker.on('close', () => {
  console.info('Circuit breaker closed - service recovered');
});

// Usage
try {
  const result = await breaker.fire('http://auth-service:7020/health');
} catch (error) {
  // Handle circuit breaker errors
}
```

### API Endpoints by Service

#### Auth Service (7020)
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/validate
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

#### Business Service (7010)
```
GET    /api/v1/staff
GET    /api/v1/staff/:id
POST   /api/v1/staff
PUT    /api/v1/staff/:id
GET    /api/v1/departments
GET    /api/v1/working-hours/:staff_id
```

#### Appointment Service (7040)
```
GET    /api/v1/appointments
POST   /api/v1/appointments
PUT    /api/v1/appointments/:id
DELETE /api/v1/appointments/:id
GET    /api/v1/appointments/availability
POST   /api/v1/appointments/:id/cancel
POST   /api/v1/appointments/:id/reschedule
```

#### Billing Service (7050)
```
GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/:id
PUT    /api/v1/invoices/:id
GET    /api/v1/claims
POST   /api/v1/claims
```

#### Payment Gateway (7030)
```
POST   /api/v1/payments
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/verify
POST   /api/v1/payments/:id/refund
POST   /api/v1/webhooks/stripe
POST   /api/v1/webhooks/paypal
```

---

## 2️⃣ ASYNCHRONOUS EVENT-DRIVEN (KAFKA)

### Pattern Description

Services publish events to Kafka topics when significant domain events occur. Other services subscribe to relevant topics and react to events independently.

### When to Use

✅ **Use for:**
- Domain events (appointment created, payment completed)
- Fan-out scenarios (one event, many consumers)
- Audit trail and event sourcing
- Decoupling services
- Eventual consistency patterns

❌ **Don't use for:**
- Operations requiring immediate response
- Simple request-response
- Commands (use HTTP for commands, events for state changes)

### Kafka Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     KAFKA CLUSTER                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Topic: patient.events (3 partitions)                  │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │Partition 0 │  │Partition 1 │  │Partition 2 │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Topic: appointment.events (3 partitions)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Topic: prescription.events (3 partitions)             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Topic Naming Convention

```
<entity>.<action>
Examples:
- patient.created
- patient.updated
- appointment.scheduled
- appointment.cancelled
- prescription.created
- prescription.verified
- payment.completed
- payment.failed
- lab.result.available
- lab.result.critical
```

### Event Schema

```typescript
interface DomainEvent<T = any> {
  event_id: string;           // Unique event ID
  event_type: string;         // e.g., "appointment.scheduled"
  event_version: string;      // Schema version "1.0"
  timestamp: string;          // ISO 8601 timestamp
  source_service: string;     // Service that published event
  correlation_id: string;     // Track across services
  user_id?: string;           // User who triggered (if applicable)
  
  data: T;                    // Event-specific payload
  metadata?: Record<string, any>; // Additional context
}

// Example: Appointment Scheduled Event
interface AppointmentScheduledData {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  facility_id: string;
  appointment_date: string;
  appointment_type: string;
  status: string;
}

const appointmentScheduledEvent: DomainEvent<AppointmentScheduledData> = {
  event_id: "evt_abc123",
  event_type: "appointment.scheduled",
  event_version: "1.0",
  timestamp: "2025-10-16T10:30:00Z",
  source_service: "appointment-service",
  correlation_id: "corr_xyz789",
  user_id: "USR-12345",
  data: {
    appointment_id: "APT-98765",
    patient_id: "PAT-12345",
    doctor_id: "DOC-67890",
    facility_id: "FAC-001",
    appointment_date: "2025-10-20T14:00:00Z",
    appointment_type: "consultation",
    status: "scheduled"
  },
  metadata: {
    created_via: "receptionist_dashboard",
    facility_name: "Main Hospital"
  }
};
```

### Publishing Events

```typescript
import { Kafka, Producer } from 'kafkajs';

class EventPublisher {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'appointment-service',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async publishEvent<T>(
    topic: string,
    eventType: string,
    data: T,
    options?: {
      correlationId?: string;
      userId?: string;
      key?: string; // For partitioning
    }
  ): Promise<void> {
    const event: DomainEvent<T> = {
      event_id: this.generateEventId(),
      event_type: eventType,
      event_version: '1.0',
      timestamp: new Date().toISOString(),
      source_service: 'appointment-service',
      correlation_id: options?.correlationId || this.generateCorrelationId(),
      user_id: options?.userId,
      data,
    };

    await this.producer.send({
      topic,
      messages: [
        {
          key: options?.key || event.event_id,
          value: JSON.stringify(event),
          headers: {
            'event-type': eventType,
            'event-version': '1.0',
            'correlation-id': event.correlation_id,
          },
        },
      ],
    });

    console.log(`Published event: ${eventType} to topic: ${topic}`);
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Usage
const publisher = new EventPublisher();
await publisher.connect();

await publisher.publishEvent(
  'appointment.events',
  'appointment.scheduled',
  {
    appointment_id: 'APT-98765',
    patient_id: 'PAT-12345',
    doctor_id: 'DOC-67890',
    appointment_date: '2025-10-20T14:00:00Z',
  },
  {
    correlationId: 'corr_xyz789',
    userId: 'USR-12345',
    key: 'PAT-12345', // Partition by patient_id
  }
);
```

### Consuming Events

```typescript
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

class EventConsumer {
  private consumer: Consumer;

  constructor(groupId: string) {
    const kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
    });

    this.consumer = kafka.consumer({ groupId });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
  }

  async subscribe(topics: string[]): Promise<void> {
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
  }

  async start(handler: (event: DomainEvent) => Promise<void>): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        try {
          const eventString = message.value?.toString();
          if (!eventString) return;

          const event: DomainEvent = JSON.parse(eventString);
          
          console.log(`Received event: ${event.event_type} from ${topic}`);
          
          await handler(event);
        } catch (error) {
          console.error('Error processing event:', error);
          // Implement dead letter queue (DLQ) here
        }
      },
    });
  }
}

// Usage in Notification Service
const consumer = new EventConsumer('notification-service-group');
await consumer.connect();
await consumer.subscribe([
  'appointment.events',
  'prescription.events',
  'lab.events'
]);

await consumer.start(async (event) => {
  switch (event.event_type) {
    case 'appointment.scheduled':
      await sendAppointmentReminder(event.data);
      break;
    case 'lab.result.critical':
      await sendCriticalAlertToDoctor(event.data);
      break;
    case 'prescription.created':
      await notifyPharmacy(event.data);
      break;
    default:
      console.warn(`Unhandled event type: ${event.event_type}`);
  }
});
```

### Event Topics & Subscribers

| Topic | Event Types | Subscribers |
|-------|-------------|-------------|
| **patient.events** | created, updated, merged | Billing, Notification, Audit |
| **appointment.events** | scheduled, cancelled, rescheduled, completed | Notification, Billing, Analytics |
| **prescription.events** | created, verified, dispensed | Notification, Pharmacy, Billing |
| **payment.events** | completed, failed, refunded | Billing, Notification, Analytics |
| **lab.events** | ordered, collected, resulted, critical | Clinical, Notification, Billing |
| **audit.events** | phi_accessed, phi_modified | Compliance, Audit Log |

---

## 3️⃣ TASK QUEUES (RABBITMQ)

### Pattern Description

Background job processing for tasks that don't need immediate execution or can be retried.

### When to Use

✅ **Use for:**
- Email/SMS sending
- Report generation (PDF, Excel)
- Data export operations
- Image/file processing
- Scheduled tasks
- Retry-able operations

❌ **Don't use for:**
- Real-time operations
- User-facing immediate actions
- Event broadcasting (use Kafka)

### Queue Types

```
┌─────────────────────────────────────────────────────┐
│              RABBITMQ EXCHANGES & QUEUES             │
│                                                      │
│  Direct Exchange: nilecare.email                    │
│  ┌──────────────────────┐                           │
│  │  Queue: email.high   │  Priority: 10            │
│  │  Queue: email.normal │  Priority: 5             │
│  │  Queue: email.low    │  Priority: 1             │
│  └──────────────────────┘                           │
│                                                      │
│  Direct Exchange: nilecare.sms                      │
│  ┌──────────────────────┐                           │
│  │  Queue: sms.urgent   │  Priority: 10            │
│  │  Queue: sms.normal   │  Priority: 5             │
│  └──────────────────────┘                           │
│                                                      │
│  Direct Exchange: nilecare.reports                  │
│  ┌──────────────────────┐                           │
│  │  Queue: reports.pdf  │                           │
│  │  Queue: reports.excel│                           │
│  └──────────────────────┘                           │
│                                                      │
│  Dead Letter Exchange: nilecare.dlq                 │
│  ┌──────────────────────┐                           │
│  │  Queue: failed.jobs  │  Retry after 5min        │
│  └──────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

### Publishing Tasks

```typescript
import amqp from 'amqplib';

class TaskQueue {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    this.connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost'
    );
    this.channel = await this.connection.createChannel();
  }

  async publishTask(
    queue: string,
    task: any,
    options?: {
      priority?: number;
      delay?: number;
    }
  ): Promise<void> {
    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-max-priority': 10,
        'x-dead-letter-exchange': 'nilecare.dlq',
      },
    });

    const message = Buffer.from(JSON.stringify(task));

    this.channel.sendToQueue(queue, message, {
      persistent: true,
      priority: options?.priority || 5,
      expiration: options?.delay ? options.delay.toString() : undefined,
    });

    console.log(`Task published to queue: ${queue}`);
  }
}

// Usage: Send email
const taskQueue = new TaskQueue();
await taskQueue.connect();

await taskQueue.publishTask('email.normal', {
  to: 'patient@example.com',
  subject: 'Appointment Reminder',
  template: 'appointment_reminder',
  data: {
    patient_name: 'John Doe',
    appointment_date: '2025-10-20T14:00:00Z',
    doctor_name: 'Dr. Smith',
  },
}, { priority: 7 });
```

### Consuming Tasks

```typescript
import amqp from 'amqplib';

class TaskWorker {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    this.connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost'
    );
    this.channel = await this.connection.createChannel();
    await this.channel.prefetch(5); // Process 5 messages at a time
  }

  async startWorker(
    queue: string,
    handler: (task: any) => Promise<void>
  ): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });

    console.log(`Worker started for queue: ${queue}`);

    this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const task = JSON.parse(msg.content.toString());
        console.log(`Processing task:`, task);

        await handler(task);

        this.channel.ack(msg); // Acknowledge success
        console.log('Task completed successfully');
      } catch (error) {
        console.error('Task failed:', error);

        // Retry logic
        const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;

        if (retryCount < 3) {
          // Requeue with delay
          this.channel.sendToQueue(queue, msg.content, {
            headers: { 'x-retry-count': retryCount },
            expiration: (retryCount * 5000).toString(), // Exponential backoff
          });
          this.channel.ack(msg);
        } else {
          // Move to DLQ after 3 retries
          this.channel.nack(msg, false, false);
        }
      }
    });
  }
}

// Usage: Email worker
const worker = new TaskWorker();
await worker.connect();

await worker.startWorker('email.normal', async (task) => {
  await emailService.sendEmail({
    to: task.to,
    subject: task.subject,
    html: await renderTemplate(task.template, task.data),
  });
});
```

---

## 4️⃣ REAL-TIME COMMUNICATION (WEBSOCKET)

### Pattern Description

Bidirectional, persistent connection for real-time updates from server to client.

### When to Use

✅ **Use for:**
- Live vital signs monitoring
- Real-time notifications
- Chat/messaging
- Live dashboard updates
- Collaborative editing

❌ **Don't use for:**
- Simple API calls (use HTTP)
- Large file transfers
- One-time data fetches

### WebSocket Server Setup

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Redis adapter for horizontal scaling
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

io.adapter(require('socket.io-redis')({ pubClient, subClient }));

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const user = await validateToken(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Connection handler
io.on('connection', (socket) => {
  const user = socket.data.user;
  console.log(`User connected: ${user.id}`);

  // Join user-specific room
  socket.join(`user:${user.id}`);

  // Join role-specific room
  socket.join(`role:${user.role}`);

  // Subscribe to patient room (for healthcare providers)
  socket.on('subscribe:patient', (patientId: string) => {
    if (canAccessPatient(user, patientId)) {
      socket.join(`patient:${patientId}`);
      console.log(`User ${user.id} subscribed to patient ${patientId}`);
    }
  });

  // Unsubscribe from patient room
  socket.on('unsubscribe:patient', (patientId: string) => {
    socket.leave(`patient:${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.id}`);
  });
});

// Broadcasting events
export function broadcastVitalsUpdate(patientId: string, vitals: any) {
  io.to(`patient:${patientId}`).emit('vitals:update', vitals);
}

export function notifyUser(userId: string, notification: any) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}

export function broadcastToRole(role: string, event: string, data: any) {
  io.to(`role:${role}`).emit(event, data);
}

httpServer.listen(7000, () => {
  console.log('WebSocket server running on port 7000');
});
```

### WebSocket Client (Frontend)

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io(process.env.VITE_WS_URL || 'http://localhost:7000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  subscribeToPatient(patientId: string): void {
    this.socket?.emit('subscribe:patient', patientId);
  }

  unsubscribeFromPatient(patientId: string): void {
    this.socket?.emit('unsubscribe:patient', patientId);
  }

  onVitalsUpdate(callback: (vitals: any) => void): void {
    this.socket?.on('vitals:update', callback);
  }

  onNewNotification(callback: (notification: any) => void): void {
    this.socket?.on('notification:new', callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}

// Usage in React
const wsClient = new WebSocketClient();

useEffect(() => {
  const token = localStorage.getItem('access_token');
  wsClient.connect(token);

  wsClient.onVitalsUpdate((vitals) => {
    setVitalSigns(vitals);
  });

  wsClient.onNewNotification((notification) => {
    showNotification(notification);
  });

  return () => {
    wsClient.disconnect();
  };
}, []);

// Subscribe when viewing patient
useEffect(() => {
  if (patientId) {
    wsClient.subscribeToPatient(patientId);
    return () => wsClient.unsubscribeFromPatient(patientId);
  }
}, [patientId]);
```

### WebSocket Events

| Event | Direction | Purpose | Data |
|-------|-----------|---------|------|
| `vitals:update` | Server→Client | Real-time vital signs | `{ patient_id, hr, bp, spo2, temp }` |
| `notification:new` | Server→Client | New notification | `{ id, type, message, priority }` |
| `appointment:updated` | Server→Client | Schedule change | `{ appointment_id, status, time }` |
| `chat:message` | Bidirectional | Real-time messaging | `{ sender, message, timestamp }` |
| `alert:critical` | Server→Client | Critical patient alert | `{ patient_id, alert_type, severity }` |

---

## 5️⃣ DEVICE COMMUNICATION (MQTT)

### Pattern Description

Lightweight publish-subscribe protocol for IoT medical devices.

### When to Use

✅ **Use for:**
- Medical device data streaming
- Low-bandwidth scenarios
- High-frequency sensor data
- Battery-powered devices

### MQTT Topics

```
devices/{device_id}/vitals         - Vital signs data
devices/{device_id}/alerts         - Device alerts
devices/{device_id}/status         - Online/offline status
devices/{device_id}/commands       - Send commands to device
```

### Publishing from Device (Pseudocode)

```c
#include <mqtt.h>

void publish_vitals() {
    char topic[100];
    sprintf(topic, "devices/%s/vitals", device_id);

    char payload[200];
    sprintf(payload, "{\"hr\":%d,\"spo2\":%d,\"temp\":%.1f}", 
            heart_rate, spo2, temperature);

    mqtt_publish(topic, payload, QOS_1);
}
```

### Subscribing in Backend

```typescript
import mqtt from 'mqtt';

const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('devices/+/vitals'); // Subscribe to all devices
  client.subscribe('devices/+/alerts');
});

client.on('message', async (topic, message) => {
  const parts = topic.split('/');
  const deviceId = parts[1];
  const dataType = parts[2];

  const data = JSON.parse(message.toString());

  if (dataType === 'vitals') {
    await handleVitals(deviceId, data);
  } else if (dataType === 'alerts') {
    await handleAlert(deviceId, data);
  }
});

async function handleVitals(deviceId: string, vitals: any) {
  // Store in TimescaleDB
  await db.query(`
    INSERT INTO device_vitals (device_id, hr, spo2, temp, timestamp)
    VALUES ($1, $2, $3, $4, NOW())
  `, [deviceId, vitals.hr, vitals.spo2, vitals.temp]);

  // Check thresholds
  if (vitals.hr > 120 || vitals.hr < 40) {
    await triggerCriticalAlert(deviceId, 'HR_ABNORMAL');
  }

  // Broadcast via WebSocket
  broadcastVitalsUpdate(vitals.patient_id, vitals);
}
```

---

## 📊 BEST PRACTICES

### 1. Correlation IDs

Always include correlation IDs to trace requests across services:

```typescript
import { v4 as uuidv4 } from 'uuid';

function generateCorrelationId(): string {
  return uuidv4();
}

// Include in all service calls
axios.get(url, {
  headers: {
    'X-Correlation-ID': correlationId,
  },
});

// Log with correlation ID
logger.info('Processing request', { correlationId, userId });
```

### 2. Timeouts

Set appropriate timeouts for all service calls:

```typescript
const TIMEOUTS = {
  auth: 5000,       // Auth must be fast
  database: 10000,  // Database queries
  external: 30000,  // External APIs
  reports: 120000,  // Long-running operations
};
```

### 3. Idempotency

Ensure operations can be safely retried:

```typescript
// Use idempotency keys
POST /api/v1/payments
Headers:
  Idempotency-Key: unique-key-12345

// Server checks if operation already processed
if (await cache.exists(idempotencyKey)) {
  return cachedResponse;
}
```

### 4. Error Handling

Standardized error responses:

```typescript
{
  "status": 500,
  "success": false,
  "message": "Internal server error",
  "error": {
    "code": "DATABASE_CONNECTION_ERROR",
    "details": "Unable to connect to MySQL",
    "retry_after": 5000
  },
  "timestamp": "2025-10-16T10:30:00Z",
  "request_id": "req_abc123"
}
```

---

## ✅ SUMMARY

**Completed Documentation:**
- ✅ All 5 communication patterns documented
- ✅ Code examples provided
- ✅ Best practices included
- ✅ Error handling strategies defined

**Next Steps:**
- Implement monitoring for service communication
- Add distributed tracing (Jaeger)
- Create service health dashboard

---

**Document Status:** ✅ Complete  
**Last Updated:** October 16, 2025

