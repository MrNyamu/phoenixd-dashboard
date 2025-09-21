'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  Copy,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  QrCode,
  Share,
  Edit3,
  DollarSign
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { usePaymentOperations } from '@/hooks/usePhoenix';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import {
  formatSats,
  formatRelativeTime,
  copyToClipboard,
  cn,
  animationVariants
} from '@/lib/utils';

const ReceivePayment = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState('3600'); // 1 hour default
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const { createInvoice, isLoading } = usePaymentOperations();
  const { invoices } = usePhoenixStore();

  const recentInvoices = invoices.slice(0, 5);

  const handleCreateInvoice = async () => {
    const result = await createInvoice({
      amountMsat: amount ? parseFloat(amount) * 1000 : undefined,
      description: description || undefined,
      expirySeconds: parseInt(expiry),
    });

    if (result.success && result.invoice) {
      setGeneratedInvoice(result.invoice);
      setShowQR(true);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopyFeedback(`${type} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const generateQRCodeURL = (invoice: string) => {
    // In a real app, you'd use a QR code library like qrcode
    // For now, we'll use a placeholder QR code service
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`lightning:${invoice}`)}`;
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'PENDING':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'EXPIRED':
        return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const InvoiceCard = ({ invoice, index }: { invoice: any; index: number }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {invoice.amountMsat ? formatSats(invoice.amountMsat) : 'Any amount'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(invoice.createdAt)}
            </p>
          </div>
        </div>
        <span className={cn(
          'px-2 py-1 text-xs rounded-full font-medium',
          getInvoiceStatusColor(invoice.status)
        )}>
          {invoice.status}
        </span>
      </div>

      {invoice.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {invoice.description}
        </p>
      )}

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCopy(invoice.serialized, 'Invoice')}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <Copy className="w-3 h-3" />
          Copy
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setGeneratedInvoice(invoice);
            setShowQR(true);
          }}
          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800/20"
        >
          <QrCode className="w-3 h-3" />
          QR
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideDown}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-4">
          <Receipt className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Receive Payment</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create Lightning invoices to receive payments
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Generator */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Invoice
            </h3>

            <div className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (sats) - Optional
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Leave empty for any amount"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-orange-500"
                  />
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {amount && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ≈ {(parseFloat(amount) / 100000000).toFixed(8)} BTC
                  </p>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description - Optional
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this payment for?"
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Expiry Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expires In
                </label>
                <div className="relative">
                  <select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-orange-500 appearance-none"
                  >
                    <option value="600">10 minutes</option>
                    <option value="1800">30 minutes</option>
                    <option value="3600">1 hour</option>
                    <option value="7200">2 hours</option>
                    <option value="86400">24 hours</option>
                    <option value="604800">1 week</option>
                  </select>
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateInvoice}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Creating...
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    Create Invoice
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Recent Invoices */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={animationVariants.slideUp}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Invoices
            </h3>

            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No invoices created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice, index) => (
                  <InvoiceCard key={invoice.paymentHash} invoice={invoice} index={index} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

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

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && generatedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Lightning Invoice
                </h3>

                {/* QR Code */}
                <div className="mb-4">
                  <QRCodeGenerator
                    value={generatedInvoice.serialized}
                    title="Lightning Invoice"
                    subtitle={generatedInvoice.description || 'Payment request'}
                    size={256}
                    onCopy={() => handleCopy(generatedInvoice.serialized, 'Invoice')}
                  />
                </div>

                {/* Invoice Details */}
                <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                  {generatedInvoice.amountMsat && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSats(generatedInvoice.amountMsat)}
                      </span>
                    </div>
                  )}
                  {generatedInvoice.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Description:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {generatedInvoice.description}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expires:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(generatedInvoice.expiresAt * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Invoice String */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Invoice
                  </label>
                  <div className="relative">
                    <textarea
                      value={generatedInvoice.serialized}
                      readOnly
                      className="w-full h-20 px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono resize-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCopy(generatedInvoice.serialized, 'Invoice')}
                      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCopy(generatedInvoice.serialized, 'Invoice')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Invoice
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowQR(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceivePayment;