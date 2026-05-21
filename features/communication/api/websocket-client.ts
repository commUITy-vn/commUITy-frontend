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
  private subscriptions: Map<string, (frame: StompFrame) => void> = new Map();
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onErrorCallback: ((err: any) => void) | null = null;
  private subCounter = 0;

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
    this.token = token;
    if (onConnect) this.onConnectCallback = onConnect;
    if (onError) this.onErrorCallback = onError;
    if (onDisconnect) this.onDisconnectCallback = onDisconnect;

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
          console.log('[STOMP] Connection established!');
          if (this.onConnectCallback) {
            this.onConnectCallback();
          }
          // Re-subscribe if we had any active subscriptions
          this.resubscribeAll();
        } else if (frame.command === 'MESSAGE') {
          const subscriptionId = frame.headers['subscription'];
          const destination = frame.headers['destination'];
          const callback = this.subscriptions.get(subscriptionId) || this.subscriptions.get(destination);
          if (callback) {
            callback(frame);
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
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      };
    } catch (err) {
      console.error('[STOMP] Failed to establish WebSocket connection:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
    }
  }

  public subscribe(destination: string, callback: (frame: StompFrame) => void): string {
    const subId = `sub-${this.subCounter++}`;
    this.subscriptions.set(subId, callback);
    this.subscriptions.set(destination, callback); // also store by destination for convenience

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
    if (this.connected) {
      this.sendFrame('DISCONNECT', {});
    }
    this.connected = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private resubscribeAll() {
    // Collect unique destinations
    const destinations = Array.from(this.subscriptions.entries())
      .filter(([key]) => !key.startsWith('sub-'))
      .map(([destination]) => destination);

    destinations.forEach((dest) => {
      const callback = this.subscriptions.get(dest);
      if (callback) {
        const subId = `sub-${this.subCounter++}`;
        this.subscriptions.set(subId, callback);
        console.log(`[STOMP] Re-subscribing to ${dest} with ID ${subId}`);
        this.sendFrame('SUBSCRIBE', {
          id: subId,
          destination: dest,
          ack: 'auto',
        });
      }
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
