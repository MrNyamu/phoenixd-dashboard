'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Wallet,
  Activity,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Mail,
  Plus,
  Receipt,
  Copy,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

interface PhoenixdConfig {
  url: string;
  password: string;
}

interface NodeInfo {
  version?: string;
  nodeId?: string;
  blockHeight?: number;
  channels?: any[];
}

interface Balance {
  balanceMsat?: number;
  feeCreditMsat?: number;
}

interface Transaction {
  id: string;
  type: 'invoice_created' | 'invoice_paid' | 'payment_sent';
  amount: number;
  description: string;
  timestamp: string;
  paymentHash?: string;
  invoice?: string;
  status: 'pending' | 'completed' | 'failed';
}

interface Invoice {
  id: string;
  amount: number;
  description: string;
  paymentHash: string;
  serialized: string;
  created: string;
}

const config: PhoenixdConfig = {
  url: process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740',
  password: process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'your-phoenix-password'
};

function formatSats(msats: number): string {
  const sats = msats / 1000;
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(1)}M sats`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(0)}k sats`;
  }
  return `${Math.round(sats).toLocaleString()} sats`;
}

async function phoenixApiCall(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const apiEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    let requestBody;
    let headers: Record<string, string>;

    if (method === 'POST' && body) {
      // Phoenix expects form data, not JSON
      if (typeof body === 'object') {
        const formData = new URLSearchParams();
        Object.keys(body).forEach(key => {
          formData.append(key, body[key].toString());
        });
        requestBody = formData;
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      } else {
        requestBody = body;
        headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
        };
      }
    } else {
      headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(`/api/phoenixd/${apiEndpoint}`, {
      method,
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          {loading ? (
            <div className="mt-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus({ status, error }: { status: string; error?: string | null }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'Connected to PhoenixD',
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          text: 'Connecting to PhoenixD...',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'Connection Failed',
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-400',
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          text: 'Disconnected',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const Icon = statusConfig.icon;

  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${statusConfig.bg}`}>
        <div className={status === 'connecting' ? 'animate-spin' : ''}>
          <Icon className={`w-4 h-4 ${statusConfig.color}`} />
        </div>
        <span className={`text-sm font-medium ${statusConfig.color}`}>
          {statusConfig.text}
        </span>
      </div>
      {error && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function RealDashboard() {
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Invoice creation state
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');

      // Test connection first
      const info = await phoenixApiCall('/getinfo');
      setNodeInfo(info);
      setConnectionStatus('connected');
      

      // Fetch balance
      try {
        const balanceData = await phoenixApiCall('/getbalance');
        setBalance(balanceData);
      } catch (err) {
        console.warn('Balance endpoint not available:', err);
      }

      // Fetch channels
      try {
        const channelsData = await phoenixApiCall('/listchannels');
        setChannels(Array.isArray(channelsData) ? channelsData : []);
      } catch (err) {
        console.warn('Channels endpoint not available:', err);
      }

    } catch (err: any) {
      console.error('Connection failed:', err);
      setConnectionStatus('error');
      setError(err.message || 'Failed to connect to PhoenixD');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const createInvoice = async () => {
    if (!invoiceDescription.trim()) {
      setError('Please enter a description for the invoice');
      return;
    }

    setCreatingInvoice(true);
    setError(null);

    try {
      const invoiceData = await phoenixApiCall('/createinvoice', 'POST', {
        amountSat: invoiceAmount,
        description: invoiceDescription
      });

      const newInvoice: Invoice = {
        id: Date.now().toString(),
        amount: invoiceAmount,
        description: invoiceDescription,
        paymentHash: invoiceData.paymentHash,
        serialized: invoiceData.serialized,
        created: new Date().toISOString()
      };

      const newTransaction: Transaction = {
        id: `invoice_${Date.now()}`,
        type: 'invoice_created',
        amount: invoiceAmount,
        description: invoiceDescription,
        timestamp: new Date().toISOString(),
        paymentHash: invoiceData.paymentHash,
        invoice: invoiceData.serialized,
        status: 'pending'
      };

      setInvoices(prev => [newInvoice, ...prev]);
      setTransactions(prev => [newTransaction, ...prev]);
      setCreatedInvoice(newInvoice);
      setInvoiceAmount(1000);
      setInvoiceDescription('');
      setShowInvoiceForm(false);
    } catch (err: any) {
      setError(`Failed to create invoice: ${err.message}`);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals
  const totalCapacity = channels.reduce((sum, ch) => sum + (ch.capacityMsat || 0), 0);
  const totalInbound = channels.reduce((sum, ch) => sum + (ch.inboundLiquidityMsat || 0), 0);
  const totalOutbound = channels.reduce((sum, ch) => sum + (ch.outboundLiquidityMsat || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            PhoenixD Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time Lightning Network monitoring
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <ConnectionStatus status={connectionStatus} error={error} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Wallet Balance"
          value={balance?.balanceMsat ? formatSats(balance.balanceMsat) : 'N/A'}
          subtitle={balance?.feeCreditMsat ? `+${formatSats(balance.feeCreditMsat)} credits` : undefined}
          icon={Wallet}
          color="bg-gradient-to-br from-green-500 to-green-600"
          loading={loading}
        />
        <StatCard
          title="Active Channels"
          value={channels.length}
          subtitle={`Total Lightning channels`}
          icon={Zap}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          loading={loading}
        />
        <StatCard
          title="Total Capacity"
          value={totalCapacity ? formatSats(totalCapacity) : 'N/A'}
          subtitle="Channel capacity"
          icon={Activity}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          loading={loading}
        />
        <StatCard
          title="Total Liquidity"
          value={totalInbound + totalOutbound ? formatSats(totalInbound + totalOutbound) : 'N/A'}
          subtitle="Available liquidity"
          icon={TrendingUp}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          loading={loading}
        />
      </div>

      {/* Node Information */}
      {connectionStatus === 'connected' && nodeInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lightning Node Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Node ID</p>
              <p className="font-mono text-sm text-gray-900 dark:text-white break-all">
                {process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {nodeInfo.version || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Block Height</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {nodeInfo.blockHeight?.toLocaleString() || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Channels List */}
      {channels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lightning Channels ({channels.length})
          </h3>
          <div className="space-y-3">
            {channels.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    channel.state === 'NORMAL' ? 'bg-green-500' :
                    channel.state === 'OFFLINE' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Channel {index + 1}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.state || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {channel.capacityMsat ? formatSats(channel.capacityMsat) : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Capacity
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Creation */}
      {connectionStatus === 'connected' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Lightning Invoice
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate payment requests for receiving Lightning payments
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInvoiceForm(!showInvoiceForm)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          </div>

          {showInvoiceForm && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (sats)
                  </label>
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(parseInt(e.target.value) || 1000)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={invoiceDescription}
                    onChange={(e) => setInvoiceDescription(e.target.value)}
                    placeholder="Payment for..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createInvoice}
                  disabled={creatingInvoice || !invoiceDescription.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingInvoice ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      Generate Invoice
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowInvoiceForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Created Invoice with QR Code */}
      {createdInvoice && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invoice Created Successfully
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatSats(createdInvoice.amount * 1000)} • {createdInvoice.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedInvoice(null)}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>

          <QRCodeDisplay
            value={createdInvoice.serialized}
            title="Lightning Invoice"
            description="Scan with any Lightning wallet to pay this invoice"
            size={200}
          />
        </div>
      )}

      {/* Recent Transactions */}
      {connectionStatus === 'connected' && transactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions ({transactions.length})
          </h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'invoice_created' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    tx.type === 'invoice_paid' ? 'bg-green-100 dark:bg-green-900/20' :
                    'bg-orange-100 dark:bg-orange-900/20'
                  }`}>
                    {tx.type === 'invoice_created' ? (
                      <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    ) : tx.type === 'invoice_paid' ? (
                      <ArrowDownRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tx.type === 'invoice_created' ? 'Invoice Created' :
                       tx.type === 'invoice_paid' ? 'Payment Received' :
                       'Payment Sent'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {tx.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'invoice_paid' ? 'text-green-600 dark:text-green-400' :
                    tx.type === 'payment_sent' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {tx.type === 'invoice_paid' ? '+' : tx.type === 'payment_sent' ? '-' : ''}
                    {formatSats(tx.amount * 1000)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {tx.invoice && (
                  <button
                    onClick={() => copyToClipboard(tx.invoice!)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {connectionStatus === 'connected' && invoices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Invoices ({invoices.length})
          </h3>
          <div className="space-y-3">
            {invoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatSats(invoice.amount * 1000)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(invoice.created).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded flex-1 break-all">
                    {invoice.serialized}
                  </code>
                  <button
                    onClick={() => copyToClipboard(invoice.serialized)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {connectionStatus === 'connected' && channels.length === 0 && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Lightning Channels
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your PhoenixD node doesn't have any Lightning channels yet.
              Fund your wallet and open channels to start using Lightning Network.
            </p>
          </div>
        </div>
      )}

      {/* Connection Instructions */}
      {connectionStatus === 'error' && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                Can't Connect to PhoenixD
              </h3>
              <div className="text-orange-700 dark:text-orange-300 mt-2 space-y-2">
                <p>To connect to PhoenixD:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Make sure PhoenixD is running on <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">{config.url}</code></li>
                  <li>Check that the password is correct</li>
                  <li>Verify network connectivity</li>
                  <li>Try running: <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">docker-compose up -d phoenixd</code></li>
                </ol>
                <p className="mt-3">
                  <strong>Quick start:</strong> Run <code className="bg-orange-100 dark:bg-orange-900 px-1 rounded">docker-compose up -d</code> from the project root.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightning Address Quick Access */}
      {connectionStatus === 'connected' && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lightning Addresses
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create simple payment addresses for your Lightning node
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/lightning-address'}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Manage Addresses
            </button>
          </div>
        </div>
      )}
    </div>
  );
}