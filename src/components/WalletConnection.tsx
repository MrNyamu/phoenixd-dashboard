'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Activity,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
  QrCode,
  Receipt
} from 'lucide-react';

interface TestInvoice {
  id: string;
  amount: number;
  description: string;
  paymentHash: string;
  serialized: string;
  created: string;
  paid: boolean;
}

interface UserWallet {
  nodeId: string;
  alias?: string;
  added: string;
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

export default function WalletConnection() {
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [newNodeId, setNewNodeId] = useState('0340d4ad67d30c6d627fde1308cab5a7f764cc090b0ebd4e5b58d707657b1c4075');
  const [testInvoices, setTestInvoices] = useState<TestInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testAmount, setTestAmount] = useState(0);

  const addUserWallet = () => {
    if (!newNodeId.trim()) {
      setError('Please enter a Node ID');
      return;
    }

    // Validate Node ID format (should be 66 hex characters)
    if (!/^[0-9a-fA-F]{66}$/.test(newNodeId.trim())) {
      setError('Invalid Node ID format. Should be 66 hexadecimal characters.');
      return;
    }

    const exists = userWallets.find(w => w.nodeId === newNodeId.trim());
    if (exists) {
      setError('This wallet is already added');
      return;
    }

    const newWallet: UserWallet = {
      nodeId: newNodeId.trim(),
      alias: `Phoenix Wallet ${userWallets.length + 1}`,
      added: new Date().toISOString()
    };

    setUserWallets(prev => [...prev, newWallet]);
    setSuccess(`Added Phoenix wallet: ${newNodeId.slice(0, 16)}...`);
    setNewNodeId('');
  };

  const removeUserWallet = (nodeId: string) => {
    setUserWallets(prev => prev.filter(w => w.nodeId !== nodeId));
    setSuccess(`Removed wallet from list`);
  };

  const createTestInvoice = async () => {
    setLoading(true);
    setError(null);

    try {
      const invoiceData = await phoenixApiCall('/createinvoice', 'POST', {
        amountSat: testAmount,
        description: `Test payment via PhoenixD - Amount: ${testAmount} sats`
      });

      const newInvoice: TestInvoice = {
        id: Date.now().toString(),
        amount: testAmount,
        description: `Test payment - ${testAmount} sats`,
        paymentHash: invoiceData.paymentHash,
        serialized: invoiceData.serialized,
        created: new Date().toISOString(),
        paid: false
      };

      setTestInvoices(prev => [newInvoice, ...prev]);
      setSuccess(`Created test invoice for ${testAmount} sats`);
    } catch (err: any) {
      setError(`Failed to create invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Copied to clipboard');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Phoenix Wallet Integration
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Test receiving payments through your Phoenix wallet using this phoenixd instance
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      {/* Add Your Wallet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Your Phoenix Wallet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Register your Phoenix wallet to track test payments
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="nodeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phoenix Wallet Node ID
            </label>
            <input
              type="text"
              id="nodeId"
              value={newNodeId}
              onChange={(e) => setNewNodeId(e.target.value)}
              placeholder="0340d4ad67d30c6d627fde1308cab5a7f764cc090b0ebd4e5b58d707657b1c4075"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Find this in your Phoenix wallet: Settings → Advanced → Lightning Node Info
            </p>
          </div>

          <button
            onClick={addUserWallet}
            disabled={!newNodeId.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Wallet className="w-4 h-4" />
            Add Wallet to Test List
          </button>
        </div>
      </div>

      {/* Test Invoice Creation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Test Invoice
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate invoices for testing payment routing to your Phoenix wallet
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount (sats)
            </label>
            <input
              type="number"
              id="amount"
              value={testAmount}
              onChange={(e) => setTestAmount(parseInt(e.target.value) || 1000)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={createTestInvoice}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Creating Invoice...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Create Test Invoice
              </>
            )}
          </button>
        </div>
      </div>

      {/* Your Wallets List */}
      {userWallets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Phoenix Wallets ({userWallets.length})
          </h3>

          <div className="space-y-3">
            {userWallets.map((wallet) => (
              <div key={wallet.nodeId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-gray-900 dark:text-white">
                        {wallet.nodeId.slice(0, 16)}...{wallet.nodeId.slice(-8)}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.nodeId)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {wallet.alias} • Added: {new Date(wallet.added).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeUserWallet(wallet.nodeId)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Invoices */}
      {testInvoices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Invoices ({testInvoices.length})
          </h3>

          <div className="space-y-3">
            {testInvoices.map((invoice) => (
              <div key={invoice.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {invoice.amount} sats
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      invoice.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(invoice.created).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Lightning Invoice:</p>
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

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Payment Hash:</p>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-gray-700 dark:text-gray-300">
                        {invoice.paymentHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(invoice.paymentHash)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Wallet className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              How This Integration Works
            </h3>
            <div className="text-blue-700 dark:text-blue-300 mt-2 space-y-2">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Add your Phoenix wallet's Node ID to track it</li>
                <li>Create test invoices using this phoenixd instance</li>
                <li>Pay these invoices from your Phoenix wallet</li>
                <li>The payment will route through the Lightning Network</li>
                <li>Your Phoenix wallet will receive the payment instantly</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <p className="text-sm font-medium">💡 Integration Benefits:</p>
                <p className="text-sm">No direct peer connection needed! Payments route automatically through the Lightning Network topology. Your Phoenix wallet stays fully self-custodial while this phoenixd can generate invoices for you.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}