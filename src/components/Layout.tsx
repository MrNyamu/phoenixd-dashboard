'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import { usePhoenixConnection } from '@/hooks/usePhoenix';
import {
  Home,
  Zap,
  TrendingUp,
  Send,
  Receipt,
  Settings,
  Menu,
  X,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Channels', href: '/channels', icon: Zap },
  { name: 'Liquidity', href: '/liquidity', icon: TrendingUp },
  { name: 'Send', href: '/send', icon: Send },
  { name: 'Receive', href: '/receive', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const { connectionStatus, error, isConnected, connect } = usePhoenixConnection();
  const { nodeInfo, balance } = usePhoenixStore();

  useEffect(() => {
    // Auto-connect on mount
    connect().catch(console.error);
  }, [connect]);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const ConnectionIndicator = () => {
    const getStatusConfig = () => {
      switch (connectionStatus) {
        case 'connected':
          return {
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-900/20',
            text: 'Connected',
          };
        case 'connecting':
          return {
            icon: Wifi,
            color: 'text-yellow-500',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            text: 'Connecting...',
          };
        case 'error':
          return {
            icon: AlertCircle,
            color: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'Error',
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

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          config.bg
        )}
      >
        <motion.div
          animate={connectionStatus === 'connecting' ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2, repeat: connectionStatus === 'connecting' ? Infinity : 0 }}
        >
          <Icon className={cn('w-4 h-4', config.color)} />
        </motion.div>
        <span className={cn('text-sm font-medium', config.color)}>
          {config.text}
        </span>
      </motion.div>
    );
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      'flex flex-col h-full',
      mobile ? 'w-full' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center"
            >
              <Zap className="w-5 h-5 text-white" />
            </motion.div>
            {isConnected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
              />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              PhoenixD
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
             
            </p>
          </div>
        </motion.div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <ConnectionIndicator />
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"
          >
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </div>

      {/* Balance */}
      {isConnected && balance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-b border-gray-200 dark:border-gray-800"
        >
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
            <motion.p
              key={balance.balanceMsat}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {Math.round(balance.balanceMsat / 1000).toLocaleString()} sats
            </motion.p>
            {balance.feeCreditMsat > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                +{Math.round(balance.feeCreditMsat / 1000)} fee credits
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href;

          return (
            <motion.a
              key={item.name}
              href={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPath(item.href);
                if (mobile) setSidebarOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 transition-colors duration-200',
                isActive
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              )} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-orange-500 rounded-full"
                />
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* Node Info */}
      {isConnected && nodeInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Node ID</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {nodeInfo.nodeId.slice(0, 16)}...
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Block</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {nodeInfo.blockHeight.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Channels</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {nodeInfo.channels?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 lg:hidden"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <ConnectionIndicator />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}