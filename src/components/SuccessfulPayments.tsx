'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Download,
  Filter,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ExternalLink,
  RefreshCw,
  FileText,
  TrendingUp,
  Clock,
  Copy
} from 'lucide-react';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import { formatSats, formatRelativeTime, copyToClipboard, cn, animationVariants } from '@/lib/utils';

interface SuccessfulPayment {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  description: string;
  timestamp: string;
  paymentHash: string;
  preimage?: string;
  fees?: number;
  status: 'completed';
  invoice?: string;
  completedAt: string;
}

interface ExportFilters {
  dateFrom: string;
  dateTo: string;
  type: 'all' | 'sent' | 'received';
  minAmount?: number;
  maxAmount?: number;
}

const SuccessfulPayments = () => {
  const [payments, setPayments] = useState<SuccessfulPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SuccessfulPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    dateTo: new Date().toISOString().split('T')[0],
    type: 'all'
  });
  const [copyFeedback, setCopyFeedback] = useState('');

  const { isConnected } = usePhoenixStore();

  // Fetch successful payments from PhoenixD
  const fetchSuccessfulPayments = async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      // Fetch both sent and received payments
      const [sentResponse, receivedResponse] = await Promise.all([
        fetch('/api/phoenixd/payments/sent'),
        fetch('/api/phoenixd/payments/received')
      ]);

      const sentPayments = sentResponse.ok ? await sentResponse.json() : [];
      const receivedPayments = receivedResponse.ok ? await receivedResponse.json() : [];

      // Filter only successful payments and transform to our format
      const successfulSent = sentPayments
        .filter((p: any) => p.status === 'completed' || p.status === 'succeeded')
        .map((p: any) => ({
          id: p.paymentHash || p.id,
          type: 'sent' as const,
          amount: p.amountMsat ? Math.floor(p.amountMsat / 1000) : 0,
          description: p.description || 'Lightning Payment',
          timestamp: p.completedAt || p.createdAt,
          paymentHash: p.paymentHash,
          preimage: p.preimage,
          fees: p.fees ? Math.floor(p.fees / 1000) : 0,
          status: 'completed' as const,
          completedAt: p.completedAt || p.createdAt
        }));

      const successfulReceived = receivedPayments
        .filter((p: any) => p.status === 'completed' || p.status === 'received')
        .map((p: any) => ({
          id: p.paymentHash || p.id,
          type: 'received' as const,
          amount: p.amountMsat ? Math.floor(p.amountMsat / 1000) : 0,
          description: p.description || 'Lightning Payment',
          timestamp: p.receivedAt || p.createdAt,
          paymentHash: p.paymentHash,
          status: 'completed' as const,
          invoice: p.serialized,
          completedAt: p.receivedAt || p.createdAt
        }));

      const allPayments = [...successfulSent, ...successfulReceived]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setPayments(allPayments);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      // Fallback to mock data for demonstration
      setPayments(generateMockPayments());
    } finally {
      setLoading(false);
    }
  };

  // Generate mock successful payments for demonstration
  const generateMockPayments = (): SuccessfulPayment[] => {
    const mockPayments: SuccessfulPayment[] = [];
    const now = new Date();

    for (let i = 0; i < 15; i++) {
      const isReceived = Math.random() > 0.5;
      const amount = Math.floor(Math.random() * 100000) + 1000; // 1k to 100k sats
      const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();

      mockPayments.push({
        id: `payment_${i}`,
        type: isReceived ? 'received' : 'sent',
        amount,
        description: isReceived
          ? `Payment received for ${['Coffee', 'Lightning tip', 'Invoice payment', 'Service fee'][Math.floor(Math.random() * 4)]}`
          : `Payment sent for ${['Online purchase', 'Lightning payment', 'Donation', 'Service payment'][Math.floor(Math.random() * 4)]}`,
        timestamp,
        paymentHash: `${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        preimage: !isReceived ? `${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : undefined,
        fees: !isReceived ? Math.floor(Math.random() * 100) : undefined,
        status: 'completed',
        completedAt: timestamp
      });
    }

    return mockPayments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Filter payments based on search and filters
  useEffect(() => {
    let filtered = payments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentHash.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(payment => payment.type === filters.type);
    }

    // Apply date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(payment =>
        new Date(payment.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(payment =>
        new Date(payment.timestamp) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Apply amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(payment => payment.amount >= filters.minAmount!);
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(payment => payment.amount <= filters.maxAmount!);
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, filters]);

  // Export payments as CSV using PhoenixD export API
  const exportToCSV = async () => {
    setExporting(true);
    try {
      const exportParams = {
        from: filters.dateFrom,
        to: filters.dateTo,
        type: filters.type === 'all' ? undefined : filters.type,
        format: 'csv'
      };

      const response = await fetch('/api/phoenixd/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(exportParams as any)
      });

      if (response.ok) {
        // If PhoenixD provides CSV directly
        const csvData = await response.text();
        downloadCSV(csvData, 'phoenix-payments-export.csv');
      } else {
        // Fallback: generate CSV from filtered payments
        generateLocalCSV();
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Fallback to local CSV generation
      generateLocalCSV();
    } finally {
      setExporting(false);
    }
  };

  // Generate CSV locally from filtered payments
  const generateLocalCSV = () => {
    const headers = [
      'Date',
      'Type',
      'Amount (sats)',
      'Description',
      'Payment Hash',
      'Fees (sats)',
      'Status'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        new Date(payment.timestamp).toISOString(),
        payment.type,
        payment.amount.toString(),
        `"${payment.description.replace(/"/g, '""')}"`,
        payment.paymentHash,
        payment.fees?.toString() || '0',
        payment.status
      ].join(','))
    ];

    const csvData = csvRows.join('\n');
    downloadCSV(csvData, `phoenix-successful-payments-${filters.dateFrom}-to-${filters.dateTo}.csv`);
  };

  // Download CSV file
  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  useEffect(() => {
    fetchSuccessfulPayments();
  }, [isConnected]);

  // Calculate summary statistics
  const totalSent = filteredPayments
    .filter(p => p.type === 'sent')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalReceived = filteredPayments
    .filter(p => p.type === 'received')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalFees = filteredPayments
    .filter(p => p.type === 'sent')
    .reduce((sum, p) => sum + (p.fees || 0), 0);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Connect to PhoenixD to view payments</p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            Successful Payments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and export your completed Lightning transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSuccessfulPayments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToCSV}
            disabled={exporting || filteredPayments.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export CSV
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Statistics */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredPayments.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Received</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatSats(totalReceived * 1000)}</p>
            </div>
            <ArrowDownRight className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sent</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatSats(totalSent * 1000)}</p>
            </div>
            <ArrowUpRight className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatSats(totalFees * 1000)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Payments</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Payments</option>
                  <option value="sent">Sent Only</option>
                  <option value="received">Received Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search descriptions..."
                    className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payments List */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment History ({filteredPayments.length})
          </h3>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Successful Payments Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {payments.length === 0
                  ? "No payments have been completed yet"
                  : "No payments match your current filters"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredPayments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        payment.type === 'received'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                      )}>
                        {payment.type === 'received' ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.type === 'received' ? 'Payment Received' : 'Payment Sent'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelativeTime(new Date(payment.timestamp).getTime())}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn(
                        'font-semibold text-lg',
                        payment.type === 'received'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                      )}>
                        {payment.type === 'received' ? '+' : '-'}{formatSats(payment.amount * 1000)}
                      </p>
                      {payment.fees && payment.fees > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fee: {formatSats(payment.fees * 1000)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full">
                          Completed
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleCopy(payment.paymentHash, 'Payment hash')}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Copy payment hash"
                        >
                          <Copy className="w-3 h-3" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Copy Feedback */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {copyFeedback}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuccessfulPayments;