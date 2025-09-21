'use client';

import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Zap,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Wallet,
  TestTube
} from 'lucide-react';
import WalletConnection from '@/components/WalletConnection';

export default function SettingsPage() {
  const [connectionTest, setConnectionTest] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'connection' | 'wallet'>('connection');

  const testPhoenixConnection = async () => {
    setConnectionTest('testing');
    setConnectionError('');

    try {
      const response = await fetch('/api/phoenixd/getinfo');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.nodeId) {
        setConnectionTest('success');
      } else {
        setConnectionTest('error');
        setConnectionError('Invalid response from Phoenix node');
      }
    } catch (error: any) {
      setConnectionTest('error');
      setConnectionError(error.message);
    }
  };

  const tabs = [
    { id: 'connection', name: 'Phoenix Connection', icon: Zap },
    { id: 'wallet', name: 'Wallet Integration', icon: Wallet }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure and test your PhoenixD connection and wallet integrations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'connection' | 'wallet')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'connection' && (
            <div className="space-y-6">
              {/* Phoenix Connection Test */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <TestTube className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      PhoenixD Connection Test
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Test connection to your PhoenixD Lightning node
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={testPhoenixConnection}
                      disabled={connectionTest === 'testing'}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {connectionTest === 'testing' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Test Connection
                        </>
                      )}
                    </button>

                    {connectionTest !== 'idle' && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        connectionTest === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                        connectionTest === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                        'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {connectionTest === 'success' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Connected Successfully
                          </>
                        ) : connectionTest === 'error' ? (
                          <>
                            <AlertCircle className="w-4 h-4" />
                            Connection Failed
                          </>
                        ) : (
                          <>
                            <Wifi className="w-4 h-4" />
                            Testing...
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {connectionError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-red-700 dark:text-red-300 font-medium">Connection Error</p>
                          <p className="text-red-600 dark:text-red-400 text-sm mt-1">{connectionError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {connectionTest === 'success' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-green-700 dark:text-green-300 font-medium">Connection Successful</p>
                          <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                            Successfully connected to PhoenixD node. All API endpoints are accessible.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">API Status</span>
                  </div>
                  <span className={`text-sm ${
                    connectionTest === 'success' ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                  }`}>
                    {connectionTest === 'success' ? 'Online' : 'Unknown'}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Node Type</span>
                  </div>
                  <span className="text-sm text-gray-500">PhoenixD</span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <SettingsIcon className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Environment</span>
                  </div>
                  <span className="text-sm text-gray-500">Docker</span>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-2">Troubleshooting</h4>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                  <li>• Ensure PhoenixD container is running: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">docker ps</code></li>
                  <li>• Check if PhoenixD is healthy: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">docker-compose ps</code></li>
                  <li>• Verify port 9740 is accessible: <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">curl localhost:9740/getinfo</code></li>
                  <li>• Check environment variables in docker-compose.yml</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <WalletConnection />
            </div>
          )}
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Made with ❤️ by mrnyamu
        </p>
      </div>
    </div>
  );
}