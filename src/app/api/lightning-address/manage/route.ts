import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { LightningAddress, LightningAddressConfig } from '@/types/lightning-address';

const DATA_DIR = join(process.cwd(), 'data');
const ADDRESSES_FILE = join(DATA_DIR, 'lightning-addresses.json');
const CONFIG_FILE = join(DATA_DIR, 'lightning-address-config.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadAddresses(): LightningAddress[] {
  try {
    if (!existsSync(ADDRESSES_FILE)) {
      return [];
    }
    const data = readFileSync(ADDRESSES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading Lightning Addresses:', error);
    return [];
  }
}

function saveAddresses(addresses: LightningAddress[]): void {
  try {
    writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
  } catch (error) {
    console.error('Error saving Lightning Addresses:', error);
    throw new Error('Failed to save Lightning Addresses');
  }
}

function loadConfig(): LightningAddressConfig {
  try {
    if (!existsSync(CONFIG_FILE)) {
      const defaultConfig: LightningAddressConfig = {
        domain: 'localhost:3000',
        enabled: true,
        defaultMinSendable: 1, // 1 sat
        defaultMaxSendable: 100000, // 100k sats
        allowComments: true,
        maxCommentLength: 144
      };
      saveConfig(defaultConfig);
      return defaultConfig;
    }
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading Lightning Address config:', error);
    return {
      domain: 'localhost:3000',
      enabled: true,
      defaultMinSendable: 1,
      defaultMaxSendable: 100000,
      allowComments: true,
      maxCommentLength: 144
    };
  }
}

function saveConfig(config: LightningAddressConfig): void {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving Lightning Address config:', error);
    throw new Error('Failed to save Lightning Address config');
  }
}

// GET - List all Lightning Addresses
export async function GET(request: NextRequest) {
  try {
    const addresses = loadAddresses();
    const config = loadConfig();

    return NextResponse.json({
      success: true,
      data: {
        addresses,
        config
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new Lightning Address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, description, avatar, minSendable, maxSendable } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    const addresses = loadAddresses();
    const config = loadConfig();

    // Check if username already exists
    if (addresses.find(addr => addr.username === username)) {
      return NextResponse.json(
        { success: false, error: 'Username already exists' },
        { status: 400 }
      );
    }

    const newAddress: LightningAddress = {
      address: `${username}@${config.domain}`,
      username,
      domain: config.domain,
      metadata: {
        description: description || `Lightning Address for ${username}`,
        avatar,
        minSendable: (minSendable || config.defaultMinSendable) * 1000, // Convert to millisats
        maxSendable: (maxSendable || config.defaultMaxSendable) * 1000, // Convert to millisats
        allowsNostr: false,
        callback: `${request.nextUrl.protocol}//${request.nextUrl.host}/api/lightning-address/callback`,
        metadata: JSON.stringify([
          ['text/plain', `Payment to ${username}@${config.domain}`],
          ['text/long-desc', description || `Lightning payment to ${username}`]
        ])
      },
      enabled: true,
      createdAt: Date.now()
    };

    addresses.push(newAddress);
    saveAddresses(addresses);

    return NextResponse.json({
      success: true,
      data: newAddress
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update Lightning Address or config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'config') {
      const currentConfig = loadConfig();
      const updatedConfig = { ...currentConfig, ...data };
      saveConfig(updatedConfig);

      return NextResponse.json({
        success: true,
        data: updatedConfig
      });
    } else if (type === 'address') {
      const { address, ...updates } = data;
      const addresses = loadAddresses();
      const index = addresses.findIndex(addr => addr.address === address);

      if (index === -1) {
        return NextResponse.json(
          { success: false, error: 'Lightning Address not found' },
          { status: 404 }
        );
      }

      addresses[index] = { ...addresses[index], ...updates };
      if (updates.lastUsed !== undefined) {
        addresses[index].lastUsed = Date.now();
      }

      saveAddresses(addresses);

      return NextResponse.json({
        success: true,
        data: addresses[index]
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid update type' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove Lightning Address
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const addresses = loadAddresses();
    const filteredAddresses = addresses.filter(addr => addr.address !== address);

    if (filteredAddresses.length === addresses.length) {
      return NextResponse.json(
        { success: false, error: 'Lightning Address not found' },
        { status: 404 }
      );
    }

    saveAddresses(filteredAddresses);

    return NextResponse.json({
      success: true,
      message: 'Lightning Address deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}