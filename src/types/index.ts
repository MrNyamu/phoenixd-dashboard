export interface PhoenixdNodeInfo {
  version: string;
  nodeId: string;
  chainHash: string;
  blockHeight: number;
  channels: Channel[];
}

export interface Channel {
  channelId: string;
  state: 'NORMAL' | 'OFFLINE' | 'CLOSING';
  balanceMsat: number;
  inboundLiquidityMsat: number;
  outboundLiquidityMsat: number;
  capacityMsat: number;
  fundingTxId: string;
  closingTxId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  paymentHash: string;
  paymentPreimage?: string;
  recipientAmountMsat: number;
  routingFeeMsat: number;
  paymentRequest: string;
  description?: string;
  createdAt: number;
  completedAt?: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  failureReason?: string;
}

export interface Invoice {
  paymentHash: string;
  serialized: string;
  description?: string;
  amountMsat?: number;
  expiresAt: number;
  createdAt: number;
  receivedAt?: number;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
}

export interface WalletBalance {
  balanceMsat: number;
  feeCreditMsat: number;
}

export interface LiquidityAd {
  source: string;
  amountMsat: number;
  paymentFeeMsat: number;
  paymentHash: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: number;
}

export interface LiquidityPolicy {
  maxRelativeFeeBasisPoints: number;
  maxAbsoluteFeeMsat: number;
  minFinalCltvExpiryDelta: number;
  channelMinimumMsat: number;
  fundingFeeBasisPoints: number;
}

export interface FeePolicy {
  baseFee: number;
  proportionalFee: number;
  cltvExpiryDelta: number;
}

export interface TransactionHistory {
  transactions: (Payment | Invoice)[];
  totalCount: number;
  offset: number;
  limit: number;
}

export interface ChannelStats {
  totalCapacity: number;
  totalInbound: number;
  totalOutbound: number;
  averageCapacity: number;
  channelCount: number;
  activeChannels: number;
  inactiveChannels: number;
  closingChannels: number;
}

export interface LiquiditySnapshot {
  timestamp: number;
  totalLiquidity: number;
  inboundLiquidity: number;
  outboundLiquidity: number;
  channelCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PhoenixdConfig {
  url: string;
  password: string;
  network: 'mainnet' | 'testnet' | 'regtest';
}

export interface NotificationSettings {
  paymentReceived: boolean;
  paymentSent: boolean;
  channelOpened: boolean;
  channelClosed: boolean;
  lowLiquidity: boolean;
  highFees: boolean;
}

export interface DashboardMetrics {
  totalBalance: number;
  totalChannels: number;
  totalPayments: number;
  totalInvoices: number;
  avgChannelSize: number;
  liquidityUtilization: number;
  routingRevenue: number;
  uptime: number;
}