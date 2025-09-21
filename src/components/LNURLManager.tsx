'use client';

import { useState, useEffect } from 'react';
import {
  Link,
  QrCode,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  Mail
} from 'lucide-react';

interface LNURLPayRequest {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  tag: string;
}

interface LNURLPayResponse {
  pr: string;
  successAction?: {
    tag: string;
    message?: string;
    url?: string;
  };
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

export default function LNURLManager() {
  const [activeTab, setActiveTab] = useState<'pay' | 'withdraw' | 'auth'>('pay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // LNURL-pay state
  const [lnurlToPay, setLnurlToPay] = useState('');
  const [payAmount, setPayAmount] = useState(1000);
  const [lnurlPayInfo, setLnurlPayInfo] = useState<LNURLPayRequest | null>(null);
  const [payingLnurl, setPayingLnurl] = useState(false);

  // LNURL-withdraw state
  const [lnurlToWithdraw, setLnurlToWithdraw] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Lightning Address state
  const [lightningAddress, setLightningAddress] = useState('');
  const [addressAmount, setAddressAmount] = useState(1000);
  const [payingAddress, setPayingAddress] = useState(false);

  const payLNURL = async () => {
    if (!lnurlToPay.trim()) {
      setError('Please enter an LNURL to pay');
      return;
    }

    setPayingLnurl(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await phoenixApiCall('/lnurlpay', 'POST', {
        lnurl: lnurlToPay,
        amountSat: payAmount
      });

      setSuccess('LNURL payment sent successfully!');
      setLnurlToPay('');
    } catch (err: any) {
      setError(`Failed to pay LNURL: ${err.message}`);
    } finally {
      setPayingLnurl(false);
    }
  };

  const payLightningAddress = async () => {
    if (!lightningAddress.trim()) {
      setError('Please enter a Lightning address');
      return;
    }

    if (!lightningAddress.includes('@')) {
      setError('Invalid Lightning address format. Should be like user@domain.com');
      return;
    }

    setPayingAddress(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert Lightning address to LNURL
      const [username, domain] = lightningAddress.split('@');
      const lnurlPayUrl = `https://${domain}/.well-known/lnurlp/${username}`;

      // First, fetch the LNURL-pay request
      const lnurlResponse = await fetch(lnurlPayUrl);
      if (!lnurlResponse.ok) {
        throw new Error(`Failed to fetch LNURL info from ${domain}`);
      }

      const lnurlData: LNURLPayRequest = await lnurlResponse.json();

      // Validate amount
      const amountMsat = addressAmount * 1000;
      if (amountMsat < lnurlData.minSendable || amountMsat > lnurlData.maxSendable) {
        throw new Error(`Amount must be between ${lnurlData.minSendable / 1000} and ${lnurlData.maxSendable / 1000} sats`);
      }

      // Get the invoice
      const callbackUrl = new URL(lnurlData.callback);
      callbackUrl.searchParams.set('amount', amountMsat.toString());

      const invoiceResponse = await fetch(callbackUrl.toString());
      if (!invoiceResponse.ok) {
        throw new Error('Failed to get invoice from LNURL service');
      }

      const invoiceData: LNURLPayResponse = await invoiceResponse.json();

      // Pay the invoice
      await phoenixApiCall('/payinvoice', 'POST', {
        invoice: invoiceData.pr
      });

      setSuccess(`Payment sent to ${lightningAddress}!`);
      setLightningAddress('');
    } catch (err: any) {
      setError(`Failed to pay Lightning address: ${err.message}`);
    } finally {
      setPayingAddress(false);
    }
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
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const tabs = [
    { id: 'pay', name: 'LNURL Pay', icon: Zap },
    { id: 'withdraw', name: 'Lightning Address', icon: Mail },
    { id: 'auth', name: 'LNURL Auth', icon: Link }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          LNURL Manager
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Interact with LNURL services and Lightning addresses
        </p>
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
                  onClick={() => setActiveTab(tab.id as 'pay' | 'withdraw' | 'auth')}
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
          {/* LNURL Pay Tab */}
          {activeTab === 'pay' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    LNURL Pay
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay to an LNURL or QR code
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LNURL
                  </label>
                  <textarea
                    value={lnurlToPay}
                    onChange={(e) => setLnurlToPay(e.target.value)}
                    placeholder="lnurl1dp68gurn8ghj7..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (sats)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseInt(e.target.value) || 1000)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  onClick={payLNURL}
                  disabled={payingLnurl || !lnurlToPay.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {payingLnurl ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Paying LNURL...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Pay LNURL
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Lightning Address Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Lightning Address
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay to a Lightning address like user@domain.com
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lightning Address
                  </label>
                  <input
                    type="email"
                    value={lightningAddress}
                    onChange={(e) => setLightningAddress(e.target.value)}
                    placeholder="satoshi@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (sats)
                  </label>
                  <input
                    type="number"
                    value={addressAmount}
                    onChange={(e) => setAddressAmount(parseInt(e.target.value) || 1000)}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  onClick={payLightningAddress}
                  disabled={payingAddress || !lightningAddress.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {payingAddress ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending Payment...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Pay Lightning Address
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                  How Lightning Addresses Work
                </h4>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                  <li>• Lightning addresses are human-readable payment identifiers</li>
                  <li>• They work like email addresses: user@domain.com</li>
                  <li>• The domain must support the LNURL-pay protocol</li>
                  <li>• Popular services: Strike, Wallet of Satoshi, LNbits</li>
                </ul>
              </div>
            </div>
          )}

          {/* LNURL Auth Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    LNURL Auth
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Authenticate with services using your Lightning node
                  </p>
                </div>
              </div>

              <div className="text-center py-8">
                <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  LNURL Auth Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  LNURL Auth functionality will be implemented in a future update
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  About LNURL Auth
                </h4>
                <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                  <li>• Passwordless authentication using your Lightning node</li>
                  <li>• No need to remember usernames or passwords</li>
                  <li>• Uses cryptographic signatures for security</li>
                  <li>• Supported by many Lightning-enabled services</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}