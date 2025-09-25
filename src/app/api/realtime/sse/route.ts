import { NextRequest } from 'next/server';
import { sseManager } from '@/lib/realtime';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Create a readable stream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Send SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });
    
    // Add connection to SSE manager
    const connectionId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a custom writable stream interface
    const customStream = {
      write: (chunk: string) => writer.write(encoder.encode(chunk)),
      end: () => writer.close(),
      destroyed: false,
    } as unknown as NodeJS.WritableStream & { destroyed?: boolean };
    
    sseManager.addConnection(connectionId, customStream, userId || undefined);
    
    // Send initial connection event
    customStream.write(`data: ${JSON.stringify({
      type: 'connection_established',
      data: { connectionId, userId },
      timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Handle connection close
    request.signal.addEventListener('abort', () => {
      sseManager.removeConnection(connectionId);
      (customStream as NodeJS.WritableStream & { destroyed?: boolean }).destroyed = true;
      writer.close();
    });
    
    // Set up heartbeat
    const heartbeat = setInterval(() => {
      try {
        customStream.write(`data: ${JSON.stringify({
          type: 'heartbeat',
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString()
        })}\n\n`);
      } catch (error) {
        clearInterval(heartbeat);
        sseManager.removeConnection(connectionId);
      }
    }, 30000);
    
    // Store heartbeat for cleanup
    (customStream as NodeJS.WritableStream & { _heartbeat?: NodeJS.Timeout })._heartbeat = heartbeat;
    
    // Return the stream response
    return new Response(stream.readable, {
      headers,
    });
    
  } catch (error) {
    console.error('SSE endpoint error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const runtime = 'edge';
