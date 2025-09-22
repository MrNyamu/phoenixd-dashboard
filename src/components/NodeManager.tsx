'use client';

import { useState, useEffect } from 'react';
import {
  Server,
  Zap,
  Activity,
  RefreshCw,
  Copy,
  CheckCircle,
  AlertCircle,
  Wifi,
  HardDrive,
  Network,
  BarChart3,
  Settings,
  Info
} from 'lucide-react';

interface NodeInfo {
  version?: string;
  nodeId?: string;
  blockHeight?: number;
  channels?: any[];
  chain?: string;
}

interface Balance {
  balanceMsat?: number;
  feeCreditMsat?: number;
}

interface Channel {
  channelId?: string;
  state?: string;
  capacityMsat?: number;
  inboundLiquidityMsat?: number;
  outboundLiquidityMsat?: number;
  fundingTxId?: string;
  remotePubkey?: string;
}

async function phoenixApiCall(endpoint: string, method: string = 'GET', body?: any) {
  try {
    const apiEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    let requestBody;
    let headers: Record<string, string>;

    if (method === 'POST' && body) {
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

export default function NodeManager() {
  const [nodeInfo, setNodeInfo] = useState<NodeInfo | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  const fetchNodeData = async () => {
    try {
      setError(null);

      // Fetch node info
      const info = await phoenixApiCall('/getinfo');
      setNodeInfo(info);
      setIsOnline(true); // Successfully connected

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
      console.error('Failed to fetch node data:', err);
      setError(`Failed to fetch node data: ${err.message}`);
      setIsOnline(false); // Failed to connect
      setNodeInfo(null);
      setBalance(null);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNodeData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    fetchNodeData();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Calculate totals
  const totalCapacity = channels.reduce((sum, ch) => sum + (ch.capacityMsat || 0), 0);
  const totalInbound = channels.reduce((sum, ch) => sum + (ch.inboundLiquidityMsat || 0), 0);
  const totalOutbound = channels.reduce((sum, ch) => sum + (ch.outboundLiquidityMsat || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Node Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your PhoenixD Lightning node
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

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={clearMessages}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
            <button
              onClick={clearMessages}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Node Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Node Status</p>
              <p className={`text-2xl font-bold mt-1 ${
                loading ? 'text-gray-500 dark:text-gray-400' :
                isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {loading ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              loading ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
              isOnline ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'
            }`}>
              {loading ? (
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              ) : isOnline ? (
                <Wifi className="w-6 h-6 text-white" />
              ) : (
                <AlertCircle className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loading ? '...' : balance?.balanceMsat ? formatSats(balance.balanceMsat) : 'N/A'}
              </p>
              {balance?.feeCreditMsat && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  +{formatSats(balance.feeCreditMsat)} credits
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Channels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loading ? '...' : channels.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lightning channels
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <Network className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Capacity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {loading ? '...' : totalCapacity ? formatSats(totalCapacity) : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total channel capacity
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Node Information */}
      {!loading && nodeInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Node Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Core details about your Lightning node
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Node ID
              </label>
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex-1 break-all">
                  {process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12'}
                </code>
                {nodeInfo.nodeId && (
                  <button
                    onClick={() => copyToClipboard(process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Version
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {nodeInfo.version || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Network
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {nodeInfo.chain || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Block Height
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {nodeInfo.blockHeight?.toLocaleString() || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Inbound Liquidity
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {totalInbound ? formatSats(totalInbound) : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Outbound Liquidity
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {totalOutbound ? formatSats(totalOutbound) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Channels List */}
      {!loading && channels.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lightning Channels ({channels.length})
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Active payment channels with other Lightning nodes
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {channels.map((channel, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
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
                        {channel.state || 'Unknown State'}
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

                {(channel.inboundLiquidityMsat || channel.outboundLiquidityMsat) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Inbound</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {channel.inboundLiquidityMsat ? formatSats(channel.inboundLiquidityMsat) : '0 sats'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Outbound</p>
                      <p className="font-medium text-blue-600 dark:text-blue-400">
                        {channel.outboundLiquidityMsat ? formatSats(channel.outboundLiquidityMsat) : '0 sats'}
                      </p>
                    </div>
                  </div>
                )}

                {channel.remotePubkey && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Remote Node:</p>
                      <code className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                        {channel.remotePubkey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(channel.remotePubkey!)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Channels Message */}
      {!loading && channels.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-8">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Lightning Channels
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your PhoenixD node doesn't have any Lightning channels yet.
              Phoenix automatically manages channels for you.
            </p>
          </div>
        </div>
      )}

      {/* Node Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Phoenix Node Status
            </h3>
            <p className="text-blue-600 dark:text-blue-300 mt-1">
              Your Phoenix node is running with automated liquidity management.
              Channels are automatically opened and managed for optimal payment routing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}