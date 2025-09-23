'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import { usePhoenixConnection, usePhoenixData } from '@/hooks/usePhoenix';
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
  Mail,
  Wallet,
  Link,
  Server,
  CreditCard,
  HelpCircle
} from 'lucide-react';
import NetworkIndicator from './NetworkIndicator';
import NetworkWarningBanner from './NetworkWarningBanner';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'LNURL', href: '/lnurl', icon: Link },
  { name: 'Node Manager', href: '/node', icon: Server },
  { name: 'Channels', href: '/channels', icon: Zap },
  { name: 'Lightning Address', href: '/lightning-address', icon: Mail },
  { name: 'Help', href: '/help', icon: HelpCircle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Use Phoenix store for consistent data across components
  const store = usePhoenixStore();
  const { connect, connectionStatus, error } = usePhoenixConnection();
  const { refreshAll } = usePhoenixData();

  useEffect(() => {
    // Initialize Phoenix connection (non-blocking)
    connect().catch(console.error);

    // Reduce frequency - Check connection every 2 minutes only if disconnected
    const interval = setInterval(() => {
      if (connectionStatus !== 'connected') {
        connect().catch(console.error);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []); // Remove dependencies to prevent infinite loops

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
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${config.bg}`}>
        <div className={connectionStatus === 'connecting' ? 'animate-spin' : ''}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {connectionStatus === 'connected' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            )}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              PhoenixD
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Lightning Client
            </p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Connection Status */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <ConnectionIndicator />
        {error && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Balance */}
      {connectionStatus === 'connected' && store.balance && (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-all">
              {Math.floor((store.balance.balanceMsat || 0) / 1000).toLocaleString()} sats
            </p>
            {(store.balance.feeCreditMsat || 0) > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                +{Math.floor((store.balance.feeCreditMsat || 0) / 1000).toLocaleString()} fee credits
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-2">
        {navigation.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href);
                if (mobile) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg transition-all duration-200 group touch-manipulation ${
                isActive
                  ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors duration-200 ${
                isActive
                  ? 'text-orange-700 dark:text-orange-300'
                  : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              }`} />
              <span className="font-medium text-sm sm:text-base">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Network Indicator */}
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800">
        <NetworkIndicator size="sm" className="w-full" />
      </div>

      {/* Node Info */}
      {connectionStatus === 'connected' && store.nodeInfo && (
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Node ID</p>
              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate px-2">
                {store.nodeInfo.nodeId ? (process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12').substring(0, 16) + '...' : 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Block</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {store.nodeInfo.blockHeight?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Channels</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {store.channels?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Network Warning Banner */}
      <NetworkWarningBanner />
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 lg:hidden transition-transform duration-300 ease-in-out transform overflow-y-auto shadow-xl">
          <Sidebar mobile />
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className={`lg:pl-64 transition-all duration-300 ${sidebarOpen ? 'lg:opacity-100 opacity-50' : 'opacity-100'}`}>
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Network indicator for mobile */}
              <NetworkIndicator size="sm" showWarning={false} />

              {/* Compact connection indicator for mobile */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-200 ${connectionStatus === 'connected' ? 'bg-green-50 dark:bg-green-900/20' : connectionStatus === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-900/20'}`}>
                <div className={connectionStatus === 'connecting' ? 'animate-spin' : ''}>
                  {connectionStatus === 'connected' ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : connectionStatus === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  ) : connectionStatus === 'connecting' ? (
                    <Wifi className="w-3 h-3 text-yellow-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <span className={`text-xs font-medium hidden xs:inline ${connectionStatus === 'connected' ? 'text-green-500' : connectionStatus === 'error' ? 'text-red-500' : connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-gray-400'}`}>
                  {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50 touch-manipulation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}