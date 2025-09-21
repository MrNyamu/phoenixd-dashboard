'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Wallet,
  Activity,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Simple mock data for initial testing
const mockData = {
  balance: 1500000, // 1.5M sats
  channels: 3,
  totalLiquidity: 5000000, // 5M sats
  recentTransactions: 12
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
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

function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Simulate connection attempt
    const timer = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <div className="animate-spin">
          <RefreshCw className="w-4 h-4 text-yellow-500" />
        </div>
        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
          Connecting...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20">
      <CheckCircle className="w-4 h-4 text-green-500" />
      <span className="text-sm font-medium text-green-700 dark:text-green-300">
        Connected
      </span>
    </div>
  );
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

export default function SimpleDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              PhoenixD Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor your Lightning Network activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Balance"
            value={formatSats(mockData.balance)}
            subtitle="Available for spending"
            icon={Wallet}
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard
            title="Active Channels"
            value={mockData.channels}
            subtitle="Lightning channels"
            icon={Zap}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Total Liquidity"
            value={formatSats(mockData.totalLiquidity)}
            subtitle="Channel capacity"
            icon={Activity}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard
            title="Recent Activity"
            value={mockData.recentTransactions}
            subtitle="Last 24 hours"
            icon={TrendingUp}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        {/* Simple Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Liquidity Overview
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Charts will be displayed here when connected to PhoenixD
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Payment {i === 1 ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {i} hour{i > 1 ? 's' : ''} ago
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    i === 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {i === 1 ? '+' : '-'}{(50000 * i).toLocaleString()} sats
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}