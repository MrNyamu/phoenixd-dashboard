'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getPhoenixAPI } from '@/lib/phoenix-api';

interface WebSocketStatusProps {
  isConnected: boolean;
  className?: string;
}

export default function WebSocketStatus({ isConnected, className = '' }: WebSocketStatusProps) {
  const [testing, setTesting] = useState(false);
  const [wsWorking, setWsWorking] = useState<boolean | null>(null);

  const testWebSocket = async () => {
    if (!isConnected) return;

    setTesting(true);
    try {
      const api = getPhoenixAPI();
      const result = await api.testWebSocketConnection();
      setWsWorking(result);
    } catch (error) {
      console.error('WebSocket test failed:', error);
      setWsWorking(false);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      // Test WebSocket connection when component mounts
      testWebSocket();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <WifiOff className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-400">Offline</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {testing ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw className="w-4 h-4 text-yellow-500" />
          </motion.div>
          <span className="text-xs text-yellow-500">Testing...</span>
        </>
      ) : wsWorking === true ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-500">WebSocket OK</span>
        </>
      ) : wsWorking === false ? (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-500">WebSocket Failed</span>
          <button
            onClick={testWebSocket}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400">Unknown</span>
        </>
      )}
    </div>
  );
}