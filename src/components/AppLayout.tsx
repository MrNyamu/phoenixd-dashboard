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
  CreditCard
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'LNURL', href: '/lnurl', icon: Link },
  { name: 'Node Manager', href: '/node', icon: Server },
  { name: 'Channels', href: '/channels', icon: Zap },
  { name: 'Lightning Address', href: '/lightning-address', icon: Mail },
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
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
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
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Balance */}
      {connectionStatus === 'connected' && store.balance && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {store.balance.balanceSat.toLocaleString()} sats
            </p>
            {store.balance.feeCreditSat > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                +{store.balance.feeCreditSat.toLocaleString()} fee credits
              </p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
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
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Node Info */}
      {connectionStatus === 'connected' && store.nodeInfo && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Node ID</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {store.nodeInfo.nodeId ? (process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12').substring(0, 20) + '...' : 'N/A'}
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
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
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-xs bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 lg:hidden transition-transform duration-300 ease-in-out transform overflow-y-auto shadow-xl">
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
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}