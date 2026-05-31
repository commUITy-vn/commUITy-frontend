import { env } from '@/config/env';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import * as encoding from 'text-encoding';

const { TextEncoder, TextDecoder } = encoding as any;
if (!globalThis.TextEncoder && TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}
if (!globalThis.TextDecoder && TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}

export interface StompFrame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

type StoredSubscription = {
  destination: string;
  callback: (frame: StompFrame) => void;
  stompSubscription?: StompSubscription;
};

export class StompClient {
  private client: Client | null = null;
  private token: string | null = null;
  private connected = false;
  private connecting = false;
  private subscriptions: Map<string, StoredSubscription> = new Map();
  private onConnectCallbacks: (() => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];
  private onErrorCallbacks: ((err: any) => void)[] = [];
  private subCounter = 0;

  public isConnected() {
    return this.connected;
  }

  public connect(
    token: string,
    onConnect?: () => void,
    onError?: (err: any) => void,
    onDisconnect?: () => void
  ) {
    if (this.connected && this.token === token) {
      onConnect?.();
      return;
    }

    if (this.connecting && this.token === token) {
      if (onConnect) this.onConnectCallbacks.push(onConnect);
      if (onError) this.onErrorCallbacks.push(onError);
      if (onDisconnect) this.onDisconnectCallbacks.push(onDisconnect);
      return;
    }

    if (onConnect) this.onConnectCallbacks.push(onConnect);
    if (onError) this.onErrorCallbacks.push(onError);
    if (onDisconnect) this.onDisconnectCallbacks.push(onDisconnect);

    this.token = token;
    this.connected = false;
    this.connecting = true;
    this.createClient(token);
    this.client?.activate();
  }

  public subscribe(destination: string, callback: (frame: StompFrame) => void): string {
    const subId = `sub-${this.subCounter++}`;
    const stored: StoredSubscription = { destination, callback };
    this.subscriptions.set(subId, stored);

    if (this.connected) {
      this.activateSubscription(subId, stored);
    }

    return subId;
  }

  public unsubscribe(subId: string) {
    const sub = this.subscriptions.get(subId);
    if (sub?.stompSubscription) {
      try {
        sub.stompSubscription.unsubscribe();
      } catch (e) {
        console.error('[STOMP] Failed to unsubscribe:', e);
      }
    }
    this.subscriptions.delete(subId);
  }

  public send(destination: string, body: string, headers: Record<string, string> = {}) {
    if (!this.connected || !this.client) {
      return;
    }

    this.client.publish({
      destination,
      headers,
      body,
    });
  }

  public disconnect() {
    this.token = null;
    this.connected = false;
    this.connecting = false;
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onErrorCallbacks = [];

    this.subscriptions.forEach((sub) => {
      sub.stompSubscription = undefined;
    });

    if (this.client) {
      const client = this.client;
      this.client = null;
      client.deactivate();
    }
  }

  private createClient(token: string) {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    const brokerURL = this.buildWsUrl();

    this.client = new Client({
      webSocketFactory: () => new WebSocket(brokerURL) as any,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: 1000,
      debug: () => {},
      onConnect: () => {
        this.connected = true;
        this.connecting = false;

        this.resubscribeAll();

        const connects = [...this.onConnectCallbacks];
        this.onConnectCallbacks = [];
        connects.forEach((cb) => {
          try {
            cb();
          } catch (e) {
            console.error('[STOMP] Callback error in onConnect:', e);
          }
        });
      },
      onDisconnect: () => {
        this.connected = false;
        this.connecting = false;
        this.subscriptions.forEach((sub) => {
          sub.stompSubscription = undefined;
        });
      },
      onStompError: (frame) => {
        console.error('[STOMP] Protocol error frame:', frame.body);
        this.emitError(new Error(frame.body || 'STOMP protocol error'));
      },
      onWebSocketError: (event) => {
        console.error('[STOMP] WebSocket transport error:', event);
        this.emitError(event);
      },
      onWebSocketClose: (event) => {
        this.connected = false;
        this.connecting = false;
        this.subscriptions.forEach((sub) => {
          sub.stompSubscription = undefined;
        });

        const disconnects = [...this.onDisconnectCallbacks];
        disconnects.forEach((cb) => {
          try {
            cb();
          } catch (e) {}
        });
      },
    });
  }

  private activateSubscription(subId: string, sub: StoredSubscription) {
    if (!this.client || sub.stompSubscription) return;

    sub.stompSubscription = this.client.subscribe(
      sub.destination,
      (message: IMessage) => {
        sub.callback({
          command: 'MESSAGE',
          headers: message.headers as Record<string, string>,
          body: message.body,
        });
      },
      {
        id: subId,
        ack: 'auto',
      }
    );
  }

  private resubscribeAll() {
    this.subscriptions.forEach((sub) => {
      sub.stompSubscription = undefined;
    });
    this.subscriptions.forEach((sub, subId) => this.activateSubscription(subId, sub));
  }

  private emitError(error: any) {
    const errors = [...this.onErrorCallbacks];
    this.onErrorCallbacks = [];
    errors.forEach((cb) => {
      try {
        cb(error);
      } catch (e) {}
    });
  }

  private buildWsUrl(): string {
    try {
      const parsed = new URL(env.API_URL);
      const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${parsed.host}/ws`;
    } catch {
      return env.API_URL.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws';
    }
  }
}

export const stompClient = new StompClient();
