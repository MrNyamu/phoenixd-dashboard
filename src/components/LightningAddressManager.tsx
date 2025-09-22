'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  ExternalLink,
  QrCode,
  Settings,
  Check,
  AlertCircle,
  Zap,
  Mail,
  DollarSign,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import type { LightningAddress, LightningAddressConfig } from '@/types/lightning-address';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function formatSats(msats: number): string {
  const sats = msats / 1000;
  if (sats >= 1000000) {
    return `${(sats / 1000000).toFixed(1)}M sats`;
  }
  if (sats >= 1000) {
    return `${(sats / 1000).toFixed(0)}k sats`;
  }
  return `${Math.round(sats).toLocaleString()} sats`;
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onCopy
}: {
  address: LightningAddress;
  onEdit: (address: LightningAddress) => void;
  onDelete: (address: string) => void;
  onCopy: (address: string) => void;
}) {
  const [showQR, setShowQR] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {address.username}
            </h3>
            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
              address.enabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {address.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-medium">Address:</span>
              <div className="flex items-center gap-1">
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs break-all">
                  {address.address}
                </code>
                <button
                  onClick={() => onCopy(address.address)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                  title="Copy address"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>
                {formatSats(address.metadata.minSendable)} - {formatSats(address.metadata.maxSendable)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created {new Date(address.createdAt).toLocaleDateString()}</span>
              {address.lastUsed && (
                <span className="text-xs text-gray-500">
                  • Last used {new Date(address.lastUsed).toLocaleDateString()}
                </span>
              )}
            </div>

            {address.metadata.description && (
              <p className="text-gray-700 dark:text-gray-300">
                {address.metadata.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1 sm:ml-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle QR code"
          >
            {showQR ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <button
            onClick={() => onEdit(address)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Edit address"
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => onDelete(address.address)}
            className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 rounded-lg transition-colors"
            title="Delete address"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-center">
              <QRCodeGenerator
                value={address.address}
                title="Lightning Address"
                subtitle={`Send payments to ${address.address}`}
                size={200}
                onCopy={() => onCopy(address.address)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LightningAddressManager() {
  const [addresses, setAddresses] = useState<LightningAddress[]>([]);
  const [config, setConfig] = useState<LightningAddressConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [newAddress, setNewAddress] = useState({
    username: '',
    description: '',
    avatar: '',
    minSendable: 1,
    maxSendable: 100000
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lightning-address/manage');
      const result: ApiResponse<{ addresses: LightningAddress[]; config: LightningAddressConfig }> = await response.json();

      if (result.success && result.data) {
        setAddresses(result.data.addresses);
        setConfig(result.data.config);
      } else {
        setError(result.error || 'Failed to load Lightning Addresses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Lightning Addresses');
    } finally {
      setLoading(false);
    }
  };

  const createAddress = async () => {
    try {
      const response = await fetch('/api/lightning-address/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });

      const result: ApiResponse<LightningAddress> = await response.json();

      if (result.success && result.data) {
        setAddresses(prev => [...prev, result.data!]);
        setNewAddress({
          username: '',
          description: '',
          avatar: '',
          minSendable: 1,
          maxSendable: 100000
        });
        setShowCreateForm(false);
      } else {
        setError(result.error || 'Failed to create Lightning Address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create Lightning Address');
    }
  };

  const deleteAddress = async (address: string) => {
    try {
      const response = await fetch(`/api/lightning-address/manage?address=${encodeURIComponent(address)}`, {
        method: 'DELETE'
      });

      const result: ApiResponse<any> = await response.json();

      if (result.success) {
        setAddresses(prev => prev.filter(addr => addr.address !== address));
      } else {
        setError(result.error || 'Failed to delete Lightning Address');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete Lightning Address');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            Lightning Addresses
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your Lightning Network payment addresses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-base"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs sm:text-base"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Create Address</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Success Message */}
      {copiedAddress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">
              Copied {copiedAddress} to clipboard
            </span>
          </div>
        </motion.div>
      )}

      {/* Create Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create Lightning Address
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={newAddress.username}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="your-name"
                  />
                  {config && (
                    <p className="text-xs text-gray-500 mt-1">
                      Will create: {newAddress.username}@{config.domain}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newAddress.description}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Payment description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min Amount (sats)
                    </label>
                    <input
                      type="number"
                      value={newAddress.minSendable}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, minSendable: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Amount (sats)
                    </label>
                    <input
                      type="number"
                      value={newAddress.maxSendable}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, maxSendable: parseInt(e.target.value) || 100000 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={createAddress}
                  disabled={!newAddress.username.trim()}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Address
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Addresses List */}
      <div className="space-y-4">
        <AnimatePresence>
          {addresses.map((address) => (
            <AddressCard
              key={address.address}
              address={address}
              onEdit={(addr) => {
                // TODO: Implement edit functionality
                console.log('Edit address:', addr);
              }}
              onDelete={deleteAddress}
              onCopy={copyToClipboard}
            />
          ))}
        </AnimatePresence>

        {addresses.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Lightning Addresses
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first Lightning Address to start receiving payments
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Create Lightning Address</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}