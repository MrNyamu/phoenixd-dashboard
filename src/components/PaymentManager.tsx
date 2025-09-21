'use client';

import { useState, useEffect } from 'react';
import {
  Send,
  Receipt,
  Activity,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  QrCode,
  ExternalLink,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

interface Payment {
  id: string;
  type: 'sent' | 'received' | 'pending';
  amount: number;
  description: string;
  timestamp: string;
  paymentHash?: string;
  invoice?: string;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
}

interface PayInvoiceResponse {
  paymentHash: string;
  reason?: string;
  preimage?: string;
  fees?: number;
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

export default function PaymentManager() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'history'>('send');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Send payment state
  const [invoiceToPay, setInvoiceToPay] = useState('');
  const [sendingPayment, setSendingPayment] = useState(false);

  // Receive payment state
  const [receiveAmount, setReceiveAmount] = useState(1000);
  const [receiveDescription, setReceiveDescription] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<string>('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const sendPayment = async () => {
    if (!invoiceToPay.trim()) {
      setError('Please enter a Lightning invoice to pay');
      return;
    }

    setSendingPayment(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await phoenixApiCall('/payinvoice', 'POST', {
        invoice: invoiceToPay
      }) as PayInvoiceResponse;

      const newPayment: Payment = {
        id: `payment_${Date.now()}`,
        type: 'sent',
        amount: 0, // We don't know the amount from the response
        description: 'Lightning Payment',
        timestamp: new Date().toISOString(),
        paymentHash: response.paymentHash,
        status: response.reason ? 'failed' : 'completed',
        reason: response.reason
      };

      setPayments(prev => [newPayment, ...prev]);

      if (response.reason) {
        setError(`Payment failed: ${response.reason}`);
      } else {
        setSuccess('Payment sent successfully!');
        setInvoiceToPay('');
      }
    } catch (err: any) {
      setError(`Failed to send payment: ${err.message}`);
    } finally {
      setSendingPayment(false);
    }
  };

  const createInvoice = async () => {
    if (!receiveDescription.trim()) {
      setError('Please enter a description for the invoice');
      return;
    }

    setCreatingInvoice(true);
    setError(null);
    setSuccess(null);

    try {
      const invoiceData = await phoenixApiCall('/createinvoice', 'POST', {
        amountSat: receiveAmount,
        description: receiveDescription
      });

      setGeneratedInvoice(invoiceData.serialized);

      const newPayment: Payment = {
        id: `invoice_${Date.now()}`,
        type: 'pending',
        amount: receiveAmount,
        description: receiveDescription,
        timestamp: new Date().toISOString(),
        paymentHash: invoiceData.paymentHash,
        invoice: invoiceData.serialized,
        status: 'pending'
      };

      setPayments(prev => [newPayment, ...prev]);
      setSuccess('Invoice created successfully!');
    } catch (err: any) {
      setError(`Failed to create invoice: ${err.message}`);
    } finally {
      setCreatingInvoice(false);
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
    { id: 'send', name: 'Send Payment', icon: Send },
    { id: 'receive', name: 'Receive Payment', icon: Receipt },
    { id: 'history', name: 'Payment History', icon: Activity }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payment Manager
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Send and receive Lightning payments with phoenixd
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
                  onClick={() => setActiveTab(tab.id as 'send' | 'receive' | 'history')}
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
          {/* Send Payment Tab */}
          {activeTab === 'send' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Send Lightning Payment
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay a Lightning invoice instantly
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lightning Invoice
                  </label>
                  <textarea
                    value={invoiceToPay}
                    onChange={(e) => setInvoiceToPay(e.target.value)}
                    placeholder="lnbc10u1p5dq8hupp5..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Paste the Lightning invoice you want to pay
                  </p>
                </div>

                <button
                  onClick={sendPayment}
                  disabled={sendingPayment || !invoiceToPay.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending Payment...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Send Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Receive Payment Tab */}
          {activeTab === 'receive' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Receive Lightning Payment
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create an invoice to receive payments
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (sats)
                    </label>
                    <input
                      type="number"
                      value={receiveAmount}
                      onChange={(e) => setReceiveAmount(parseInt(e.target.value) || 1000)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={receiveDescription}
                      onChange={(e) => setReceiveDescription(e.target.value)}
                      placeholder="Payment for..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={createInvoice}
                  disabled={creatingInvoice || !receiveDescription.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingInvoice ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4" />
                      Create Invoice
                    </>
                  )}
                </button>

                {generatedInvoice && (
                  <div className="space-y-4">
                    <QRCodeDisplay
                      value={generatedInvoice}
                      title="Lightning Invoice QR Code"
                      description={`Scan to pay ${receiveAmount} sats for: ${receiveDescription}`}
                      size={256}
                    />

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Lightning Invoice</h4>
                        <button
                          onClick={() => copyToClipboard(generatedInvoice)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block break-all">
                        {generatedInvoice}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Payment History
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View your recent Lightning transactions
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Payment History
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your payments and invoices will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          payment.type === 'sent' ? 'bg-orange-100 dark:bg-orange-900/20' :
                          payment.type === 'received' ? 'bg-green-100 dark:bg-green-900/20' :
                          'bg-blue-100 dark:bg-blue-900/20'
                        }`}>
                          {payment.type === 'sent' ? (
                            <ArrowUpRight className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          ) : payment.type === 'received' ? (
                            <ArrowDownRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {payment.type === 'sent' ? 'Payment Sent' :
                             payment.type === 'received' ? 'Payment Received' :
                             'Invoice Created'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {payment.description}
                          </p>
                          {payment.reason && (
                            <p className="text-xs text-red-500 dark:text-red-400">
                              {payment.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          payment.type === 'received' ? 'text-green-600 dark:text-green-400' :
                          payment.type === 'sent' ? 'text-orange-600 dark:text-orange-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {payment.type === 'received' ? '+' : payment.type === 'sent' ? '-' : ''}
                          {payment.amount > 0 ? `${payment.amount.toLocaleString()} sats` : 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(payment.timestamp).toLocaleTimeString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      {payment.invoice && (
                        <button
                          onClick={() => copyToClipboard(payment.invoice!)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}