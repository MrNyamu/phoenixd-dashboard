import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Bitcoin/Lightning utility functions
export const formatSats = (msat: number, decimals = 0): string => {
  const sats = msat / 1000;
  if (sats >= 100000000) {
    return `${(sats / 100000000).toFixed(decimals)} BTC`;
  }
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(decimals)} M sats`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(decimals)} k sats`;
  }
  return `${Math.round(sats).toLocaleString()} sats`;
};

export const formatMsat = (msat: number): string => {
  return `${msat.toLocaleString()} msat`;
};

export const formatFeeRate = (basisPoints: number): string => {
  return `${(basisPoints / 100).toFixed(2)}%`;
};

export const formatDuration = (seconds: number): string => {
  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 },
  ];

  for (const unit of units) {
    const value = Math.floor(seconds / unit.seconds);
    if (value >= 1) {
      return `${value} ${unit.name}${value > 1 ? 's' : ''}`;
    }
  }
  return '0 seconds';
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - (timestamp * 1000);
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 2592000) return `${Math.floor(diffSeconds / 86400)}d ago`;
  return formatTimestamp(timestamp);
};

export const formatChannelState = (state: string): string => {
  switch (state) {
    case 'NORMAL':
      return 'Active';
    case 'OFFLINE':
      return 'Offline';
    case 'CLOSING':
      return 'Closing';
    default:
      return state;
  }
};

export const getChannelStateColor = (state: string): string => {
  switch (state) {
    case 'NORMAL':
      return 'text-green-500';
    case 'OFFLINE':
      return 'text-yellow-500';
    case 'CLOSING':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'SUCCEEDED':
    case 'PAID':
      return 'text-green-500';
    case 'PENDING':
      return 'text-yellow-500';
    case 'FAILED':
    case 'EXPIRED':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const calculateLiquidityRatio = (inbound: number, outbound: number): number => {
  const total = inbound + outbound;
  return total > 0 ? (outbound / total) * 100 : 0;
};

export const generateGradient = (percentage: number): string => {
  if (percentage <= 25) return 'from-red-500 to-red-600';
  if (percentage <= 50) return 'from-yellow-500 to-yellow-600';
  if (percentage <= 75) return 'from-blue-500 to-blue-600';
  return 'from-green-500 to-green-600';
};

export const truncateString = (str: string, startChars = 6, endChars = 6): string => {
  if (str.length <= startChars + endChars) return str;
  return `${str.slice(0, startChars)}...${str.slice(-endChars)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const validateInvoice = (invoice: string): boolean => {
  const lnPrefix = invoice.toLowerCase().startsWith('ln');
  const validLength = invoice.length > 100; // Basic length check
  return lnPrefix && validLength;
};

export const validateNodeId = (nodeId: string): boolean => {
  const hexPattern = /^[a-fA-F0-9]{66}$/;
  return hexPattern.test(nodeId);
};

export const validateAmount = (amount: string | number): boolean => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const generateQRCodeData = (invoice: string): string => {
  return `lightning:${invoice}`;
};

export const parseInvoiceAmount = (invoice: string): number | null => {
  try {
    // This is a simplified parser - in production you'd use a proper BOLT11 decoder
    const amountMatch = invoice.match(/(\d+)[munp]?$/);
    if (!amountMatch) return null;

    const amount = parseInt(amountMatch[1] || '0');
    const suffix = invoice.charAt(invoice.length - 1);

    switch (suffix) {
      case 'm': return amount * 1000; // milli-satoshi
      case 'u': return amount * 1000 * 1000; // micro-bitcoin (bits)
      case 'n': return amount * 1000 * 1000 * 1000; // nano-bitcoin
      case 'p': return amount * 1000 * 1000 * 1000 * 1000; // pico-bitcoin
      default: return amount * 1000; // assume satoshis
    }
  } catch (error) {
    console.error('Failed to parse invoice amount:', error);
    return null;
  }
};

export const getNetworkColor = (network: string): string => {
  switch (network) {
    case 'mainnet':
      return 'text-orange-500';
    case 'testnet':
      return 'text-green-500';
    case 'regtest':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
};