'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Plus,
  Minus,
  Settings,
  BarChart3,
  Activity,
  Zap,
  DollarSign,
  Timer,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { usePhoenixStore, useChannelStats } from '@/stores/usePhoenixStore';
import { useLiquidityOperations } from '@/hooks/usePhoenix';
import { formatSats, formatRelativeTime, cn, animationVariants } from '@/lib/utils';

const LiquidityManager = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [liquidityTarget, setLiquidityTarget] = useState(1000000); // 1M sats
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestDuration, setRequestDuration] = useState('144'); // 1 day in blocks

  const {
    liquiditySnapshots,
    channels,
    currentLiquidity,
    liquidityAlerts,
  } = usePhoenixStore();
  const channelStats = useChannelStats();
  const { requestLiquidity, getLiquidityAds, isLoading } = useLiquidityOperations();

  const timeframes = [
    { label: '1H', value: '1h', hours: 1 },
    { label: '6H', value: '6h', hours: 6 },
    { label: '24H', value: '24h', hours: 24 },
    { label: '7D', value: '7d', hours: 168 },
    { label: '30D', value: '30d', hours: 720 },
  ];

  const getFilteredSnapshots = () => {
    const selectedTimeframeData = timeframes.find(t => t.value === selectedTimeframe);
    if (!selectedTimeframeData) return liquiditySnapshots;

    const cutoffTime = Date.now() - (selectedTimeframeData.hours * 60 * 60 * 1000);
    return liquiditySnapshots.filter(snapshot => snapshot.timestamp > cutoffTime);
  };

  const chartData = getFilteredSnapshots().map((snapshot) => ({
    timestamp: snapshot.timestamp,
    time: new Date(snapshot.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    inbound: snapshot.inboundLiquidity / 1000,
    outbound: snapshot.outboundLiquidity / 1000,
    total: snapshot.totalLiquidity / 1000,
    utilization: snapshot.totalLiquidity > 0
      ? ((snapshot.inboundLiquidity + snapshot.outboundLiquidity) / snapshot.totalLiquidity) * 100
      : 0,
  }));

  const liquidityRatio = channelStats.totalCapacity > 0
    ? (channelStats.totalOutbound / channelStats.totalCapacity) * 100
    : 0;

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-500';
    if (utilization >= 60) return 'text-yellow-500';
    if (utilization >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getUtilizationBg = (utilization: number) => {
    if (utilization >= 80) return 'bg-green-500';
    if (utilization >= 60) return 'bg-yellow-500';
    if (utilization >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleRequestLiquidity = async () => {
    if (!requestAmount) return;

    const amountMsat = parseFloat(requestAmount) * 1000;
    const result = await requestLiquidity({
      amountMsat,
      leaseDurationBlocks: parseInt(requestDuration),
      maxFeeRateBasisPoints: 100, // 1% max fee
    });

    if (result.success) {
      setShowRequestModal(false);
      setRequestAmount('');
    }
  };

  const LiquidityMetric = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    delay = 0
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
    trend?: { value: number; isPositive: boolean };
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <motion.p
            key={value}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-gray-900 dark:text-white mt-1"
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
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          color
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  const ChannelCard = ({ channel, index }: { channel: any; index: number }) => {
    const utilization = channel.capacityMsat > 0
      ? ((channel.inboundLiquidityMsat + channel.outboundLiquidityMsat) / channel.capacityMsat) * 100
      : 0;

    const outboundRatio = (channel.capacityMsat > 0)
      ? (channel.outboundLiquidityMsat / channel.capacityMsat) * 100
      : 0;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              channel.state === 'NORMAL' ? 'bg-green-500' :
              channel.state === 'OFFLINE' ? 'bg-yellow-500' : 'bg-red-500'
            )} />
            <p className="font-medium text-gray-900 dark:text-white">
              {channel.channelId.slice(0, 8)}...
            </p>
          </div>
          <span className={cn(
            'px-2 py-1 text-xs rounded-full',
            channel.state === 'NORMAL' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
            channel.state === 'OFFLINE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          )}>
            {channel.state}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Capacity</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatSats(channel.capacityMsat)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Inbound</span>
              <span>{formatSats(channel.inboundLiquidityMsat)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - outboundRatio}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full bg-green-500 rounded-l-full"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${outboundRatio}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                className="h-full bg-blue-500 rounded-r-full absolute right-0 top-0"
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">Outbound</span>
              <span>{formatSats(channel.outboundLiquidityMsat)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Utilization</span>
              <span className={getUtilizationColor(utilization)}>
                {utilization.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Liquidity Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and optimize your Lightning network liquidity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Request Liquidity
          </motion.button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LiquidityMetric
          title="Total Liquidity"
          value={formatSats(channelStats.totalInbound + channelStats.totalOutbound)}
          subtitle={`${channelStats.channelCount} channels`}
          icon={Activity}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          delay={0}
        />
        <LiquidityMetric
          title="Inbound Capacity"
          value={formatSats(channelStats.totalInbound)}
          subtitle="Available for receiving"
          icon={TrendingDown}
          color="bg-gradient-to-br from-green-500 to-green-600"
          delay={0.1}
        />
        <LiquidityMetric
          title="Outbound Capacity"
          value={formatSats(channelStats.totalOutbound)}
          subtitle="Available for sending"
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          delay={0.2}
        />
        <LiquidityMetric
          title="Utilization"
          value={`${channelStats.liquidityUtilization.toFixed(1)}%`}
          subtitle="Efficiency rating"
          icon={Target}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          delay={0.3}
        />
      </div>

      {/* Liquidity Chart */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Liquidity History
            </h3>
            <div className="flex items-center gap-2">
              {timeframes.map((timeframe) => (
                <button
                  key={timeframe.value}
                  onClick={() => setSelectedTimeframe(timeframe.value)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-lg transition-colors',
                    selectedTimeframe === timeframe.value
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {timeframe.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
                    formatSats(value * 1000),
                    name === 'inbound' ? 'Inbound' : name === 'outbound' ? 'Outbound' : 'Total'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="inbound"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="inbound"
                />
                <Line
                  type="monotone"
                  dataKey="outbound"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="outbound"
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="total"
                />
                <ReferenceLine
                  y={liquidityTarget / 1000}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Channels Grid */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Channel Details
          </h3>
        </div>
        <div className="p-6">
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No channels found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel, index) => (
                <ChannelCard key={channel.channelId} channel={channel} index={index} />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Request Liquidity Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
              onClick={() => setShowRequestModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Request Liquidity
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (sats)
                    </label>
                    <input
                      type="number"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="100000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (blocks)
                    </label>
                    <select
                      value={requestDuration}
                      onChange={(e) => setRequestDuration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="144">1 Day (144 blocks)</option>
                      <option value="1008">1 Week (1,008 blocks)</option>
                      <option value="4320">1 Month (4,320 blocks)</option>
                      <option value="52560">1 Year (52,560 blocks)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestLiquidity}
                    disabled={!requestAmount || isLoading}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Requesting...' : 'Request'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiquidityManager;