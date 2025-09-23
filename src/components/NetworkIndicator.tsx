'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Globe, Beaker, Cpu } from 'lucide-react';
import { getCurrentNetwork, getCurrentNetworkConfig, isProductionNetwork } from '@/lib/network';

interface NetworkIndicatorProps {
  className?: string;
  showWarning?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function NetworkIndicator({
  className = '',
  showWarning = true,
  size = 'md'
}: NetworkIndicatorProps) {
  const network = getCurrentNetwork();
  const config = getCurrentNetworkConfig();
  const isProduction = isProductionNetwork();

  const getIcon = () => {
    switch (network) {
      case 'mainnet':
        return Globe;
      case 'testnet':
        return Beaker;
      case 'regtest':
        return Cpu;
      default:
        return Globe;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          text: 'text-xs',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5',
          text: 'text-base',
        };
      default:
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4',
          text: 'text-sm',
        };
    }
  };

  const Icon = getIcon();
  const sizeClasses = getSizeClasses();

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          inline-flex items-center gap-1.5 rounded-lg font-medium
          ${config.backgroundColor} ${config.color}
          ${sizeClasses.container}
        `}
      >
        <Icon className={sizeClasses.icon} />
        <span className={sizeClasses.text}>
          {config.displayName}
        </span>
      </motion.div>

      {showWarning && !isProduction && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400"
        >
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs font-medium">
            {network === 'testnet' ? 'Test Network' : 'Development Mode'}
          </span>
        </motion.div>
      )}
    </div>
  );
}