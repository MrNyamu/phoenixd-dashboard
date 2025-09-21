import { useEffect, useCallback, useRef } from 'react';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import { createPhoenixAPI, getPhoenixAPI } from '@/lib/phoenix-api';
import type { PhoenixdConfig, LiquiditySnapshot } from '@/types';

const DEFAULT_CONFIG: PhoenixdConfig = {
  url: process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740',
  password: process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'your-phoenix-password',
  network: (process.env.NEXT_PUBLIC_PHOENIX_NETWORK as any) || 'testnet',
};

export const usePhoenixConnection = (config: PhoenixdConfig = DEFAULT_CONFIG) => {
  const store = usePhoenixStore();
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const connect = useCallback(async () => {
    try {
      store.setConnectionStatus('connecting');
      store.setError(null);

      // Initialize API
      const api = createPhoenixAPI(config);

      // Test connection
      const pingResponse = await api.ping();
      if (!pingResponse.success) {
        throw new Error(pingResponse.error || 'Failed to connect');
      }

      store.setConnectionStatus('connected');
      console.log('✅ Connected to PhoenixD');

      // Setup WebSocket for real-time updates
      wsRef.current = api.createWebSocket(
        (data) => {
          console.log('📡 WebSocket data:', data);
          // eslint-disable-next-line react-hooks/exhaustive-deps
          handleRealtimeUpdate(data);
        },
        (error) => {
          console.error('❌ WebSocket error:', error);
          store.setError('WebSocket connection failed');
        }
      );

      return api;
    } catch (error: any) {
      console.error('❌ Connection failed:', error);
      store.setConnectionStatus('error');
      store.setError(error.message || 'Connection failed');
      throw error;
    }
  }, [config, store]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    store.setConnectionStatus('disconnected');
    console.log('🔌 Disconnected from PhoenixD');
  }, [store]);

  const handleRealtimeUpdate = useCallback((data: any) => {
    store.updateLastUpdate();

    if (data.type === 'payment_received') {
      store.addInvoice(data.invoice);
    } else if (data.type === 'payment_sent') {
      store.addPayment(data.payment);
    } else if (data.type === 'channel_opened') {
      // Refresh channels
      refreshChannels();
    } else if (data.type === 'channel_closed') {
      // Refresh channels
      refreshChannels();
    } else if (data.type === 'balance_updated') {
      store.setBalance(data.balance);
    }
  }, [store]);

  const refreshChannels = useCallback(async () => {
    try {
      const api = getPhoenixAPI();
      const response = await api.listChannels();
      if (response.success && response.data) {
        store.setChannels(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh channels:', error);
    }
  }, [store]);

  return {
    connect,
    disconnect,
    isConnected: store.isConnected,
    connectionStatus: store.connectionStatus,
    error: store.error,
  };
};

export const usePhoenixData = () => {
  const store = usePhoenixStore();

  const fetchNodeInfo = useCallback(async () => {
    try {
      store.setLoading(true);
      const api = getPhoenixAPI();
      const response = await api.getInfo();

      if (response.success && response.data) {
        store.setNodeInfo(response.data);
      } else {
        store.setError(response.error || 'Failed to fetch node info');
      }
    } catch (error: any) {
      store.setError(error.message);
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const fetchBalance = useCallback(async () => {
    try {
      const api = getPhoenixAPI();
      const response = await api.getBalance();

      if (response.success && response.data) {
        store.setBalance(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch balance:', error);
    }
  }, [store]);

  const fetchChannels = useCallback(async () => {
    try {
      const api = getPhoenixAPI();
      const response = await api.listChannels();

      if (response.success && response.data) {
        store.setChannels(response.data);

        // Create liquidity snapshot
        const totalInbound = response.data.reduce((sum, ch) => sum + ch.inboundLiquidityMsat, 0);
        const totalOutbound = response.data.reduce((sum, ch) => sum + ch.outboundLiquidityMsat, 0);
        const snapshot: LiquiditySnapshot = {
          timestamp: Date.now(),
          totalLiquidity: totalInbound + totalOutbound,
          inboundLiquidity: totalInbound,
          outboundLiquidity: totalOutbound,
          channelCount: response.data.length,
        };
        store.addLiquiditySnapshot(snapshot);
      }
    } catch (error: any) {
      console.error('Failed to fetch channels:', error);
    }
  }, [store]);

  const fetchPayments = useCallback(async (params?: { count?: number; skip?: number }) => {
    try {
      const api = getPhoenixAPI();
      const response = await api.listPayments(params);

      if (response.success && response.data) {
        store.setTransactionHistory(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch payments:', error);
    }
  }, [store]);

  const fetchInvoices = useCallback(async (params?: { count?: number; skip?: number }) => {
    try {
      const api = getPhoenixAPI();
      const response = await api.listInvoices(params);

      if (response.success && response.data) {
        response.data.forEach(invoice => store.addInvoice(invoice));
      }
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error);
    }
  }, [store]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchNodeInfo(),
      fetchBalance(),
      fetchChannels(),
      fetchPayments({ count: 50 }),
      fetchInvoices({ count: 50 }),
    ]);
  }, [fetchNodeInfo, fetchBalance, fetchChannels, fetchPayments, fetchInvoices]);

  return {
    fetchNodeInfo,
    fetchBalance,
    fetchChannels,
    fetchPayments,
    fetchInvoices,
    refreshAll,
    isLoading: store.isLoading,
  };
};

export const useAutoRefresh = () => {
  const { autoRefresh, refreshInterval } = usePhoenixStore();
  const { refreshAll } = usePhoenixData();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(refreshAll, refreshInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, refreshAll]);

  return { autoRefresh, refreshInterval };
};

export const usePaymentOperations = () => {
  const store = usePhoenixStore();

  const sendPayment = useCallback(async (invoice: string, amountMsat?: number) => {
    try {
      store.setLoading(true);
      const api = getPhoenixAPI();
      const response = await api.sendPayment({
        invoice,
        amountMsat,
        timeoutSeconds: 60,
      });

      if (response.success && response.data) {
        store.addPayment(response.data);
        return { success: true, payment: response.data };
      } else {
        throw new Error(response.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const createInvoice = useCallback(async (params: {
    amountMsat?: number;
    description?: string;
    expirySeconds?: number;
  }) => {
    try {
      store.setLoading(true);
      const api = getPhoenixAPI();
      const response = await api.createInvoice(params);

      if (response.success && response.data) {
        store.addInvoice(response.data);
        return { success: true, invoice: response.data };
      } else {
        throw new Error(response.error || 'Failed to create invoice');
      }
    } catch (error: any) {
      console.error('Failed to create invoice:', error);
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const estimateFees = useCallback(async (invoice: string, amountMsat?: number) => {
    try {
      const api = getPhoenixAPI();
      const response = await api.estimateFees({ invoice, amountMsat });
      return response;
    } catch (error: any) {
      console.error('Failed to estimate fees:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    sendPayment,
    createInvoice,
    estimateFees,
    isLoading: store.isLoading,
  };
};

export const useLiquidityOperations = () => {
  const store = usePhoenixStore();

  const requestLiquidity = useCallback(async (params: {
    amountMsat: number;
    leaseDurationBlocks?: number;
    maxFeeRateBasisPoints?: number;
  }) => {
    try {
      store.setLoading(true);
      const api = getPhoenixAPI();
      const response = await api.requestLiquidity(params);

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.error || 'Failed to request liquidity');
      }
    } catch (error: any) {
      console.error('Failed to request liquidity:', error);
      return { success: false, error: error.message };
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const getLiquidityAds = useCallback(async () => {
    try {
      const api = getPhoenixAPI();
      const response = await api.getLiquidityAds();
      return response;
    } catch (error: any) {
      console.error('Failed to get liquidity ads:', error);
      return { success: false, error: error.message };
    }
  }, []);

  return {
    requestLiquidity,
    getLiquidityAds,
    isLoading: store.isLoading,
  };
};