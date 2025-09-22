'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Wallet,
  Download,
  Activity,
  TrendingUp,
  Layers,
  Network,
  DollarSign,
  Settings,
  Info
} from 'lucide-react';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import { usePhoenixConnection, usePhoenixData } from '@/hooks/usePhoenix';
import { formatSats, copyToClipboard, cn, animationVariants } from '@/lib/utils';
import QRCodeGenerator from './QRCodeGenerator';

interface ChannelData {
  channelId: string;
  state: 'NORMAL' | 'OFFLINE' | 'SYNCING' | 'CLOSING';
  balanceSat: number;
  inboundLiquidityMsat: number;
  outboundLiquidityMsat: number;
  capacityMsat: number;
  channelPoint: string;
  isActive: boolean;
  isPublic: boolean;
  remotePubkey: string;
  shortChannelId?: string;
  fundingTxId?: string;
}

interface FundingInvoice {
  amountSat: number;
  paymentHash: string;
  serialized: string;
  description: string;
  expiresAt: number;
  isPaid: boolean;
}

export default function ChannelManager() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [fundingAmount, setFundingAmount] = useState(25000); // 25k sats default
  const [fundingInvoice, setFundingInvoice] = useState<FundingInvoice | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [channelActivity, setChannelActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Node Configuration and Channel Creation
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [nodeType, setNodeType] = useState<'phoenixd' | 'external'>('phoenixd');
  const [externalNodeUrl, setExternalNodeUrl] = useState('');
  const [externalNodePassword, setExternalNodePassword] = useState('');
  const [showChannelCreation, setShowChannelCreation] = useState(false);
  const [peerNodeId, setPeerNodeId] = useState('');
  const [peerHost, setPeerHost] = useState('');
  const [channelAmount, setChannelAmount] = useState(100000); // 100k sats default

  const { balance, nodeInfo, isConnected } = usePhoenixStore();
  const { connect, isConnected: connectionStatus } = usePhoenixConnection();
  const { refreshAll } = usePhoenixData();

  // Ensure PhoenixD connection on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      if (!isConnected) {
        try {
          await connect();
          // Don't call refreshAll here to avoid dependency issues
        } catch (error) {
          console.error('Failed to connect to PhoenixD:', error);
        }
      }
    };

    initializeConnection();
  }, []); // Empty dependency array - only run on mount

  // Fetch channels data
  const fetchChannels = useCallback(async () => {
    if (!isConnected) return;

    try {
      setRefreshing(true);
      const response = await fetch('/api/phoenixd/listchannels');

      if (response.ok) {
        const channelsData = await response.json();
        setChannels(channelsData);
      } else {
        console.error('Failed to fetch channels');
      }
    } catch (err) {
      console.error('Error fetching channels:', err);
    } finally {
      setRefreshing(false);
    }
  }, [isConnected]); // Only depend on connection status

  // Fetch data when connected
  useEffect(() => {
    if (isConnected) {
      fetchChannels();
    }
  }, [isConnected, fetchChannels]); // Include fetchChannels since it's memoized

  // Create funding invoice for automatic channel opening
  const createFundingInvoice = async () => {
    // Ensure connection before proceeding
    if (!isConnected) {
      try {
        setLoading(true);
        await connect();
        await refreshAll();
      } catch (error) {
        setError('Failed to connect to PhoenixD. Please check your settings.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/phoenixd/createinvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amountSat: fundingAmount.toString(),
          description: `Phoenix Wallet Funding - ${fundingAmount.toLocaleString()} sats - Auto Channel Opening`,
          expirySeconds: '3600', // 1 hour
        }),
      });

      if (response.ok) {
        const invoiceData = await response.json();

        const invoice: FundingInvoice = {
          amountSat: invoiceData.amountSat,
          paymentHash: invoiceData.paymentHash,
          serialized: invoiceData.serialized,
          description: `Phoenix Wallet Funding - ${fundingAmount.toLocaleString()} sats`,
          expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
          isPaid: false,
        };

        setFundingInvoice(invoice);
        setShowQRModal(true);
        setSuccess('Funding invoice created! Pay this invoice to fund your Phoenix wallet and automatically open channels.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create funding invoice');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create funding invoice');
    } finally {
      setLoading(false);
    }
  };

  // Monitor invoice payment status
  const monitorInvoicePayment = async (paymentHash: string) => {
    try {
      const response = await fetch('/api/phoenixd/payments/incoming');

      if (response.ok) {
        const payments = await response.json();
        const paidInvoice = payments.find((p: any) =>
          p.paymentHash === paymentHash && p.isPaid
        );

        if (paidInvoice) {
          setFundingInvoice(prev => prev ? { ...prev, isPaid: true } : null);
          setSuccess(`Payment received! ${paidInvoice.receivedSat} sats funded. Phoenix will automatically open channels.`);
          fetchChannels(); // Refresh channels after funding
          setTimeout(() => {
            setShowQRModal(false);
            setFundingInvoice(null);
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Error monitoring invoice:', err);
    }
  };

  // Copy to clipboard handler
  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  // Create channel with remote peer
  const createChannel = useCallback(async () => {
    if (!peerNodeId.trim() || !channelAmount) {
      setError('Please provide peer node ID and channel amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure connection
      if (!isConnected) {
        await connect();
      }

      // Prepare the request
      const endpoint = '/api/phoenixd/openchannel';
      const body = new URLSearchParams({
        nodeId: peerNodeId.trim(),
        amountSat: channelAmount.toString(),
        ...(peerHost.trim() && { host: peerHost.trim() })
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create channel: ${errorText}`);
      }

      const result = await response.json();

      setSuccess(`Channel creation initiated! ${result.message || 'Check your channels list for updates.'}`);

      // Reset form
      setPeerNodeId('');
      setPeerHost('');
      setChannelAmount(100000);
      setShowChannelCreation(false);

      // Refresh channels after a delay
      setTimeout(() => {
        fetchChannels();
      }, 2000);

    } catch (error: any) {
      console.error('Channel creation failed:', error);
      setError(error.message || 'Failed to create channel');
    } finally {
      setLoading(false);
    }
  }, [peerNodeId, channelAmount, isConnected, connect, fetchChannels]); // Add dependencies

  // Monitor invoices only - channels are fetched separately
  useEffect(() => {
    // Only set up interval if we have a pending invoice to monitor
    if (isConnected && fundingInvoice && !fundingInvoice.isPaid) {
      const interval = setInterval(() => {
        // Only monitor invoice payment, not constantly fetch channels
        monitorInvoicePayment(fundingInvoice.paymentHash);
      }, 10000); // Check every 10 seconds instead of 5

      return () => clearInterval(interval);
    }
  }, [isConnected, fundingInvoice]);

  const hasChannels = channels.length > 0;
  const totalCapacity = channels.reduce((sum, ch) => sum + (ch.capacityMsat / 1000), 0);
  const totalBalance = channels.reduce((sum, ch) => sum + ch.balanceSat, 0);
  const activeChannels = channels.filter(ch => ch.isActive).length;

  const ChannelCard = ({ channel }: { channel: ChannelData }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-3 h-3 rounded-full',
            channel.state === 'NORMAL' ? 'bg-green-500' :
            channel.state === 'OFFLINE' ? 'bg-red-500' :
            channel.state === 'SYNCING' ? 'bg-yellow-500' : 'bg-gray-500'
          )} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Channel {channel.channelId.slice(0, 8)}...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {channel.state} • {channel.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleCopy(channel.channelId, 'Channel ID')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Local Balance</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatSats(channel.balanceSat * 1000)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Capacity</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatSats(channel.capacityMsat)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Inbound</p>
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            {formatSats(channel.inboundLiquidityMsat)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Outbound</p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {formatSats(channel.outboundLiquidityMsat)}
          </p>
        </div>
      </div>

      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Remote Pubkey:</span>
            <button
              onClick={() => handleCopy(channel.remotePubkey, 'Remote Pubkey')}
              className="text-gray-900 dark:text-white font-mono text-xs hover:text-blue-600"
            >
              {channel.remotePubkey.slice(0, 20)}...
            </button>
          </div>
          {channel.shortChannelId && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Short Channel ID:</span>
              <span className="text-gray-900 dark:text-white font-mono text-xs">
                {channel.shortChannelId}
              </span>
            </div>
          )}
          {channel.fundingTxId && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Funding TX:</span>
              <button
                onClick={() => handleCopy(channel.fundingTxId!, 'Funding TX')}
                className="text-gray-900 dark:text-white font-mono text-xs hover:text-blue-600"
              >
                {channel.fundingTxId.slice(0, 20)}...
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Channel Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Lightning channels and wallet funding
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              showAdvanced
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            <Settings className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
          <button
            onClick={fetchChannels}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            Refresh
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-400">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel Stats */}
      {hasChannels && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Channels</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeChannels}/{channels.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatSats(totalCapacity * 1000)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Channel Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatSats(totalBalance * 1000)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Utilization</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalCapacity > 0 ? Math.round((totalBalance / totalCapacity) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Channels - Funding Section */}
      {!hasChannels && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-8 border border-orange-200 dark:border-orange-800"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Fund Your Phoenix Wallet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Phoenix automatically opens channels when you fund your wallet. Choose an amount and create a funding invoice.
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funding Amount (sats)
                </label>
                <input
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(parseInt(e.target.value) || 0)}
                  min="10000"
                  max="10000000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="25000"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum: 10,000 sats • Recommended: 25,000+ sats
                </p>
              </div>

              <button
                onClick={createFundingInvoice}
                disabled={loading || fundingAmount < 10000}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Funding Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6"
        >
          {/* Node Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Node Configuration</h3>
              <button
                onClick={() => setShowNodeConfig(!showNodeConfig)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/40"
              >
                <Settings className="w-4 h-4" />
                {showNodeConfig ? 'Hide' : 'Configure'}
              </button>
            </div>

            {showNodeConfig && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Node Type
                  </label>
                  <select
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value as 'phoenixd' | 'external')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="phoenixd">Current PhoenixD Instance</option>
                    <option value="external">External Node (Future)</option>
                  </select>
                </div>

                {nodeType === 'external' && (
                  <div className="space-y-3 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> External node connection is planned for future updates. Currently, you can only use the local PhoenixD instance.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Current Node Info</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p><strong>Node ID:</strong> {nodeInfo?.nodeId ? (process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12').substring(0, 20) + '...' : 'Loading...'}</p>
                    <p><strong>Network:</strong> {nodeInfo?.chainHash ? (nodeInfo.chainHash.startsWith('6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000') ? 'mainnet' : 'testnet') : 'Loading...'}</p>
                    <p><strong>Block Height:</strong> {nodeInfo?.blockHeight?.toLocaleString() || 'Loading...'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Channel Creation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Channel</h3>
              <button
                onClick={() => setShowChannelCreation(!showChannelCreation)}
                className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/40"
              >
                <Plus className="w-4 h-4" />
                {showChannelCreation ? 'Hide' : 'Open Channel'}
              </button>
            </div>

            {showChannelCreation && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Channel Creation</h4>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Create a direct Lightning channel with another node. This requires the peer's node ID and optionally their network address.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peer Node ID (Required)
                  </label>
                  <input
                    type="text"
                    value={peerNodeId}
                    onChange={(e) => setPeerNodeId(e.target.value)}
                    placeholder="Enter peer's node public key (66 characters)"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peer Host (Optional)
                  </label>
                  <input
                    type="text"
                    value={peerHost}
                    onChange={(e) => setPeerHost(e.target.value)}
                    placeholder="e.g., 192.168.1.100:9735 or example.com:9735"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty for automatic peer discovery
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Channel Amount (sats)
                  </label>
                  <input
                    type="number"
                    value={channelAmount}
                    onChange={(e) => setChannelAmount(parseInt(e.target.value) || 0)}
                    min="20000"
                    max="16777215"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: 20,000 sats | Maximum: 16,777,215 sats (~0.168 BTC)
                  </p>
                </div>

                <button
                  onClick={createChannel}
                  disabled={loading || !peerNodeId.trim() || !channelAmount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.div>
                      Creating Channel...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Create Channel
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Channels List */}
      {hasChannels && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Lightning Channels ({channels.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {channels.map((channel) => (
              <ChannelCard key={channel.channelId} channel={channel} />
            ))}
          </div>
        </div>
      )}

      {/* Funding Invoice QR Modal */}
      <AnimatePresence>
        {showQRModal && fundingInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Fund Your Phoenix Wallet
                </h3>

                {fundingInvoice.isPaid ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-green-600 dark:text-green-400 font-semibold">
                      Payment received! Phoenix is opening channels...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <QRCodeGenerator
                        value={fundingInvoice.serialized}
                        title="Funding Invoice"
                        subtitle={`${fundingInvoice.amountSat.toLocaleString()} sats`}
                        size={256}
                        onCopy={() => handleCopy(fundingInvoice.serialized, 'Invoice')}
                      />
                    </div>

                    <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {fundingInvoice.amountSat.toLocaleString()} sats
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Wallet Funding
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(fundingInvoice.expiresAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleCopy(fundingInvoice.serialized, 'Invoice')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Invoice
                      </button>
                      <button
                        onClick={() => setShowQRModal(false)}
                        className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Feedback */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            {copyFeedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}