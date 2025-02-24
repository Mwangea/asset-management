/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, PackageSearch, AlertCircle, X, Play, Pause } from 'lucide-react';
import api from '../api/axios';
import { Asset } from '../types/asset';

const QRScanner = () => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  const fetchAsset = async (assetId: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch asset details
      const response = await api.get(`/assets/${assetId}`);
      const assetData = response.data;
      
      // Record scan activity
      await api.post('/assets/scan', {
        assetId,
        scanLocation: window.location.href
      });
      
      setAsset(assetData);
      setIsModalOpen(true);
      
      // Provide haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAsset(null);
      
      // Resume scanning after error
      if (scannerRef.current) {
        startScanning();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Stop scanning temporarily
      if (scannerRef.current) {
        await stopScanning();
      }

      // For QR codes containing just the ID
      if (decodedText.match(/^[0-9a-fA-F]{24}$/)) {
        await fetchAsset(decodedText);
        return;
      }

      // For QR codes containing JSON data
      try {
        const qrData = JSON.parse(decodedText);
        if (qrData.id) {
          await fetchAsset(qrData.id);
        } else {
          throw new Error('Invalid QR code: missing asset ID');
        }
      } catch (e) {
        await fetchAsset(decodedText);
      }
    } catch (error) {
      console.error('Error handling scan:', error);
      setError(error instanceof Error ? error.message : 'Failed to process scan');
      startScanning(); // Restart scanning on error
    }
  };

  const startScanning = async () => {
    if (!scannerRef.current) return;
    
    try {
      await scannerRef.current.render(handleScanSuccess, (error: string | Error) => {
        console.warn(error);
      });
      setIsScanning(true);
    } catch (error) {
      console.error('Error starting scanner:', error);
    }
  };

  const stopScanning = async () => {
    if (!scannerRef.current) return;
    
    try {
      await scannerRef.current.clear();
      setIsScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
    }
  };

  const toggleScanning = async () => {
    if (isScanning) {
      await stopScanning();
    } else {
      await startScanning();
    }
  };

  const handleCloseModal = async () => {
    setIsModalOpen(false);
    setAsset(null);
    setError('');
    
    if (!isScanning) {
      await startScanning();
    }
  };

  // Get correct image URL
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/KMA LOGO.png';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = api.defaults.baseURL || '';
    const cleanBaseUrl = baseUrl.endsWith('/api') 
      ? baseUrl.slice(0, -4) 
      : baseUrl;
    
    return `${cleanBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    // Initialize scanner
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        videoConstraints: {
          facingMode: { ideal: "environment" }
        }
      },
      false
    );

    // Start scanning initially
    startScanning();

    // Cleanup
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
          <p className="text-gray-600 mb-4">
            Position the QR code within the scanner to view asset details
          </p>
          <button
            onClick={toggleScanning}
            className={`flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg ${
              isScanning 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {isScanning ? (
              <>
                <Pause className="w-4 h-4" />
                Stop Scanning
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Scanning
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
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

        {/* Asset Details Modal */}
        {isModalOpen && asset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageSearch className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Asset Details</h2>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
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
                  <p className="text-lg text-blue-600 font-medium">{asset.status}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-lg">{asset.location}</p>
                </div>
                
                {asset.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assigned To</p>
                    <p className="text-lg">{asset.assignedToName}</p>
                  </div>
                )}
                
                <div>
  <p className="text-sm font-medium text-gray-500">Last Updated</p>
  <p className="text-lg">
    {asset.lastUpdated ? new Date(asset.lastUpdated).toLocaleDateString() : 'N/A'}
  </p>
</div>
                
                {asset.assetImage && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Asset Image</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={getImageUrl(asset.assetImage)}
                      alt={asset.name}
                      className="w-full h-40 object-contain"
                      onError={(e) => {
                        const imgElement = e.target as HTMLImageElement;
                        imgElement.src = '/placeholder-asset.png';
                      }}
                    />
                    </div>
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;