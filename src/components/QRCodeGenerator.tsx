'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Share2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRCodeGeneratorProps {
  value: string;
  title?: string;
  subtitle?: string;
  size?: number;
  className?: string;
  showActions?: boolean;
  onCopy?: () => void;
}

export default function QRCodeGenerator({
  value,
  title,
  subtitle,
  size = 256,
  className = '',
  showActions = true,
  onCopy
}: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dataUrl = await QRCode.toDataURL(value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeDataUrl(dataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }, [value, size]);

  useEffect(() => {
    generateQRCode();
  }, [generateQRCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'QR Code',
          text: subtitle || value,
          url: value
        });
      } catch (err) {
        console.error('Failed to share:', err);
        handleCopy(); // Fallback to copy
      }
    } else {
      handleCopy(); // Fallback for browsers without Web Share API
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
        <div className="w-64 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500">Generating QR...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
        <div className="w-64 h-64 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center border border-red-200 dark:border-red-800">
          <div className="text-red-600 dark:text-red-400 text-center">
            <p className="font-medium">Failed to generate QR code</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center ${className}`}
    >
      {(title || subtitle) && (
        <div className="text-center mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="relative group">
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={qrCodeDataUrl}
          alt="QR Code"
          className="rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 bg-white p-4"
          width={size}
          height={size}
        />

        {/* Hover overlay for quick actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="p-2 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-all"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-all"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Value display */}
      <div className="mt-4 w-full max-w-sm">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <code className="text-xs text-gray-700 dark:text-gray-300 break-all flex-1 mr-2">
              {value.length > 60 ? `${value.substring(0, 60)}...` : value}
            </code>
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded transition-colors ${
                copied
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'
              }`}
              title={copied ? 'Copied!' : 'Copy'}
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              copied
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:hover:bg-orange-800 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      )}

      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 text-sm text-green-600 dark:text-green-400"
        >
          Copied to clipboard!
        </motion.div>
      )}
    </motion.div>
  );
}