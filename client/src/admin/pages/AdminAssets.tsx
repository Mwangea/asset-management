import { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Asset } from '../../types/asset';
import api from '../../api/axios';
import AddAssetModal from '../../components/modals/AddAssetModal';
import EditAssetModal from '../../components/modals/EditAssetModal';
import DeleteAssetModal from '../../components/modals/DeleteAssetModal';


const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in use':
        return 'bg-blue-100 text-blue-800';
      case 'reservable':
        return 'bg-purple-100 text-purple-100'
      case 'under maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'available':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={clsx(
      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
      getStatusColor(status)
    )}>
      {status}
    </span>
  );
};

export default function AdminAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const assetsPerPage = 10;

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/assets');
      setAssets(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load assets');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsViewModalOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };

  const handleDeleteAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeleteModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAsset(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAsset(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedAsset(null);
  };

  const onSuccessCallback = () => {
    fetchAssets();
  };

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.assignedToName && asset.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const indexOfLastAsset = currentPage * assetsPerPage;
  const indexOfFirstAsset = indexOfLastAsset - assetsPerPage;
  const currentAssets = filteredAssets.slice(indexOfFirstAsset, indexOfLastAsset);
  const totalPages = Math.ceil(filteredAssets.length / assetsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not assigned';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to construct image URLs correctly
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/KMA LOGO.png';
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    const baseUrl = api.defaults.baseURL?.endsWith('/api') 
      ? api.defaults.baseURL.slice(0, -4) 
      : api.defaults.baseURL?.replace('/api', '') || '';
    
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${baseUrl}${normalizedPath}`;
  };

  return (
    <div className="bg-gradient-to-b from-white to-blue-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center hover:bg-ocean-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Asset
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading assets...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No assets found
                      </td>
                    </tr>
                  ) : (
                    currentAssets.map((asset) => (
                      <tr key={asset._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={getImageUrl(asset.assetImage)}
                                alt={asset.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder-asset.png';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={asset.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.assignedToName || 'Not Assigned'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              title="view single"
                              onClick={() => handleViewAsset(asset)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              title='edit'
                              onClick={() => handleEditAsset(asset)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              title='trash'
                              onClick={() => handleDeleteAsset(asset)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstAsset + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastAsset, filteredAssets.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredAssets.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      title='previous'
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        className={clsx(
                          'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                          currentPage === index + 1
                            ? 'z-10 bg-ocean-50 border-ocean-500 text-ocean-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        )}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      title='next'
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Asset View Modal */}
      {isViewModalOpen && selectedAsset && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative bg-white rounded-lg w-full max-w-lg mx-4 my-6 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex justify-between items-center border-b border-gray-200 px-6 py-4 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">Asset Details</h3>
              <button
                title="close modal"
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">Asset Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <p className="text-gray-600">{selectedAsset.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <p className="text-gray-600">{selectedAsset.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <p className="text-gray-600">{selectedAsset.location}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <StatusBadge status={selectedAsset.status} />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Assigned To:</span>
                      <p className="text-gray-600">{selectedAsset.assignedToName || 'Not Assigned'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Date Assigned:</span>
                      <p className="text-gray-600">{formatDate(selectedAsset.dateAssigned)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Images</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Asset Image</p>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(selectedAsset.assetImage)}
                          alt={`${selectedAsset.name} asset`}
                          className="w-full h-40 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-asset.png';
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 mb-2">QR Code</p>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={getImageUrl(selectedAsset.qrCodeImage)}
                          alt={`${selectedAsset.name} QR code`}
                          className="w-full h-40 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-qr.png';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-gray-200 px-6 py-4 bg-white">
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      closeViewModal();
                      handleEditAsset(selectedAsset);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      closeViewModal();
                      handleDeleteAsset(selectedAsset);
                    }}
                    className="px-4 py-2 border border-gray-300 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSuccess={onSuccessCallback}
      />

      {/* Edit Asset Modal */}
      <EditAssetModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSuccess={onSuccessCallback}
        asset={selectedAsset}
      />

      {/* Delete Asset Modal */}
      <DeleteAssetModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onSuccess={onSuccessCallback}
        asset={selectedAsset}
      />
    </div>
  );
}