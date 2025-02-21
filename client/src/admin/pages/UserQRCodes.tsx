/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Search, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

interface Asset {
  _id: string;
  name: string;
  location: string;
  qrCodeImage?: string;
}

interface User {
  _id: string;
  username: string;
  role: string;
  assignedAssets?: Asset[];
}

const UserQRCodes: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDownloadOptions, setShowDownloadOptions] = useState<string | null>(null);
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDownloadOptions && !target.closest('.download-options')) {
        setShowDownloadOptions(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDownloadOptions]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users-with-assets');
      setUsers(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMimeType = (format: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf'
    };
    return mimeTypes[format] || 'application/octet-stream';
  };

  const downloadQRCode = async (assetId: string, assetName: string, format: string = 'png') => {
    try {
      const response = await api.get(`/admin/assets/${assetId}/qr-code`, {
        params: { format },
        responseType: 'blob',
        headers: { 'Accept': getMimeType(format) }
      });
  
      if (response.data.size === 0) {
        throw new Error('Empty file received. The QR code might not have been generated.');
      }
  
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes(getMimeType(format))) {
        const text = await response.data.text();
        throw new Error(`Unexpected content type: ${contentType}, Response: ${text}`);
      }
  
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assetName.replace(/[^a-zA-Z0-9-_]/g, '_')}-QRCode.${format}`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (error: any) {
      console.error('Error downloading QR code:', error);
      alert(error.message || 'Failed to download QR code.');
    }
  };
  

  const printQRCode = async (assetId: string, assetName: string) => {
    try {
      const response = await api.get(`/admin/assets/${assetId}/qr-code`, {
        responseType: 'blob',
        headers: {
          'Accept': 'image/png'
        }
      });
      
      const contentType = response.headers['content-type'];
      
      if (contentType?.includes('application/json')) {
        const errorText = await new Response(response.data).text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || errorData.msg || 'Failed to load QR code for printing');
        } catch (parseError) {
          throw new Error('Failed to load QR code: Invalid server response');
        }
      }

      const imageUrl = URL.createObjectURL(new Blob([response.data], { type: 'image/png' }));
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Failed to open print window. Please check your popup blocker settings.');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${assetName} QR Code</title>
            <style>
              body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
              }
              .container { 
                text-align: center; 
                padding: 20px;
              }
              img { 
                max-width: 300px; 
                height: auto;
              }
              h2 { 
                font-family: Arial, sans-serif; 
                margin-bottom: 20px;
              }
              .asset-info { 
                margin-top: 20px; 
                font-family: Arial, sans-serif; 
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${assetName}</h2>
              <img src="${imageUrl}" alt="${assetName} QR Code">
              <div class="asset-info">
                <p>Generated: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => {
                  URL.revokeObjectURL('${imageUrl}');
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error: any) {
      console.error('Error printing QR code:', error);
      alert(error.message || 'Failed to print QR code. Please try again.');
    }
  };

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

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const DownloadOptions = ({ asset }: { asset: Asset }) => (
    <div 
      className="download-options absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-20"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {[
          { format: 'png', label: 'PNG', desc: 'High quality image' },
          { format: 'jpg', label: 'JPG', desc: 'Compressed image' },
          { format: 'svg', label: 'SVG', desc: 'Vector image' },
          { format: 'pdf', label: 'PDF', desc: 'Document format' }
        ].map(({ format, label, desc }) => (
          <button
            key={format}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              downloadQRCode(asset._id, asset.name, format);
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex flex-col"
          >
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-xs text-gray-500">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-white to-blue-50">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User QR Codes</h1>
        <p className="mt-2 text-gray-600">Manage and print QR codes for user-assigned assets</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by username..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading users and their assets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button 
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Assets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Codes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user: User) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {user.assignedAssets?.length ? (
                              <ul className="list-disc list-inside">
                                {user.assignedAssets.map((asset: Asset) => (
                                  <li key={asset._id}>{asset.name} - {asset.location}</li>
                                ))}
                              </ul>
                            ) : (
                              'No assets assigned'
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            {user.assignedAssets?.map((asset: Asset) => (
                              <div key={asset._id} className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg">
                                <img
                                  src={getImageUrl(asset.qrCodeImage)}
                                  alt={`${asset.name} QR Code`}
                                  className="h-12 w-12 object-contain"
                                />
                                <span className="text-sm text-gray-700">{asset.name}</span>
                                <div className="flex space-x-2 ml-auto">
                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowDownloadOptions(showDownloadOptions === asset._id ? null : asset._id);
                                      }}
                                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded flex items-center gap-1"
                                    >
                                      <Download className="w-5 h-5" />
                                      <span className="text-sm">Download</span>
                                    </button>
                                    {showDownloadOptions === asset._id && <DownloadOptions asset={asset} />}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      printQRCode(asset._id, asset.name);
                                    }}
                                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded flex items-center gap-1"
                                  >
                                    <Printer className="w-5 h-5" />
                                    <span className="text-sm">Print</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredUsers.length}</span> users
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                title='left'
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(prev => Math.max(1, prev - 1));
                  }}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                title='current'
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserQRCodes;