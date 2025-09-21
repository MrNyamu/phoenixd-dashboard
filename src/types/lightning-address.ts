// Lightning Address and LNURL-pay types
export interface LightningAddress {
  address: string; // user@domain.com format
  username: string;
  domain: string;
  metadata: LightningAddressMetadata;
  enabled: boolean;
  createdAt: number;
  lastUsed?: number;
}

export interface LightningAddressMetadata {
  description: string;
  avatar?: string;
  minSendable: number; // millisats
  maxSendable: number; // millisats
  allowsNostr: boolean;
  nostrPubkey?: string;
  callback: string;
  metadata: string; // JSON stringified metadata
}

export interface LNURLPayRequest {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  tag: 'payRequest';
  allowsNostr?: boolean;
  nostrPubkey?: string;
}

export interface LNURLPayCallback {
  amount: number; // millisats
  nostr?: string;
  comment?: string;
}

export interface LNURLPayResponse {
  status: 'OK' | 'ERROR';
  pr?: string; // Lightning invoice
  successAction?: {
    tag: 'message' | 'url' | 'aes';
    message?: string;
    url?: string;
    description?: string;
  };
  reason?: string; // Error reason if status is ERROR
}

export interface WellKnownResponse {
  names: Record<string, string>; // username -> pubkey mapping
}

export interface SendToAddressRequest {
  address: string;
  amount: number; // sats
  comment?: string;
}

export interface AddressPaymentHistory {
  id: string;
  address: string;
  amount: number; // sats
  comment?: string;
  timestamp: number;
  invoice: string;
  paid: boolean;
  paymentHash?: string;
}

export interface LightningAddressConfig {
  domain: string;
  enabled: boolean;
  defaultMinSendable: number; // sats
  defaultMaxSendable: number; // sats
  allowComments: boolean;
  maxCommentLength: number;
}