'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  Wallet,
  Network,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  EyeOff,
  Receipt,
  Plus,
  QrCode,
  Copy,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { usePhoenixStore, useChannelStats, useRecentTransactions } from '@/stores/usePhoenixStore';
import { usePhoenixData, useAutoRefresh } from '@/hooks/usePhoenix';
import { usePaymentOperations } from '@/hooks/usePhoenix';
import { formatSats, formatRelativeTime, cn, animationVariants, copyToClipboard } from '@/lib/utils';
import QRCodeGenerator from './QRCodeGenerator';
import SuccessfulPayments from './SuccessfulPayments';
import TransactionDetails from './TransactionDetails';
import OnboardingModal from './OnboardingModal';

const Dashboard = () => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');

  // Invoice creation state
  const [showQuickInvoice, setShowQuickInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  // Transaction details state
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const { balance, nodeInfo, liquiditySnapshots, isConnected } = usePhoenixStore();
  const channelStats = useChannelStats();
  const recentTransactions = useRecentTransactions(5);
  const { refreshAll } = usePhoenixData();
  const { autoRefresh } = useAutoRefresh();
  const { createInvoice, isLoading: isCreatingInvoice } = usePaymentOperations();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleCreateQuickInvoice = async () => {
    const result = await createInvoice({
      amountMsat: invoiceAmount ? parseFloat(invoiceAmount) * 1000 : undefined,
      description: invoiceDescription || undefined,
      expirySeconds: 3600, // 1 hour default
    });

    if (result.success && result.invoice) {
      setGeneratedInvoice(result.invoice);
      setShowQRModal(true);
      setInvoiceAmount('');
      setInvoiceDescription('');
      setShowQuickInvoice(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleTransactionClick = (transaction: any) => {
    // Convert transaction to the format expected by TransactionDetails
    const detailedTransaction = {
      paymentId: transaction.paymentId || `tx_${transaction.paymentHash.slice(0, 8)}`,
      paymentHash: transaction.paymentHash,
      paymentPreimage: transaction.paymentPreimage,
      recipientAmountSat: transaction.recipientAmountMsat ? transaction.recipientAmountMsat / 1000 :
                          transaction.amountMsat ? transaction.amountMsat / 1000 : 0,
      routingFeeSat: transaction.routingFeeSat || transaction.fees || 4, // Default to 4 sats if not available
      amountMsat: transaction.amountMsat || transaction.recipientAmountMsat,
      description: transaction.description || '',
      createdAt: transaction.createdAt,
      status: transaction.status,
      type: 'recipientAmountMsat' in transaction ? 'sent' : 'received',
      invoice: transaction.invoice,
      expiresAt: transaction.expiresAt
    };

    setSelectedTransaction(detailedTransaction);
    setShowTransactionDetails(true);
  };

  useEffect(() => {
    if (isConnected) {
      refreshAll();
    }
  }, [isConnected, refreshAll]);

  // Check for first-time user and show onboarding
  useEffect(() => {
    if (isConnected && !hasSeenOnboarding) {
      // Check if user has seen onboarding before
      const seenOnboarding = localStorage.getItem('phoenixd-onboarding-seen');

      if (!seenOnboarding) {
        // Check if user has channels - if not, show onboarding
        if (channelStats.channelCount === 0 && balance?.balanceMsat === 0) {
          setShowOnboarding(true);
        }
      } else {
        setHasSeenOnboarding(true);
      }
    }
  }, [isConnected, hasSeenOnboarding, channelStats.channelCount, balance?.balanceMsat]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('phoenixd-onboarding-seen', 'true');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  };

  const handleStartFunding = () => {
    handleOnboardingComplete();
    // Navigate to channel manager or trigger funding flow
    window.location.href = '/node'; // Navigate to channel manager
  };

  // Chart data
  const liquidityChartData = liquiditySnapshots.slice(-24).map((snapshot, index) => ({
    time: new Date(snapshot.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    inbound: snapshot.inboundLiquidity / 1000,
    outbound: snapshot.outboundLiquidity / 1000,
    total: snapshot.totalLiquidity / 1000,
    channels: snapshot.channelCount,
  }));

  const channelDistributionData = [
    { name: 'Active', value: channelStats.activeChannels, color: '#22c55e' },
    { name: 'Inactive', value: channelStats.inactiveChannels, color: '#eab308' },
    { name: 'Closing', value: channelStats.closingChannels, color: '#ef4444' },
  ];

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = 'blue',
    delay = 0
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: { value: number; isPositive: boolean };
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    delay?: number;
  }) => {
    const colorConfig = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <motion.p
              key={value}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 break-all"
            >
              {value}
            </motion.p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 mt-2',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br flex items-center justify-center',
            colorConfig[color]
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </motion.div>
    );
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto mb-4"
          />
          <p className="text-gray-500 dark:text-gray-400">Connecting to PhoenixD...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideDown}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Monitor your Lightning node activity and manage payments
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 touch-manipulation"
          >
            {balanceVisible ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 touch-manipulation text-xs sm:text-base"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.div>
            <span className="hidden sm:inline">Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'payments'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              Successful Payments
            </button>
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Balance"
          value={balanceVisible ? formatSats(balance?.balanceMsat || 0) : '••••••'}
          subtitle={balance?.feeCreditMsat ? `+${formatSats(balance.feeCreditMsat)} credits` : undefined}
          icon={Wallet}
          color="green"
          delay={0}
        />
        <StatCard
          title="Active Channels"
          value={channelStats.activeChannels}
          subtitle={`${channelStats.channelCount} total channels`}
          icon={Network}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Total Liquidity"
          value={balanceVisible ? formatSats(channelStats.totalInbound + channelStats.totalOutbound) : '••••••'}
          subtitle={`${Math.round(channelStats.liquidityUtilization * 100)}% utilized`}
          icon={Activity}
          color="purple"
          delay={0.2}
        />
        <StatCard
          title="Recent Activity"
          value={recentTransactions.length}
          subtitle="Last 24 hours"
          icon={TrendingUp}
          color="orange"
          delay={0.3}
        />
      </div>

      {/* Quick Invoice Creation */}
      {isConnected && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Invoice
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Create Lightning invoices instantly
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQuickInvoice(!showQuickInvoice)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {showQuickInvoice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Amount (sats) - Optional
                    </label>
                    <input
                      type="number"
                      value={invoiceAmount}
                      onChange={(e) => setInvoiceAmount(e.target.value)}
                      placeholder="Leave empty for any amount"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Description - Optional
                    </label>
                    <input
                      type="text"
                      value={invoiceDescription}
                      onChange={(e) => setInvoiceDescription(e.target.value)}
                      placeholder="What is this payment for?"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateQuickInvoice}
                    disabled={isCreatingInvoice}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 text-sm sm:text-base"
                  >
                    {isCreatingInvoice ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Generate with QR</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowQuickInvoice(false)}
                    className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm sm:text-base"
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liquidity Chart */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Liquidity Trends
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Inbound</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">Outbound</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: any, name: string) => [
                    `${formatSats(value * 1000)}`,
                    name === 'inbound' ? 'Inbound' : 'Outbound'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Channel Distribution */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Channel Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {channelDistributionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {recentTransactions.map((transaction, index) => {
                  const isPayment = 'recipientAmountMsat' in transaction;
                  const isIncoming = !isPayment;

                  return (
                    <motion.div
                      key={transaction.paymentHash}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleTransactionClick(transaction)}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          isIncoming
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                        )}>
                          {isIncoming ? (
                            <ArrowDownRight className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {isIncoming ? 'Received' : 'Sent'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'font-semibold',
                          isIncoming ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {isIncoming ? '+' : '-'}
                          {formatSats(
                            isPayment
                              ? (transaction as any).recipientAmountMsat
                              : (transaction as any).amountMsat || 0
                          )}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.status}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

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

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && generatedInvoice && (
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
                  Lightning Invoice Created
                </h3>

                {/* QR Code */}
                <div className="mb-4">
                  <QRCodeGenerator
                    value={generatedInvoice.serialized}
                    title="Lightning Invoice"
                    subtitle={generatedInvoice.description || 'Payment request'}
                    size={256}
                    onCopy={() => handleCopy(generatedInvoice.serialized, 'Invoice')}
                  />
                </div>

                {/* Invoice Details */}
                <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  {generatedInvoice.amountMsat && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSats(generatedInvoice.amountMsat)}
                      </span>
                    </div>
                  )}
                  {generatedInvoice.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Description:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {generatedInvoice.description}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(generatedInvoice.expiresAt * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(generatedInvoice.serialized, 'Invoice')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Invoice
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowQRModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        </div>
      )}

      {/* Successful Payments Tab */}
      {activeTab === 'payments' && (
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          transition={{ delay: 0.2 }}
        >
          <SuccessfulPayments />
        </motion.div>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
          <span className="text-sm">Auto-refresh enabled</span>
        </motion.div>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetails
        transaction={selectedTransaction}
        isOpen={showTransactionDetails}
        onClose={() => setShowTransactionDetails(false)}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingComplete}
        onStartFunding={handleStartFunding}
        hasChannels={channelStats.channelCount > 0}
      />
    </div>
  );
};

export default Dashboard;