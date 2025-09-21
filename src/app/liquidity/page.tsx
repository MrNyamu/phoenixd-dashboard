export default function LiquidityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Liquidity Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor and optimize your Lightning Network liquidity
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Advanced Liquidity Analytics
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Real-time liquidity tracking, channel management, and optimization tools.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg">
            <span className="text-sm font-medium">Coming soon - Full liquidity dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}