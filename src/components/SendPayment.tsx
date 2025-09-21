'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Scan,
  Calculator,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { usePaymentOperations } from '@/hooks/usePhoenix';
import { usePhoenixStore } from '@/stores/usePhoenixStore';
import {
  formatSats,
  validateInvoice,
  validateAmount,
  parseInvoiceAmount,
  copyToClipboard,
  cn,
  animationVariants
} from '@/lib/utils';

const SendPayment = () => {
  const [invoice, setInvoice] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isAmountOverride, setIsAmountOverride] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const { sendPayment, estimateFees, isLoading } = usePaymentOperations();
  const { balance } = usePhoenixStore();

  const invoiceAmount = parseInvoiceAmount(invoice);
  const finalAmount = isAmountOverride && customAmount
    ? parseFloat(customAmount) * 1000
    : invoiceAmount;

  const isValidInvoice = validateInvoice(invoice);
  const isValidAmount = !customAmount || validateAmount(customAmount);
  const hasAmount = finalAmount && finalAmount > 0;
  const hasSufficientBalance = balance && finalAmount
    ? balance.balanceMsat >= finalAmount + (estimatedFee || 0)
    : false;

  const canSend = isValidInvoice && isValidAmount && hasAmount && hasSufficientBalance && !isLoading;

  useEffect(() => {
    const estimateFeesDebounced = async () => {
      if (isValidInvoice && hasAmount) {
        const result = await estimateFees(invoice, finalAmount);
        if (result.success && 'data' in result && result.data) {
          setEstimatedFee(result.data.routingFeeMsat);
        }
      }
    };

    const timeoutId = setTimeout(estimateFeesDebounced, 500);
    return () => clearTimeout(timeoutId);
  }, [invoice, finalAmount, estimateFees, isValidInvoice, hasAmount]);

  const handleSend = async () => {
    if (!canSend) return;

    const result = await sendPayment(
      invoice,
      isAmountOverride && customAmount ? parseFloat(customAmount) * 1000 : undefined
    );

    setPaymentResult(result);
    setShowResult(true);

    if (result.success) {
      // Reset form on success
      setTimeout(() => {
        setInvoice('');
        setCustomAmount('');
        setDescription('');
        setIsAmountOverride(false);
        setEstimatedFee(null);
        setShowResult(false);
        setPaymentResult(null);
      }, 3000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.toLowerCase().startsWith('ln')) {
        setInvoice(text);
      }
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  };

  const getAmountDisplay = () => {
    if (isAmountOverride && customAmount) {
      return `${parseFloat(customAmount).toLocaleString()} sats`;
    }
    if (invoiceAmount) {
      return formatSats(invoiceAmount);
    }
    return 'No amount specified';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideDown}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4">
          <Send className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Send Payment</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Send Lightning payments instantly
        </p>
      </motion.div>

      {/* Payment Form */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={animationVariants.slideUp}
        transition={{ delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          {/* Invoice Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lightning Invoice
              </label>
              <div className="relative">
                <textarea
                  value={invoice}
                  onChange={(e) => setInvoice(e.target.value)}
                  placeholder="Paste Lightning invoice here (lnbc...)"
                  className={cn(
                    'w-full px-4 py-3 pr-20 border rounded-lg resize-none h-24 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors',
                    isValidInvoice || !invoice
                      ? 'border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500'
                      : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                  )}
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePaste}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg"
                    title="Paste from clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg"
                    title="Scan QR code"
                  >
                    <Scan className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              {invoice && !isValidInvoice && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-600 dark:text-red-400 text-sm mt-1"
                >
                  Invalid Lightning invoice format
                </motion.p>
              )}
            </div>

            {/* Amount Section */}
            <AnimatePresence>
              {isValidInvoice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Invoice Amount</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getAmountDisplay()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-gray-400" />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isAmountOverride}
                          onChange={(e) => setIsAmountOverride(e.target.checked)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        Custom amount
                      </label>
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <AnimatePresence>
                    {isAmountOverride && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Custom Amount (sats)
                        </label>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount in satoshis"
                          className={cn(
                            'w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors',
                            isValidAmount
                              ? 'border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500'
                              : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                          )}
                        />
                        {customAmount && !isValidAmount && (
                          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                            Please enter a valid amount
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fee Estimation */}
            <AnimatePresence>
              {estimatedFee !== null && hasAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Fee Estimation
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSats(finalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Routing fee:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSats(estimatedFee)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 dark:border-blue-800 pt-1">
                      <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {formatSats((finalAmount || 0) + estimatedFee)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Balance Check */}
            <AnimatePresence>
              {finalAmount && balance && !hasSufficientBalance && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      Insufficient balance
                    </span>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    You need {formatSats((finalAmount || 0) + (estimatedFee || 0))} but only have {formatSats(balance.balanceMsat)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send Button */}
            <motion.button
              whileHover={canSend ? { scale: 1.02 } : {}}
              whileTap={canSend ? { scale: 0.98 } : {}}
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold text-white transition-all duration-200',
                canSend
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg'
                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Payment
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Payment Result Modal */}
      <AnimatePresence>
        {showResult && paymentResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className={cn(
                  'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                  paymentResult.success
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-red-100 dark:bg-red-900/20'
                )}>
                  {paymentResult.success ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600" />
                  )}
                </div>

                <h3 className={cn(
                  'text-xl font-bold mb-2',
                  paymentResult.success ? 'text-green-600' : 'text-red-600'
                )}>
                  {paymentResult.success ? 'Payment Sent!' : 'Payment Failed'}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {paymentResult.success
                    ? 'Your Lightning payment was sent successfully.'
                    : paymentResult.error || 'An error occurred while sending the payment.'
                  }
                </p>

                {paymentResult.success && paymentResult.payment && (
                  <div className="space-y-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSats(paymentResult.payment.recipientAmountMsat)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSats(paymentResult.payment.routingFeeMsat)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Payment Hash:</span>
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {paymentResult.payment.paymentHash.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setShowResult(false)}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SendPayment;