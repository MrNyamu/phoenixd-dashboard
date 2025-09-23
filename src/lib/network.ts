/**
 * Network configuration and utilities for PhoenixD
 */

export type BitcoinNetwork = 'mainnet' | 'testnet' | 'regtest';

export interface NetworkConfig {
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  chainHash: string;
  explorerUrl: string;
  faucetUrl?: string;
  isProduction: boolean;
}

export const NETWORK_CONFIGS: Record<BitcoinNetwork, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    displayName: 'Bitcoin Mainnet',
    color: 'text-orange-600 dark:text-orange-400',
    backgroundColor: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    chainHash: '6fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000',
    explorerUrl: 'https://mempool.space',
    isProduction: true,
  },
  testnet: {
    name: 'testnet',
    displayName: 'Bitcoin Testnet',
    color: 'text-green-600 dark:text-green-400',
    backgroundColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    chainHash: '43497fd7f826957108f4a30fd9cec3aeba79972084e90ead01ea330900000000',
    explorerUrl: 'https://mempool.space/testnet',
    faucetUrl: 'https://bitcoinfaucet.uo1.net/',
    isProduction: false,
  },
  regtest: {
    name: 'regtest',
    displayName: 'Bitcoin Regtest',
    color: 'text-blue-600 dark:text-blue-400',
    backgroundColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    chainHash: '0f9188f13cb7b2c71f2a335e3a4fc328bf5beb436012afca590b1a11466e2206',
    explorerUrl: 'http://localhost:8080', // Local regtest explorer
    isProduction: false,
  },
};

/**
 * Get current network from environment variable
 */
export function getCurrentNetwork(): BitcoinNetwork {
  const network = process.env.NEXT_PUBLIC_PHOENIX_NETWORK as BitcoinNetwork;

  if (network && network in NETWORK_CONFIGS) {
    return network;
  }

  // Default to testnet for safety
  return 'testnet';
}

/**
 * Get network configuration for current network
 */
export function getCurrentNetworkConfig(): NetworkConfig {
  return NETWORK_CONFIGS[getCurrentNetwork()];
}

/**
 * Get network from chain hash
 */
export function getNetworkFromChainHash(chainHash: string): BitcoinNetwork | null {
  for (const [network, config] of Object.entries(NETWORK_CONFIGS)) {
    if (config.chainHash === chainHash) {
      return network as BitcoinNetwork;
    }
  }
  return null;
}

/**
 * Check if current network is production (mainnet)
 */
export function isProductionNetwork(): boolean {
  return getCurrentNetworkConfig().isProduction;
}

/**
 * Get explorer URL for transaction/address
 */
export function getExplorerUrl(type: 'tx' | 'address' | 'block', identifier: string): string {
  const config = getCurrentNetworkConfig();
  switch (type) {
    case 'tx':
      return `${config.explorerUrl}/tx/${identifier}`;
    case 'address':
      return `${config.explorerUrl}/address/${identifier}`;
    case 'block':
      return `${config.explorerUrl}/block/${identifier}`;
    default:
      return config.explorerUrl;
  }
}

/**
 * Format network name for display
 */
export function formatNetworkName(network?: BitcoinNetwork): string {
  if (!network) {
    network = getCurrentNetwork();
  }
  return NETWORK_CONFIGS[network].displayName;
}

/**
 * Get network-specific CSS classes
 */
export function getNetworkClasses(network?: BitcoinNetwork) {
  if (!network) {
    network = getCurrentNetwork();
  }
  const config = NETWORK_CONFIGS[network];
  return {
    text: config.color,
    background: config.backgroundColor,
    network: network,
    isProduction: config.isProduction,
  };
}