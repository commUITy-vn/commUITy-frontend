import { env } from '@/config/env';

export interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

export class StompClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private connected = false;
  private connecting = false;
  private subscriptions: Map<string, { destination: string; callback: (frame: StompFrame) => void }> = new Map();
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private subCounter = 0;
  private reconnectTimeout: any = null;
  private reconnectDelay = 1000; // start with 1s
  private maxReconnectDelay = 16000; // max 16s

  constructor() {}

  public isConnected() {
    return this.connected;
  }

  public connect(
    token: string,
    onConnect?: () => void,
    onError?: (err: any) => void,
    onDisconnect?: () => void
  ) {
    if (onConnect) this.onConnectCallback = onConnect;
    if (onError) this.onErrorCallback = onError;
    if (onDisconnect) this.onDisconnectCallback = onDisconnect;

    // If already connected with the same token, don't reconnect
    if (this.connected && this.token === token) {
      console.log('[STOMP] Already connected.');
      if (this.onConnectCallback) this.onConnectCallback();
      return;
    }

    // If currently connecting with the same token, don't start a duplicate connection
    if (this.connecting && this.token === token) {
      console.log('[STOMP] Connection already in progress.');
      return;
    }

    this.token = token;
    this.connecting = true;
    
    // Clear any existing reconnect timers
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Close existing socket if open
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    const wsUrl = env.API_URL.replace(/^http/, 'ws') + '/ws';
    console.log('[STOMP] Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[STOMP] WebSocket transport open, sending CONNECT...');
        this.sendFrame('CONNECT', {
          accept: '1.1,1.2',
          'host': 'localhost',
          'Authorization': `Bearer ${this.token}`,
        });
      };

      this.ws.onmessage = (event) => {
        const frame = this.parseFrame(event.data as string);
        if (!frame) return;

        console.log('[STOMP] Received frame:', frame.command);
        if (frame.command === 'CONNECTED') {
          this.connected = true;
          this.connecting = false;
          this.reconnectDelay = 1000; // Reset reconnect delay on successful connection
          console.log('[STOMP] Connection established!');
          if (this.onConnectCallback) {
            this.onConnectCallback();
          }
          // Re-subscribe all active subscriptions
          this.resubscribeAll();
        } else if (frame.command === 'MESSAGE') {
          const subscriptionId = frame.headers['subscription'];
          const destination = frame.headers['destination'];
          
          if (subscriptionId) {
            const sub = this.subscriptions.get(subscriptionId);
            if (sub) {
              sub.callback(frame);
            }
          } else if (destination) {
            // Fallback: notify all subscriptions matching destination
            this.subscriptions.forEach((sub) => {
              if (sub.destination === destination) {
                sub.callback(frame);
              }
            });
          }
        } else if (frame.command === 'ERROR') {
          console.error('[STOMP] Protocol error frame:', frame.body);
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error(frame.body));
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('[STOMP] WebSocket transport error:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[STOMP] WebSocket transport closed:', event.code, event.reason);
        this.connected = false;
        this.connecting = false;
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
        // Trigger automatic reconnect if we still have a token
        if (this.token) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error('[STOMP] Failed to establish WebSocket connection:', err);
      this.connected = false;
      this.connecting = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
      if (this.token) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    
    console.log(`[STOMP] Scheduling reconnect in ${this.reconnectDelay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.token) {
        this.connect(this.token);
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    }, this.reconnectDelay);
  }

  public subscribe(destination: string, callback: (frame: StompFrame) => void): string {
    const subId = `sub-${this.subCounter++}`;
    this.subscriptions.set(subId, { destination, callback });

    if (this.connected) {
      console.log(`[STOMP] Subscribing to ${destination} with ID ${subId}`);
      this.sendFrame('SUBSCRIBE', {
        id: subId,
        destination,
        ack: 'auto',
      });
    }

    return subId;
  }

  public unsubscribe(subId: string) {
    this.subscriptions.delete(subId);
    if (this.connected) {
      console.log(`[STOMP] Unsubscribing from ID ${subId}`);
      this.sendFrame('UNSUBSCRIBE', {
        id: subId,
      });
    }
  }

  public send(destination: string, body: string, headers: Record<string, string> = {}) {
    if (!this.connected) {
      console.warn('[STOMP] Not connected. Queueing/ignoring send.');
      return;
    }
    this.sendFrame('SEND', {
      destination,
      ...headers,
    }, body);
  }

  public disconnect() {
    console.log('[STOMP] Disconnecting...');
    this.token = null; // stop reconnecting
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connected) {
      try {
        this.sendFrame('DISCONNECT', {});
      } catch (e) {}
    }
    this.connected = false;
    this.connecting = false;
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }

  private resubscribeAll() {
    this.subscriptions.forEach((sub, subId) => {
      console.log(`[STOMP] Re-subscribing to ${sub.destination} with ID ${subId}`);
      this.sendFrame('SUBSCRIBE', {
        id: subId,
        destination: sub.destination,
        ack: 'auto',
      });
    });
  }

  private sendFrame(command: string, headers: Record<string, string>, body = '') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[STOMP] Cannot send frame, WebSocket is not open.');
      return;
    }

    let frameStr = `${command}\n`;
    Object.entries(headers).forEach(([k, v]) => {
      frameStr += `${k}:${v}\n`;
    });
    frameStr += `\n${body}\0`;

    this.ws.send(frameStr);
  }

  private parseFrame(data: string): StompFrame | null {
    if (!data) return null;

    const nullIdx = data.indexOf('\0');
    const frameContent = nullIdx !== -1 ? data.slice(0, nullIdx) : data;

    const parts = frameContent.split('\n\n');
    const headerLines = parts[0].split('\n');
    const command = headerLines[0].trim();
    const headers: Record<string, string> = {};

    for (let i = 1; i < headerLines.length; i++) {
      const line = headerLines[i].trim();
      if (!line) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        headers[key] = value;
      }
    }

    const body = parts.slice(1).join('\n\n');

    return {
      command,
      headers,
      body,
    };
  }
}

export const stompClient = new StompClient();
