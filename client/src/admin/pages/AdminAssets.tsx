import { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Plus, Edit, Trash2, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
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
        return 'bg-purple-100 text-purple-800';
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

// Export functionality component
const ExportDropdown = ({ assets, isOpen, onToggle }: { assets: Asset[], isOpen: boolean, onToggle: () => void }) => {
  const exportToCSV = () => {
    const headers = ['Name', 'Type', 'Location', 'Status', 'Assigned To', 'Date Assigned'];
    
    const csvData = assets.map(asset => [
      asset.name,
      asset.type,
      asset.location,
      asset.status,
      asset.assignedToName || 'Not Assigned',
      asset.dateAssigned ? new Date(asset.dateAssigned).toLocaleDateString() : 'Not Assigned'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assets_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToggle();
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');
      
      const worksheetData = assets.map(asset => ({
        'Asset Name': asset.name,
        'Type': asset.type,
        'Location': asset.location,
        'Status': asset.status,
        'Assigned To': asset.assignedToName || 'Not Assigned',
        'Date Assigned': asset.dateAssigned ? new Date(asset.dateAssigned).toLocaleDateString() : 'Not Assigned'
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');

      // Auto-size columns
      const columnWidths = [
        { wch: 20 }, // Asset Name
        { wch: 15 }, // Type
        { wch: 20 }, // Location
        { wch: 15 }, // Status
        { wch: 15 }, // Assigned To
        { wch: 15 }  // Date Assigned
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.writeFile(workbook, `assets_${new Date().toISOString().split('T')[0]}.xlsx`);
      onToggle();
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    }
  };

  const exportToPDF = async () => {
    try {
      // Dynamically import jsPDF and autoTable
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Asset Report', 14, 22);
      
      // Add generation date
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      
      // Prepare table data
      const tableData = assets.map(asset => [
        asset.name,
        asset.type,
        asset.location,
        asset.status,
        asset.assignedToName || 'Not Assigned',
        asset.dateAssigned ? new Date(asset.dateAssigned).toLocaleDateString() : 'Not Assigned'
      ]);

      // Add table using autoTable
      autoTable(doc, {
        head: [['Asset Name', 'Type', 'Location', 'Status', 'Assigned To', 'Date Assigned']],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue color
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Light gray
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Asset Name
          1: { cellWidth: 25 }, // Type
          2: { cellWidth: 30 }, // Location
          3: { cellWidth: 25 }, // Status
          4: { cellWidth: 25 }, // Assigned To
          5: { cellWidth: 25 }  // Date Assigned
        }
      });

      // Get the final Y position from the table
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Add summary
      doc.setFontSize(12);
      doc.text(`Total Assets: ${assets.length}`, 14, finalY);
      
      // Count by status
      const statusCounts = assets.reduce((acc, asset) => {
        acc[asset.status] = (acc[asset.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let summaryY = finalY + 10;
      doc.text('Status Summary:', 14, summaryY);
      Object.entries(statusCounts).forEach(([status, count]) => {
        summaryY += 8;
        doc.setFontSize(10);
        doc.text(`${status}: ${count}`, 20, summaryY);
      });

      doc.save(`assets_${new Date().toISOString().split('T')[0]}.pdf`);
      onToggle();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
      <div className="py-1">
        <button
          onClick={exportToCSV}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <FileText className="w-4 h-4 mr-3" />
          Export as CSV
        </button>
        <button
          onClick={exportToExcel}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <FileSpreadsheet className="w-4 h-4 mr-3" />
          Export as Excel
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <File className="w-4 h-4 mr-3" />
          Export as PDF
        </button>
      </div>
    </div>
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
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
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
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700"
            >
              <Download className="w-5 h-5 mr-2" />
              Export
            </button>
            <ExportDropdown
              assets={filteredAssets}
              isOpen={isExportDropdownOpen}
              onToggle={() => setIsExportDropdownOpen(false)}
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Asset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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