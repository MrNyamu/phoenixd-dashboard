import axios from 'axios';
import type {
  PhoenixdNodeInfo,
  WalletBalance,
  Channel,
  Payment,
  Invoice,
  ApiResponse,
  PhoenixdConfig,
  TransactionHistory,
} from '@/types';

class PhoenixAPI {
  private client: any;
  private config: PhoenixdConfig;

  constructor(config: PhoenixdConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.url,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      auth: {
        username: 'phoenix',
        password: config.password,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: any) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response: any) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        console.error('❌ Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      // Use Next.js API proxy instead of direct calls
      const apiEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const response = await fetch(`/api/phoenixd/${apiEndpoint}`, {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return {
        success: true,
        data: responseData,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    }
  }

  // Node information
  async getInfo(): Promise<ApiResponse<PhoenixdNodeInfo>> {
    return this.request<PhoenixdNodeInfo>('get', '/getinfo');
  }

  // Balance operations
  async getBalance(): Promise<ApiResponse<WalletBalance>> {
    return this.request<WalletBalance>('get', '/getbalance');
  }

  // Channel operations
  async listChannels(): Promise<ApiResponse<Channel[]>> {
    return this.request<Channel[]>('get', '/listchannels');
  }

  async openChannel(params: {
    nodeId: string;
    amountMsat: number;
    fundingFeeBasisPoints?: number;
    channelFlags?: number;
  }): Promise<ApiResponse<{ channelId: string; fundingTxId: string }>> {
    return this.request('post', '/openchannel', params);
  }

  async closeChannel(channelId: string, force = false): Promise<ApiResponse<{ closingTxId: string }>> {
    return this.request('post', '/closechannel', { channelId, force });
  }

  // Payment operations
  async sendPayment(params: {
    invoice: string;
    amountMsat?: number;
    timeoutSeconds?: number;
  }): Promise<ApiResponse<Payment>> {
    return this.request<Payment>('post', '/payinvoice', params);
  }

  async listPayments(params?: {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
  }): Promise<ApiResponse<TransactionHistory>> {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from.toString());
    if (params?.to) queryParams.append('to', params.to.toString());
    if (params?.count) queryParams.append('count', params.count.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());

    const endpoint = `/listpayments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<TransactionHistory>('get', endpoint);
  }

  // Invoice operations
  async createInvoice(params: {
    amountMsat?: number;
    description?: string;
    expirySeconds?: number;
    externalId?: string;
  }): Promise<ApiResponse<Invoice>> {
    return this.request<Invoice>('post', '/createinvoice', params);
  }

  async listInvoices(params?: {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
  }): Promise<ApiResponse<Invoice[]>> {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from.toString());
    if (params?.to) queryParams.append('to', params.to.toString());
    if (params?.count) queryParams.append('count', params.count.toString());
    if (params?.skip) queryParams.append('skip', params.skip.toString());

    const endpoint = `/listinvoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<Invoice[]>('get', endpoint);
  }

  async getInvoice(paymentHash: string): Promise<ApiResponse<Invoice>> {
    return this.request<Invoice>('get', `/getinvoice/${paymentHash}`);
  }

  // Liquidity operations
  async getLiquidityAds(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('get', '/getliquidityads');
  }

  async requestLiquidity(params: {
    amountMsat: number;
    leaseDurationBlocks?: number;
    maxFeeRateBasisPoints?: number;
  }): Promise<ApiResponse<any>> {
    return this.request('post', '/requestliquidity', params);
  }

  // WebSocket for real-time updates
  createWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket | null {
    try {
      // Create WebSocket URL with proper authentication
      const wsUrl = this.buildWebSocketUrl();
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected to PhoenixD');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 WebSocket data received:', data);
          onMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected from PhoenixD', event.code, event.reason);
        if (event.code !== 1000) {
          console.warn('⚠️ WebSocket closed unexpectedly, code:', event.code);
        }
      };

      return ws;
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      onError?.(error as Event);
      return null;
    }
  }

  private buildWebSocketUrl(): string {
    // Convert HTTP URL to WebSocket URL
    let wsUrl = this.config.url.replace(/^http/, 'ws');

    // Add WebSocket endpoint path
    if (!wsUrl.endsWith('/')) {
      wsUrl += '/';
    }
    wsUrl += 'ws';

    // Add authentication parameters
    const url = new URL(wsUrl);

    // Use basic auth in URL for WebSocket authentication
    if (this.config.password) {
      url.username = 'phoenix';
      url.password = this.config.password;
    }

    // Add any WebSocket-specific query parameters
    const wsSecret = process.env.PHOENIXD_WEBSOCKET_SECRET || process.env.PHOENIXD_WEBHOOK_SECRET;
    if (wsSecret) {
      url.searchParams.set('secret', wsSecret);
    }

    return url.toString();
  }

  // Health check
  async ping(): Promise<ApiResponse<{ pong: string }>> {
    return this.request<{ pong: string }>('get', '/ping');
  }

  // Test WebSocket connection
  testWebSocketConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const ws = this.createWebSocket(
          () => {
            console.log('✅ WebSocket test successful');
            ws?.close();
            resolve(true);
          },
          () => {
            console.log('❌ WebSocket test failed');
            resolve(false);
          }
        );

        if (!ws) {
          resolve(false);
          return;
        }

        // Timeout after 5 seconds
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            resolve(false);
          }
        }, 5000);
      } catch (error) {
        console.error('❌ WebSocket test error:', error);
        resolve(false);
      }
    });
  }

  // Network utilities
  async decodeBolt11(invoice: string): Promise<ApiResponse<any>> {
    return this.request('post', '/decodeinvoice', { invoice });
  }

  // Fee estimation
  async estimateFees(params: {
    invoice?: string;
    amountMsat?: number;
  }): Promise<ApiResponse<{ routingFeeMsat: number; serviceFee: number }>> {
    return this.request('post', '/estimatefees', params);
  }
}

// Singleton instance
let phoenixApiInstance: PhoenixAPI | null = null;

export const createPhoenixAPI = (config: PhoenixdConfig): PhoenixAPI => {
  phoenixApiInstance = new PhoenixAPI(config);
  return phoenixApiInstance;
};

export const getPhoenixAPI = (): PhoenixAPI => {
  if (!phoenixApiInstance) {
    throw new Error('PhoenixAPI not initialized. Call createPhoenixAPI first.');
  }
  return phoenixApiInstance;
};

export default PhoenixAPI;