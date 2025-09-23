'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { getCurrentNetwork, getCurrentNetworkConfig, isProductionNetwork } from '@/lib/network';

export default function NetworkWarningBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const network = getCurrentNetwork();
  const config = getCurrentNetworkConfig();
  const isProduction = isProductionNetwork();

  // Don't show banner for mainnet or if dismissed
  if (isProduction || isDismissed) {
    return null;
  }

  const getWarningContent = () => {
    switch (network) {
      case 'testnet':
        return {
          title: 'Testnet Mode Active',
          message: 'You are using Bitcoin Testnet. Funds have no real value.',
          actionText: 'Get Testnet Coins',
          actionUrl: config.faucetUrl,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'regtest':
        return {
          title: 'Development Mode Active',
          message: 'You are using Bitcoin Regtest for local development.',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-600 dark:text-blue-400',
        };
      default:
        return {
          title: 'Non-Production Network',
          message: 'You are not using Bitcoin Mainnet.',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          iconColor: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const warning = getWarningContent();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={`${warning.bgColor} ${warning.borderColor} border-b`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${warning.iconColor} flex-shrink-0`} />
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className={`font-semibold ${warning.textColor} text-sm`}>
                  {warning.title}
                </span>
                <span className={`${warning.textColor} text-sm`}>
                  {warning.message}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {warning.actionUrl && (
                <a
                  href={warning.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-1 px-3 py-1 text-xs font-medium
                    ${warning.textColor} hover:bg-black/5 dark:hover:bg-white/5
                    rounded-lg transition-colors
                  `}
                >
                  {warning.actionText}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <button
                onClick={() => setIsDismissed(true)}
                className={`
                  p-1 rounded-lg transition-colors
                  ${warning.iconColor} hover:bg-black/10 dark:hover:bg-white/10
                `}
                aria-label="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}