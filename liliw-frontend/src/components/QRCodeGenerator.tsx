'use client';

import { useState } from 'react';
import { Download, Copy, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRCodeGeneratorProps {
  itemId: string;
  itemName: string;
  itemType?: 'attraction' | 'event' | 'tour';
}

export default function QRCodeGenerator({
  itemId,
  itemName,
  itemType = 'attraction',
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Build the URL to encode
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:3000';
  const itemUrl = `${baseUrl}/attractions/${itemId}`;

  // QR Code API endpoint (using qr-server.com free service)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(itemUrl)}`;

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${itemName.replace(/\s+/g, '-')}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('QR Code download error:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(itemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {/* QR Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition"
        style={{ backgroundColor: '#00BFB3' }}
      >
        <QrCode size={18} />
        QR Code
      </motion.button>

      {/* QR Modal */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-full right-0 mt-2 p-6 bg-white rounded-lg shadow-2xl z-50 w-72 border border-gray-200"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h3 className="font-bold mb-3" style={{ color: '#0F1F3C' }}>
            Share {itemName}
          </h3>

          {/* QR Code Image */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4 flex items-center justify-center">
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${itemName}`}
              className="w-48 h-48"
            />
          </div>

          {/* URL Display */}
          <div className="mb-4 p-3 bg-gray-50 rounded text-xs text-gray-700 break-all border border-gray-200">
            {itemUrl}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={downloadQRCode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold text-sm"
            >
              <Download size={16} />
              Download QR Code
            </button>
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
            >
              <Copy size={16} />
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Usage Info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            Scan this QR code to visit the page
          </p>
        </motion.div>
      )}
    </div>
  );
}
