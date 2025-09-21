'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Maximize2, X } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  description?: string;
  showActions?: boolean;
}

export default function QRCodeDisplay({
  value,
  size = 256,
  title,
  description,
  showActions = true
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }, (error) => {
        if (error) {
          setError('Failed to generate QR code');
          console.error('QR Code generation error:', error);
        } else {
          setError(null);
        }
      });
    }
  }, [value, size]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(null), 3000);
    }
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'lightning-invoice-qr.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  if (!value) {
    return null;
  }

  return (
    <>
      {/* Regular QR Code Display */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {title && (
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white rounded-lg border-2 border-gray-100">
            <canvas
              ref={canvasRef}
              className="block"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center">
              {success}
            </div>
          )}

          {/* Action Buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Invoice
              </button>
              <button
                onClick={downloadQRCode}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg p-8 max-w-2xl w-full max-h-full overflow-auto">
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              {title && (
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {title}
                </h2>
              )}

              <div className="mb-6">
                <canvas
                  ref={canvasRef}
                  className="block mx-auto border-2 border-gray-100 rounded-lg"
                  style={{ transform: 'scale(1.5)' }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Copy className="w-5 h-5" />
                    Copy Invoice
                  </button>
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download QR Code
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Lightning Invoice:</p>
                  <code className="text-xs font-mono bg-white p-2 rounded border block break-all">
                    {value}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}