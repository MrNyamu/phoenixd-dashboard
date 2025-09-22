'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Hash,
  Key,
  CreditCard,
  DollarSign,
  Receipt,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { formatSats, formatRelativeTime, copyToClipboard } from '@/lib/utils';

interface TransactionDetail {
  paymentId: string;
  paymentHash: string;
  paymentPreimage?: string;
  recipientAmountSat?: number;
  routingFeeSat?: number;
  amountMsat?: number;
  description?: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
  type: 'sent' | 'received';
  invoice?: string;
  expiresAt?: number;
}

interface TransactionDetailsProps {
  transaction: TransactionDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetails({ transaction, isOpen, onClose }: TransactionDetailsProps) {
  const [copyFeedback, setCopyFeedback] = useState('');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  if (!transaction) return null;

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const downloadTransactionCSV = () => {
    const csvData = [
      ['Field', 'Value'],
      ['Payment ID', transaction.paymentId],
      ['Payment Hash', transaction.paymentHash],
      ['Payment Preimage', transaction.paymentPreimage || 'N/A'],
      ['Type', transaction.type === 'sent' ? 'Sent' : 'Received'],
      ['Status', transaction.status],
      ['Amount (sats)', transaction.recipientAmountSat?.toString() || (transaction.amountMsat ? (transaction.amountMsat / 1000).toString() : 'N/A')],
      ['Routing Fee (sats)', transaction.routingFeeSat?.toString() || 'N/A'],
      ['Description', transaction.description || 'N/A'],
      ['Created At', new Date(transaction.createdAt * 1000).toISOString()],
      ['Expires At', transaction.expiresAt ? new Date(transaction.expiresAt * 1000).toISOString() : 'N/A'],
      ['Invoice', transaction.invoice || 'N/A']
    ];

    const csvContent = csvData.map(row =>
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transaction_${transaction.paymentId.slice(0, 8)}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const DetailRow = ({
    label,
    value,
    icon: Icon,
    copyable = false,
    sensitive = false,
    truncate = false
  }: {
    label: string;
    value: string;
    icon: any;
    copyable?: boolean;
    sensitive?: boolean;
    truncate?: boolean;
  }) => {
    const displayValue = sensitive && !showSensitiveData
      ? '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
      : truncate && value.length > 40
        ? `${value.slice(0, 20)}...${value.slice(-20)}`
        : value;

    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="text-sm text-gray-900 dark:text-white font-mono break-all">
              {displayValue}
            </p>
          </div>
        </div>
        {copyable && (
          <button
            onClick={() => handleCopy(value, label)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title={`Copy ${label}`}
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  const totalAmount = (transaction.recipientAmountSat || 0) + (transaction.routingFeeSat || 0);
  const amountInSats = transaction.recipientAmountSat || (transaction.amountMsat ? transaction.amountMsat / 1000 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  transaction.type === 'received'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {transaction.type === 'received' ? (
                    <ArrowDownRight className="w-6 h-6" />
                  ) : (
                    <ArrowUpRight className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Transaction Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.type === 'received' ? 'Payment Received' : 'Payment Sent'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  title={showSensitiveData ? 'Hide sensitive data' : 'Show sensitive data'}
                >
                  {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={downloadTransactionCSV}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  title="Download CSV"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                transaction.status === 'completed'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : transaction.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {transaction.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : transaction.status === 'pending' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </div>
            </div>

            {/* Amount Section */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {transaction.type === 'received' ? 'Amount Received' : 'Amount Sent'}
                </p>
                <p className={`text-3xl font-bold ${
                  transaction.type === 'received'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'received' ? '+' : '-'}{formatSats(amountInSats * 1000)}
                </p>
                {transaction.routingFeeSat && transaction.routingFeeSat > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    + {formatSats(transaction.routingFeeSat * 1000)} routing fee
                  </p>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
              <DetailRow
                label="Payment ID"
                value={transaction.paymentId}
                icon={Receipt}
                copyable
              />

              <DetailRow
                label="Payment Hash"
                value={transaction.paymentHash}
                icon={Hash}
                copyable
                truncate
              />

              {transaction.paymentPreimage && (
                <DetailRow
                  label="Payment Preimage"
                  value={transaction.paymentPreimage}
                  icon={Key}
                  copyable
                  sensitive
                  truncate
                />
              )}

              <DetailRow
                label="Amount"
                value={`${amountInSats} sats`}
                icon={DollarSign}
              />

              {transaction.routingFeeSat && (
                <DetailRow
                  label="Routing Fee"
                  value={`${transaction.routingFeeSat} sats`}
                  icon={CreditCard}
                />
              )}

              {transaction.description && (
                <DetailRow
                  label="Description"
                  value={transaction.description}
                  icon={Receipt}
                />
              )}

              <DetailRow
                label="Created"
                value={new Date(transaction.createdAt * 1000).toLocaleString()}
                icon={Calendar}
              />

              {transaction.expiresAt && (
                <DetailRow
                  label="Expires"
                  value={new Date(transaction.expiresAt * 1000).toLocaleString()}
                  icon={Clock}
                />
              )}

              {transaction.invoice && (
                <DetailRow
                  label="Invoice"
                  value={transaction.invoice}
                  icon={ExternalLink}
                  copyable
                  sensitive
                  truncate
                />
              )}
            </div>

            {/* Copy Feedback */}
            <AnimatePresence>
              {copyFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="fixed bottom-4 left-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copyFeedback}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}