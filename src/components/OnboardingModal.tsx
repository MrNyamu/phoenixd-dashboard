'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  ArrowRight,
  Wallet,
  Network,
  Shield,
  CheckCircle,
  Sparkles,
  Lightning,
  Globe,
  Users,
  Clock,
  DollarSign,
  Target,
  Gift
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFunding: () => void;
  hasChannels: boolean;
}

export default function OnboardingModal({ isOpen, onClose, onStartFunding, hasChannels }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to PhoenixD',
      subtitle: 'Your Self-Sovereign Lightning Network Client',
      icon: Zap,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightning className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Phoenix is a non-custodial Lightning wallet that automatically manages channels for you.
              Get started by funding your wallet to enable Lightning payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Self-Custodial</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You control your keys and funds
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Network className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Auto Channels</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Channels open automatically
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Instant Payments</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send and receive instantly
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'funding',
      title: 'Fund Your Wallet',
      subtitle: 'Enable Lightning Network functionality',
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Phoenix automatically opens Lightning channels when you fund your wallet.
              This enables instant, low-cost Lightning payments.
            </p>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Recommended Funding Amounts
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <h5 className="font-semibold text-gray-900 dark:text-white">Basic</h5>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">50k sats</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Small payments</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg border-2 border-orange-300 dark:border-orange-700">
                <Target className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                <h5 className="font-semibold text-gray-900 dark:text-white">Recommended</h5>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">100k sats</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Most features</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <h5 className="font-semibold text-gray-900 dark:text-white">Premium</h5>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">500k+ sats</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Large payments</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">What happens next?</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                  <li>• You'll get a Lightning invoice to pay</li>
                  <li>• Phoenix automatically opens channels when paid</li>
                  <li>• Start sending and receiving Lightning payments instantly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Lightning Features',
      subtitle: 'Discover what you can do with Phoenix',
      icon: Network,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Network className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Once funded, you'll have access to the full Lightning Network ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Instant Payments</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Send and receive payments in milliseconds
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Low Fees</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pay minimal routing fees, often just a few satoshis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">LNURL Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Use Lightning addresses and LNURL protocols
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Global Network</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect to thousands of Lightning nodes worldwide
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Self-Custody</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Full control over your private keys and funds
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Auto Management</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Channels managed automatically by Phoenix
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleGetStarted = () => {
    onClose();
    onStartFunding();
  };

  const handleSkip = () => {
    onClose();
  };

  // Auto-close if user already has channels
  useEffect(() => {
    if (hasChannels && isOpen) {
      onClose();
    }
  }, [hasChannels, isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <currentStepData.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{currentStepData.title}</h1>
                  <p className="text-orange-100">{currentStepData.subtitle}</p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-white'
                        : index < currentStep
                        ? 'bg-white bg-opacity-60'
                        : 'bg-white bg-opacity-20'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isAnimating ? 20 : 0 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Skip Setup
              </button>

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 font-semibold transition-all"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 font-semibold transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Fund My Wallet
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}