import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  PhoenixdNodeInfo,
  WalletBalance,
  Channel,
  Payment,
  Invoice,
  LiquiditySnapshot,
  DashboardMetrics,
  NotificationSettings,
  TransactionHistory,
} from '@/types';

interface PhoenixStore {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Node information
  nodeInfo: PhoenixdNodeInfo | null;
  balance: WalletBalance | null;
  channels: Channel[];

  // Transaction history
  payments: Payment[];
  invoices: Invoice[];
  transactionHistory: TransactionHistory | null;

  // Liquidity management
  liquiditySnapshots: LiquiditySnapshot[];
  currentLiquidity: number;
  liquidityTarget: number;
  liquidityAlerts: boolean;

  // Dashboard metrics
  metrics: DashboardMetrics | null;

  // Settings
  notifications: NotificationSettings;
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';

  // Real-time updates
  lastUpdate: number;
  updateFrequency: number;

  // Actions
  setConnectionStatus: (status: PhoenixStore['connectionStatus']) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setNodeInfo: (nodeInfo: PhoenixdNodeInfo | null) => void;
  setBalance: (balance: WalletBalance | null) => void;
  setChannels: (channels: Channel[]) => void;
  addPayment: (payment: Payment) => void;
  addInvoice: (invoice: Invoice) => void;
  updatePayment: (paymentHash: string, updates: Partial<Payment>) => void;
  updateInvoice: (paymentHash: string, updates: Partial<Invoice>) => void;
  setTransactionHistory: (history: TransactionHistory) => void;
  addLiquiditySnapshot: (snapshot: LiquiditySnapshot) => void;
  setMetrics: (metrics: DashboardMetrics) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  setTheme: (theme: PhoenixStore['theme']) => void;
  updateLastUpdate: () => void;
  reset: () => void;
}

const initialNotifications: NotificationSettings = {
  paymentReceived: true,
  paymentSent: true,
  channelOpened: true,
  channelClosed: true,
  lowLiquidity: true,
  highFees: false,
};

export const usePhoenixStore = create<PhoenixStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    isLoading: false,
    error: null,
    connectionStatus: 'disconnected',

    nodeInfo: null,
    balance: null,
    channels: [],

    payments: [],
    invoices: [],
    transactionHistory: null,

    liquiditySnapshots: [],
    currentLiquidity: 0,
    liquidityTarget: 1000000, // 1M sats default
    liquidityAlerts: true,

    metrics: null,

    notifications: initialNotifications,
    autoRefresh: false, // Disable by default to reduce API calls
    refreshInterval: 60000, // 1 minute
    theme: 'auto',

    lastUpdate: 0,
    updateFrequency: 0,

    // Actions
    setConnectionStatus: (status) => set({ connectionStatus: status, isConnected: status === 'connected' }),

    setError: (error) => set({ error }),

    setLoading: (loading) => set({ isLoading: loading }),

    setNodeInfo: (nodeInfo) => set({ nodeInfo }),

    setBalance: (balance) => set({ balance }),

    setChannels: (channels) => {
      const currentLiquidity = channels.reduce((sum, channel) =>
        sum + channel.inboundLiquidityMsat + channel.outboundLiquidityMsat, 0
      );
      set({ channels, currentLiquidity });
    },

    addPayment: (payment) => set((state) => ({
      payments: [payment, ...state.payments].slice(0, 100) // Keep last 100
    })),

    addInvoice: (invoice) => set((state) => ({
      invoices: [invoice, ...state.invoices].slice(0, 100) // Keep last 100
    })),

    updatePayment: (paymentHash, updates) => set((state) => ({
      payments: state.payments.map(p =>
        p.paymentHash === paymentHash ? { ...p, ...updates } : p
      )
    })),

    updateInvoice: (paymentHash, updates) => set((state) => ({
      invoices: state.invoices.map(i =>
        i.paymentHash === paymentHash ? { ...i, ...updates } : i
      )
    })),

    setTransactionHistory: (transactionHistory) => set({ transactionHistory }),

    addLiquiditySnapshot: (snapshot) => set((state) => ({
      liquiditySnapshots: [...state.liquiditySnapshots, snapshot]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100) // Keep last 100 snapshots
    })),

    setMetrics: (metrics) => set({ metrics }),

    updateNotifications: (settings) => set((state) => ({
      notifications: { ...state.notifications, ...settings }
    })),

    setAutoRefresh: (autoRefresh) => set({ autoRefresh }),

    setRefreshInterval: (refreshInterval) => set({ refreshInterval }),

    setTheme: (theme) => set({ theme }),

    updateLastUpdate: () => {
      const now = Date.now();
      const { lastUpdate } = get();
      const frequency = lastUpdate > 0 ? now - lastUpdate : 0;
      set({ lastUpdate: now, updateFrequency: frequency });
    },

    reset: () => set({
      isConnected: false,
      isLoading: false,
      error: null,
      connectionStatus: 'disconnected',
      nodeInfo: null,
      balance: null,
      channels: [],
      payments: [],
      invoices: [],
      transactionHistory: null,
      liquiditySnapshots: [],
      currentLiquidity: 0,
      metrics: null,
      lastUpdate: 0,
      updateFrequency: 0,
    }),
  }))
);

// Selectors for computed values
export const useChannelStats = () => {
  return usePhoenixStore((state) => {
    const { channels } = state;
    const totalCapacity = channels.reduce((sum, ch) => sum + ch.capacityMsat, 0);
    const totalInbound = channels.reduce((sum, ch) => sum + ch.inboundLiquidityMsat, 0);
    const totalOutbound = channels.reduce((sum, ch) => sum + ch.outboundLiquidityMsat, 0);
    const activeChannels = channels.filter(ch => ch.state === 'NORMAL').length;
    const inactiveChannels = channels.filter(ch => ch.state === 'OFFLINE').length;
    const closingChannels = channels.filter(ch => ch.state === 'CLOSING').length;

    return {
      totalCapacity,
      totalInbound,
      totalOutbound,
      averageCapacity: channels.length > 0 ? totalCapacity / channels.length : 0,
      channelCount: channels.length,
      activeChannels,
      inactiveChannels,
      closingChannels,
      liquidityUtilization: totalCapacity > 0 ? (totalInbound + totalOutbound) / totalCapacity : 0,
    };
  });
};

export const useRecentTransactions = (limit = 10) => {
  return usePhoenixStore((state) => {
    const allTransactions = [...state.payments, ...state.invoices]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return allTransactions;
  });
};