import { createServerClient } from './supabase';
import { NextRequest } from 'next/server';

export interface RealtimeEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface NotificationEvent extends RealtimeEvent {
  type: 'notification' | 'notification_update' | 'notification_delete';
  data: {
    id: string;
    recipient_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    priority?: string;
  };
}

export interface ProjectUpdateEvent extends RealtimeEvent {
  type: 'project_update' | 'project_create' | 'project_delete';
  data: {
    id: string;
    client_id: string;
    status: string;
    progress_percentage?: number;
    last_activity_at?: string;
  };
}

export interface PaymentEvent extends RealtimeEvent {
  type: 'payment_success' | 'payment_failed' | 'payment_refund';
  data: {
    invoice_id: string;
    project_id: string;
    amount: number;
    status: string;
  };
}

export interface SupportTicketEvent extends RealtimeEvent {
  type: 'ticket_create' | 'ticket_update' | 'ticket_reply';
  data: {
    ticket_id: string;
    client_id: string;
    status: string;
    priority: string;
  };
}

// Real-time connection manager
export class RealtimeManager {
  private connections: Map<string, WebSocket> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connectionIds
  private eventHandlers: Map<string, ((event: RealtimeEvent) => void)[]> = new Map();

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Initialize default event handlers
    this.eventHandlers.set('notification', []);
    this.eventHandlers.set('project_update', []);
    this.eventHandlers.set('payment', []);
    this.eventHandlers.set('support_ticket', []);
  }

  // Add a new WebSocket connection
  addConnection(connectionId: string, ws: WebSocket, userId?: string) {
    this.connections.set(connectionId, ws);
    
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }

    // Send connection confirmation
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      data: { connectionId, userId },
      timestamp: new Date().toISOString()
    });

    console.log(`WebSocket connection added: ${connectionId}${userId ? ` for user ${userId}` : ''}`);
  }

  // Remove a WebSocket connection
  removeConnection(connectionId: string) {
    const ws = this.connections.get(connectionId);
    if (ws) {
      ws.close();
      this.connections.delete(connectionId);
      
      // Remove from user connections
      for (const [userId, connections] of this.userConnections.entries()) {
        if (connections.has(connectionId)) {
          connections.delete(connectionId);
          if (connections.size === 0) {
            this.userConnections.delete(userId);
          }
          break;
        }
      }
      
      console.log(`WebSocket connection removed: ${connectionId}`);
    }
  }

  // Send event to a specific connection
  sendToConnection(connectionId: string, event: RealtimeEvent) {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
      return true;
    }
    return false;
  }

  // Send event to all connections of a specific user
  sendToUser(userId: string, event: RealtimeEvent) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      let sentCount = 0;
      for (const connectionId of connections) {
        if (this.sendToConnection(connectionId, event)) {
          sentCount++;
        }
      }
      return sentCount;
    }
    return 0;
  }

  // Send event to all connected users
  broadcast(event: RealtimeEvent, excludeUserId?: string) {
    let sentCount = 0;
    for (const [connectionId, ws] of this.connections.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        // Skip if this connection belongs to the excluded user
        if (excludeUserId) {
          let shouldSkip = false;
          for (const [userId, connections] of this.userConnections.entries()) {
            if (userId === excludeUserId && connections.has(connectionId)) {
              shouldSkip = true;
              break;
            }
          }
          if (shouldSkip) continue;
        }
        
        ws.send(JSON.stringify(event));
        sentCount++;
      }
    }
    return sentCount;
  }

  // Register event handler
  on(eventType: string, handler: (event: RealtimeEvent) => void) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // Emit event to handlers
  emit(eventType: string, event: RealtimeEvent) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  // Handle incoming message
  handleMessage(connectionId: string, message: string) {
    try {
      const event = JSON.parse(message) as RealtimeEvent;
      
      // Handle subscription requests
      if (event.type === 'subscribe') {
        const { channels } = event.data;
        // In a real implementation, you'd track subscriptions per connection
        this.sendToConnection(connectionId, {
          type: 'subscription_confirmed',
          data: { channels },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Handle unsubscription requests
      if (event.type === 'unsubscribe') {
        const { channels } = event.data;
        this.sendToConnection(connectionId, {
          type: 'unsubscription_confirmed',
          data: { channels },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Handle ping/pong for connection health
      if (event.type === 'ping') {
        this.sendToConnection(connectionId, {
          type: 'pong',
          data: { timestamp: event.timestamp },
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Emit the event to registered handlers
      this.emit(event.type, event);

    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendToConnection(connectionId, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      userConnections: Object.fromEntries(
        Array.from(this.userConnections.entries()).map(([userId, connections]) => [
          userId,
          connections.size
        ])
      )
    };
  }

  // Close all connections
  closeAll() {
    for (const [connectionId, ws] of this.connections.entries()) {
      ws.close();
    }
    this.connections.clear();
    this.userConnections.clear();
  }
}

// Global realtime manager instance
export const realtimeManager = new RealtimeManager();

// Server-Sent Events (SSE) manager for HTTP-based real-time updates
export class SSEManager {
  private connections: Map<string, NodeJS.WritableStream> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();

  addConnection(connectionId: string, stream: NodeJS.WritableStream, userId?: string) {
    this.connections.set(connectionId, stream);
    
    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);
    }

    // Send initial connection event
    this.sendToConnection(connectionId, {
      type: 'connection_established',
      data: { connectionId, userId },
      timestamp: new Date().toISOString()
    });

    // Set up heartbeat
    const heartbeat = setInterval(() => {
      this.sendToConnection(connectionId, {
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString()
      });
    }, 30000);

    // Store heartbeat interval for cleanup
    (stream as NodeJS.WritableStream & { _heartbeat?: NodeJS.Timeout })._heartbeat = heartbeat;

    console.log(`SSE connection added: ${connectionId}${userId ? ` for user ${userId}` : ''}`);
  }

  removeConnection(connectionId: string) {
    const stream = this.connections.get(connectionId);
    if (stream) {
      // Clear heartbeat
      const heartbeat = (stream as NodeJS.WritableStream & { _heartbeat?: NodeJS.Timeout })._heartbeat;
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      
      stream.end();
      this.connections.delete(connectionId);
      
      // Remove from user connections
      for (const [userId, connections] of this.userConnections.entries()) {
        if (connections.has(connectionId)) {
          connections.delete(connectionId);
          if (connections.size === 0) {
            this.userConnections.delete(userId);
          }
          break;
        }
      }
      
      console.log(`SSE connection removed: ${connectionId}`);
    }
  }

  sendToConnection(connectionId: string, event: RealtimeEvent) {
    const stream = this.connections.get(connectionId);
    if (stream && !(stream as NodeJS.WritableStream & { destroyed?: boolean }).destroyed) {
      try {
        stream.write(`data: ${JSON.stringify(event)}\n\n`);
        return true;
      } catch (error) {
        console.error(`Error sending SSE event to ${connectionId}:`, error);
        this.removeConnection(connectionId);
        return false;
      }
    }
    return false;
  }

  sendToUser(userId: string, event: RealtimeEvent) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      let sentCount = 0;
      for (const connectionId of connections) {
        if (this.sendToConnection(connectionId, event)) {
          sentCount++;
        }
      }
      return sentCount;
    }
    return 0;
  }

  broadcast(event: RealtimeEvent, excludeUserId?: string) {
    let sentCount = 0;
    for (const [connectionId, stream] of this.connections.entries()) {
      if (!(stream as NodeJS.WritableStream & { destroyed?: boolean }).destroyed) {
        // Skip if this connection belongs to the excluded user
        if (excludeUserId) {
          let shouldSkip = false;
          for (const [userId, connections] of this.userConnections.entries()) {
            if (userId === excludeUserId && connections.has(connectionId)) {
              shouldSkip = true;
              break;
            }
          }
          if (shouldSkip) continue;
        }
        
        try {
          stream.write(`data: ${JSON.stringify(event)}\n\n`);
          sentCount++;
        } catch (error) {
          console.error(`Error broadcasting SSE event to ${connectionId}:`, error);
          this.removeConnection(connectionId);
        }
      }
    }
    return sentCount;
  }

  closeAll() {
    for (const [connectionId, stream] of this.connections.entries()) {
      const heartbeat = (stream as any)._heartbeat;
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      stream.end();
    }
    this.connections.clear();
    this.userConnections.clear();
  }
}

// Global SSE manager instance
export const sseManager = new SSEManager();

// Helper functions for common real-time operations
export const realtime = {
  // Send notification to user
  async sendNotification(userId: string, notification: NotificationEvent['data']) {
    const event: NotificationEvent = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
      userId
    };

    // Send via WebSocket
    const wsSent = realtimeManager.sendToUser(userId, event);
    
    // Send via SSE
    const sseSent = sseManager.sendToUser(userId, event);

    // Store notification in database
    const supabase = createServerClient();
    await supabase.from('notifications').insert([{
      recipient_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification as Record<string, unknown>,
      priority: notification.priority
    }]);

    return { wsSent, sseSent };
  },

  // Send project update to client
  async sendProjectUpdate(clientId: string, projectUpdate: ProjectUpdateEvent['data']) {
    const event: ProjectUpdateEvent = {
      type: 'project_update',
      data: projectUpdate,
      timestamp: new Date().toISOString(),
      userId: clientId
    };

    const wsSent = realtimeManager.sendToUser(clientId, event);
    const sseSent = sseManager.sendToUser(clientId, event);

    return { wsSent, sseSent };
  },

  // Send payment update
  async sendPaymentUpdate(clientId: string, paymentUpdate: PaymentEvent['data']) {
    const event: PaymentEvent = {
      type: paymentUpdate.status === 'succeeded' ? 'payment_success' : 'payment_failed',
      data: paymentUpdate,
      timestamp: new Date().toISOString(),
      userId: clientId
    };

    const wsSent = realtimeManager.sendToUser(clientId, event);
    const sseSent = sseManager.sendToUser(clientId, event);

    return { wsSent, sseSent };
  },

  // Send support ticket update
  async sendSupportTicketUpdate(clientId: string, ticketUpdate: SupportTicketEvent['data']) {
    const event: SupportTicketEvent = {
      type: 'ticket_update',
      data: ticketUpdate,
      timestamp: new Date().toISOString(),
      userId: clientId
    };

    const wsSent = realtimeManager.sendToUser(clientId, event);
    const sseSent = sseManager.sendToUser(clientId, event);

    return { wsSent, sseSent };
  },

  // Broadcast system announcement
  async broadcastSystemAnnouncement(message: string, priority: string = 'normal') {
    const event: RealtimeEvent = {
      type: 'system_announcement',
      data: { message, priority },
      timestamp: new Date().toISOString()
    };

    const wsSent = realtimeManager.broadcast(event);
    const sseSent = sseManager.broadcast(event);

    return { wsSent, sseSent };
  }
};

// WebSocket route handler
export function handleWebSocketConnection(request: NextRequest, ws: WebSocket) {
  const connectionId = generateConnectionId();
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || undefined;

  realtimeManager.addConnection(connectionId, ws, userId);

  // Cast WebSocket to access Node.js WebSocket methods
  const nodeWs = ws as unknown as { 
    on: (event: string, listener: (...args: unknown[]) => void) => void; 
    close: () => void;
  };

  nodeWs.on('message', (data: unknown) => {
    realtimeManager.handleMessage(connectionId, Buffer.from(data as Buffer).toString());
  });

  nodeWs.on('close', () => {
    realtimeManager.removeConnection(connectionId);
  });

  nodeWs.on('error', (error: unknown) => {
    console.error(`WebSocket error for connection ${connectionId}:`, error);
    realtimeManager.removeConnection(connectionId);
  });
}

// SSE route handler
export function handleSSEConnection(request: NextRequest, stream: NodeJS.WritableStream) {
  const connectionId = generateConnectionId();
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || undefined;

  // Set SSE headers
  stream.write('HTTP/1.1 200 OK\r\n');
  stream.write('Content-Type: text/event-stream\r\n');
  stream.write('Cache-Control: no-cache\r\n');
  stream.write('Connection: keep-alive\r\n');
  stream.write('Access-Control-Allow-Origin: *\r\n');
  stream.write('Access-Control-Allow-Headers: Cache-Control\r\n');
  stream.write('\r\n');

  sseManager.addConnection(connectionId, stream, userId);

  // Handle connection close
  request.signal.addEventListener('abort', () => {
    sseManager.removeConnection(connectionId);
  });
}

// Helper function to generate unique connection IDs
function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
