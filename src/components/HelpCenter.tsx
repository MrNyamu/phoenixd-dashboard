'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  Zap,
  Network,
  DollarSign,
  Shield,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  Info,
  AlertCircle,
  CheckCircle,
  Layers,
  Coins,
  Clock,
  Users,
  Key,
  Globe,
  Cpu,
  TrendingUp,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'basics' | 'lightning' | 'node' | 'payments' | 'security';
}

interface GuideSection {
  title: string;
  icon: any;
  content: string;
  steps?: string[];
  tips?: string[];
}

const HelpCenter = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'guides' | 'faq' | 'glossary'>('overview');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'basics',
      question: 'What is the Lightning Network?',
      answer: 'The Lightning Network is a "Layer 2" payment protocol built on top of Bitcoin. It enables instant, low-cost transactions by creating payment channels between users. Think of it as a faster highway built above the regular Bitcoin road - you can travel much faster with minimal tolls!'
    },
    {
      category: 'basics',
      question: 'How is Lightning different from regular Bitcoin?',
      answer: 'Regular Bitcoin transactions are recorded on the blockchain (Layer 1), which takes ~10 minutes per confirmation. Lightning transactions happen instantly off-chain and only settle on the blockchain when channels are closed. It\'s like keeping a bar tab open vs. paying for each drink separately.'
    },
    {
      category: 'lightning',
      question: 'What are Lightning channels?',
      answer: 'Channels are like digital payment tubes between two parties. You lock some Bitcoin in a channel, and can then send it back and forth instantly. When you\'re done, the channel closes and the final balance is recorded on the Bitcoin blockchain.'
    },
    {
      category: 'lightning',
      question: 'What is channel liquidity?',
      answer: 'Liquidity is the amount of Bitcoin available to send (outbound) or receive (inbound) through your channels. Think of it like water in pipes - you need enough water pressure (liquidity) to flow in both directions.'
    },
    {
      category: 'node',
      question: 'What is Phoenix node?',
      answer: 'Phoenix is a self-custodial Lightning wallet and node implementation that simplifies Lightning Network usage. It automatically manages channels and routing, making Lightning as easy to use as a regular Bitcoin wallet.'
    },
    {
      category: 'node',
      question: 'Do I need to be online 24/7?',
      answer: 'For receiving payments, your node should be online. Phoenix handles this by using a hybrid approach where ACINQ can receive payments on your behalf when you\'re offline, which you can claim later.'
    },
    {
      category: 'payments',
      question: 'What are Lightning invoices?',
      answer: 'Lightning invoices are payment requests that specify an amount and destination. They\'re like QR codes at a store - scan them to pay instantly. Invoices expire after a set time (usually 1 hour) for security.'
    },
    {
      category: 'payments',
      question: 'What is a Lightning Address?',
      answer: 'Lightning Addresses look like email addresses (user@domain.com) but are for receiving Bitcoin payments. They\'re human-readable and much easier to share than long invoice strings.'
    },
    {
      category: 'security',
      question: 'Is Lightning Network secure?',
      answer: 'Yes! Lightning inherits Bitcoin\'s security model. Your funds are protected by smart contracts, and only you have the keys to your channels. Even if a channel partner goes offline, you can recover your funds.'
    },
    {
      category: 'security',
      question: 'What happens if I lose connection?',
      answer: 'Your funds remain safe. Channels have built-in timeout mechanisms, and you can force-close channels to recover funds if needed. Phoenix also provides backup mechanisms for channel states.'
    }
  ];

  const guides: GuideSection[] = [
    {
      title: 'Getting Started with Lightning',
      icon: Zap,
      content: 'Lightning Network is Bitcoin\'s solution for instant, low-cost payments. Here\'s how to get started with your Phoenix node.',
      steps: [
        'Fund your node wallet with Bitcoin',
        'Wait for channels to be automatically created',
        'Start sending and receiving Lightning payments',
        'Monitor your channels and liquidity'
      ],
      tips: [
        'Keep some Bitcoin on-chain for channel opening fees',
        'Start with small amounts while learning',
        'Phoenix handles channel management automatically'
      ]
    },
    {
      title: 'Understanding Channels',
      icon: Network,
      content: 'Channels are the foundation of Lightning. They\'re like payment highways between nodes.',
      steps: [
        'Channels require Bitcoin to be locked up as collateral',
        'Each channel has two sides: local (yours) and remote (partner\'s)',
        'Payments shift the balance between these sides',
        'Channels can be closed to settle on-chain'
      ],
      tips: [
        'Bigger channels mean you can send/receive more',
        'Keep channels balanced for optimal routing',
        'Phoenix opens channels automatically when needed'
      ]
    },
    {
      title: 'Managing Liquidity',
      icon: Coins,
      content: 'Liquidity determines how much you can send or receive through Lightning.',
      steps: [
        'Outbound liquidity: Bitcoin you can send',
        'Inbound liquidity: Bitcoin you can receive',
        'Total capacity: Sum of both sides',
        'Rebalancing: Shifting liquidity between channels'
      ],
      tips: [
        'You need inbound liquidity to receive payments',
        'Sending payments creates inbound liquidity',
        'Phoenix manages liquidity automatically'
      ]
    },
    {
      title: 'Creating and Paying Invoices',
      icon: DollarSign,
      content: 'Lightning invoices are how you request and send payments on the network.',
      steps: [
        'Click "Create Invoice" to generate a payment request',
        'Set the amount (or leave blank for any amount)',
        'Share the invoice QR code or text with the payer',
        'Payment arrives instantly when paid'
      ],
      tips: [
        'Invoices expire (usually after 1 hour)',
        'Add descriptions for better record-keeping',
        'You can create invoices even when offline'
      ]
    },
    {
      title: 'Using Lightning Addresses',
      icon: Globe,
      content: 'Lightning Addresses make receiving payments as easy as email.',
      steps: [
        'Create a Lightning Address (like user@domain.com)',
        'Share it with anyone who wants to pay you',
        'Payments automatically generate invoices',
        'No need to be online when address is shared'
      ],
      tips: [
        'Addresses never expire unlike invoices',
        'Set min/max amounts for safety',
        'Perfect for donations and tips'
      ]
    }
  ];

  const glossary = [
    { term: 'Satoshi (sat)', definition: 'The smallest unit of Bitcoin. 1 Bitcoin = 100,000,000 satoshis.' },
    { term: 'On-chain', definition: 'Transactions recorded directly on the Bitcoin blockchain.' },
    { term: 'Off-chain', definition: 'Transactions that happen outside the blockchain (like Lightning).' },
    { term: 'HTLC', definition: 'Hash Time-Locked Contract - the smart contract that secures Lightning payments.' },
    { term: 'Routing', definition: 'Finding a path through the network to deliver payments.' },
    { term: 'Watchtower', definition: 'A service that monitors channels for security when you\'re offline.' },
    { term: 'Force close', definition: 'Unilaterally closing a channel without partner cooperation.' },
    { term: 'Commitment transaction', definition: 'The latest agreed state of a channel balance.' },
    { term: 'Payment hash', definition: 'A unique identifier for each Lightning payment.' },
    { term: 'Preimage', definition: 'The secret that proves a payment was completed.' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Help Center
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn about Lightning Network and your Phoenix node
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex flex-wrap">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'guides', label: 'Guides', icon: PlayCircle },
              { id: 'faq', label: 'FAQ', icon: MessageCircle },
              { id: 'glossary', label: 'Glossary', icon: BookOpen }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium
                    border-b-2 transition-colors flex-1 sm:flex-initial
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 sm:p-6 border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex items-start gap-3">
                    <Zap className="w-8 h-8 text-orange-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Lightning Network Basics
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lightning is Bitcoin's Layer 2 solution for instant payments. It uses payment channels to enable near-instant, low-fee transactions while maintaining Bitcoin's security.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start gap-3">
                    <Cpu className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Your Phoenix Node
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phoenix automatically manages channels, routing, and liquidity. It's designed to make Lightning as simple as possible while keeping you in full control of your funds.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Quick Start Steps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { step: 1, title: 'Fund Wallet', desc: 'Add Bitcoin to your node', icon: Coins },
                    { step: 2, title: 'Open Channels', desc: 'Phoenix does this automatically', icon: Network },
                    { step: 3, title: 'Create Invoice', desc: 'Generate payment requests', icon: DollarSign },
                    { step: 4, title: 'Send & Receive', desc: 'Instant Lightning payments', icon: Zap }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.step}. {item.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">
                      Pro Tip: Start Small
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      Begin with small amounts while learning. Lightning is still evolving technology. Phoenix makes it safe and easy, but it's good to understand the basics first.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Guides Tab */}
          {activeTab === 'guides' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {guides.map((guide, index) => {
                const Icon = guide.icon;
                const isExpanded = selectedGuide === guide.title;

                return (
                  <motion.div
                    key={guide.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setSelectedGuide(isExpanded ? null : guide.title)}
                      className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                            {guide.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                            {guide.content}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-4 sm:px-6 pb-4 space-y-4"
                        >
                          <p className="text-sm text-gray-600 dark:text-gray-400 sm:hidden">
                            {guide.content}
                          </p>

                          {guide.steps && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Steps:
                              </h4>
                              <ol className="space-y-2">
                                {guide.steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {step}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {guide.tips && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                              <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Tips
                              </h4>
                              <ul className="space-y-1">
                                {guide.tips.map((tip, i) => (
                                  <li key={i} className="text-xs sm:text-sm text-green-800 dark:text-green-300 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {['basics', 'lightning', 'node', 'payments', 'security'].map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {faqs
                      .filter((faq) => faq.category === category)
                      .map((faq, index) => {
                        const isExpanded = expandedFAQ === faqs.indexOf(faq);
                        const faqIndex = faqs.indexOf(faq);

                        return (
                          <motion.div
                            key={faqIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedFAQ(isExpanded ? null : faqIndex)}
                              className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-900 dark:text-white pr-2">
                                {faq.question}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="px-4 pb-3"
                                >
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {faq.answer}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Glossary Tab */}
          {activeTab === 'glossary' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {glossary.map((item, index) => (
                <motion.div
                  key={item.term}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                >
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {item.term}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {item.definition}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Additional Resources */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-purple-500" />
          Additional Resources
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: 'Lightning Network Spec', url: '#', desc: 'Technical documentation' },
            { title: 'Phoenix Documentation', url: '#', desc: 'Official Phoenix guides' },
            { title: 'Bitcoin Wiki', url: '#', desc: 'Learn about Bitcoin basics' },
            { title: 'Community Forum', url: '#', desc: 'Get help from the community' },
            { title: 'Video Tutorials', url: '#', desc: 'Visual learning resources' },
            { title: 'Lightning Apps', url: '#', desc: 'Discover Lightning services' }
          ].map((resource) => (
            <a
              key={resource.title}
              href={resource.url}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <ArrowRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {resource.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {resource.desc}
                </p>
              </div>
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default HelpCenter;