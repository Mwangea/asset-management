import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScannerState } from 'html5-qrcode';
import { QrCode, PackageSearch, AlertCircle, X } from 'lucide-react';
import api from '../api/axios';
import { Asset } from '../types/asset';


const QRScanner = () => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAsset = async (qrCode: string) => {
    try {
      setLoading(true);
      setError('');
      
      const qrCodeImage = qrCode.split('/').pop();
      
      const response = await api.get(`/assets/qr/${qrCodeImage}`);
      const data = await response.data;
      
      setAsset(data);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAsset(null);
      
      // Resume scanning after error
      if (scannerRef.current) {
        try {
          await scannerRef.current.resume();
        } catch (error) {
          console.warn('Could not resume scanner:', error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Only try to pause if currently scanning
      if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
        await scannerRef.current.pause(true);
      }
      await fetchAsset(decodedText);
    } catch (error) {
      console.error('Error handling scan:', error);
      setError('Failed to process scan');
    }
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setAsset(null);
    setError('');
    
    // Resume scanning only if scanner exists and is paused
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.PAUSED) {
          await scannerRef.current.resume();
        }
      } catch (error) {
        console.warn('Could not resume scanner:', error);
      }
    }
  };

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current.render(handleScanSuccess, (error: string | Error) => {
      console.warn(error);
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <QrCode className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scan Asset QR Code
          </h1>
          <p className="text-gray-600">
            Position the QR code within the scanner to view asset details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">
              {error === 'Asset not found' 
                ? 'Item Not Available: The scanned QR code is not associated with any asset.'
                : `Error: ${error}`}
            </p>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading asset details...</p>
            </div>
          ) : (
            <div id="qr-reader" className="mx-auto"></div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Asset Details</h2>
                </div>
                <button 
                title='close'
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {asset && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-lg font-semibold">{asset.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Type</p>
                      <p className="text-lg">{asset.type}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p className="text-lg">{asset.status}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-lg">{asset.location}</p>
                    </div>
                  </div>
                  
                  {asset.assignedTo && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assigned To</p>
                      <p className="text-lg">{asset.assignedToName}</p>
                    </div>
                  )}
                  
                  {asset.assetImage && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Asset Image</p>
                      <img 
                        src={`/${asset.assetImage}`} 
                        alt={asset.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;