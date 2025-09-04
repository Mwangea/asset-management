/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Upload, Search, Loader2, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AssetFormData } from '../../types/asset';

interface User {
  _id: string;
  username: string;
}

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BulkUploadResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  errors: string[];
}

// Asset categories with subcategories
const ASSET_CATEGORIES = {
  'IT Equipment': {
    'Desktop': [],
    'Laptop': [],
    'Printer': [],
    'Phone': [],
    'TV': [],
    
  },
  'Electronic Appliances': {
    'Dispenser': [],
    'Microwave': [],
    'Fridge': [],
    'Other Appliances': []
  },
  'Furniture': {
    'Office Furniture': [],
    'Storage': [],
    'Seating': []
  },
  'Vehicles': {
    'Car': [],
    'Motorcycle': [],
    'Bicycle': []
  },
  'Other': {
    'General': []
  }
};

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  
  // Single asset form state
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    type: '',
    category: '',
    subcategory: '',
    location: '',
    status: 'Available',
    assignedTo: '',
    assignedToName: '',
    dateAssigned: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    warranty: '',
    assetImage: null
  });
  
  const [loading, setLoading] = useState(false);
  const [assetImagePreview, setAssetImagePreview] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Bulk upload state
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

  // Get subcategories based on selected category
  const getSubcategories = (category: string) => {
    return category && ASSET_CATEGORIES[category as keyof typeof ASSET_CATEGORIES] 
      ? Object.keys(ASSET_CATEGORIES[category as keyof typeof ASSET_CATEGORIES])
      : [];
  };

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/admin/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Reset subcategory when category changes
    if (name === 'category') {
      setFormData(prev => ({ ...prev, [name]: value, subcategory: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowUserDropdown(true);
  };

  const handleUserSelect = (user: User) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: user._id,
      assignedToName: user.username,
      status: 'In Use'
    }));
    setSearchTerm(user.username);
    setShowUserDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssetImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        toast.error('Please select a CSV or Excel file');
        return;
      }
      
      setBulkFile(file);
      setBulkResult(null);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      'Asset Name*',
      'Category*',
      'Subcategory',
      'Type*',
      'Location*',
      'Status',
      'Serial Number',
      'Purchase Date (YYYY-MM-DD)',
      'Purchase Price',
      'Warranty (months)',
      'Assigned To (Username)'
    ];
    
    const sampleData = [
      'Dell Laptop',
      'IT Equipment',
      'Laptop',
      'Laptop',
      'Office Floor 1',
      'Available',
      'DL123456',
      '2024-01-15',
      '1200',
      '36',
      ''
    ];
    
    const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.type || !formData.location || !formData.category) {
        throw new Error('Name, type, location, and category are required fields');
      }

      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'assetImage' && value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, String(value));
        }
      });
      
      if (formData.assetImage) {
        formDataToSend.append('assetImage', formData.assetImage);
      }

      const response = await api.post('/assets', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Asset added successfully');
      onSuccess();
      handleClose();
      
    } catch (error: any) {
      console.error('Error adding asset:', error);
      const errorMessage = error.response?.data?.msg 
        || error.response?.data?.errors 
        && Object.values(error.response.data.errors).join(', ')
        || error.message 
        || 'Failed to add asset';
        
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setBulkLoading(true);
    setBulkResult(null);

    try {
      const formData = new FormData();
      formData.append('file', bulkFile);

      const response = await api.post('/assets/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result: BulkUploadResult = response.data;
      setBulkResult(result);

      if (result.success) {
        toast.success(`Successfully processed ${result.processedCount} assets`);
        if (result.errorCount > 0) {
          toast.warning(`${result.errorCount} assets had errors`);
        }
        onSuccess();
      } else {
        toast.error('Bulk upload failed');
      }

    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error(error.response?.data?.msg || 'Failed to upload file');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      name: '',
      type: '',
      category: '',
      subcategory: '',
      location: '',
      status: 'Available',
      assignedTo: '',
      assignedToName: '',
      dateAssigned: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: '',
      warranty: '',
      assetImage: null
    });
    setAssetImagePreview(null);
    setSearchTerm('');
    setBulkFile(null);
    setBulkResult(null);
    setActiveTab('single');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center border-b border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold">Add Assets</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('single')}
                className={`px-4 py-2 text-sm rounded-md ${
                  activeTab === 'single' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                disabled={loading || bulkLoading}
              >
                Single Asset
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`px-4 py-2 text-sm rounded-md ${
                  activeTab === 'bulk' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                disabled={loading || bulkLoading}
              >
                Bulk Upload
              </button>
            </div>
          </div>
          <button
            title="close"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading || bulkLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category*
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    <option value="">Select Category</option>
                    {Object.keys(ASSET_CATEGORIES).map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.category && (
                  <div>
                    <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="">Select Subcategory</option>
                      {getSubcategories(formData.category).map(subcategory => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Type*
                  </label>
                  <input
                    type="text"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location*
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    id="purchaseDate"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    id="purchasePrice"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="warranty" className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty (months)
                  </label>
                  <input
                    type="number"
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status*
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || formData.assignedTo !== ''}
                  >
                    <option value="Available">Available</option>
                    <option value="Reservable">Reservable</option>
                    <option value="In Use">In Use</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                  </select>
                </div>

                <div className="relative md:col-span-2">
                  <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to User
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="userSearch"
                      value={searchTerm}
                      onChange={handleUserSearch}
                      placeholder="Search for a user..."
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  {showUserDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {loadingUsers ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => handleUserSelect(user)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                          >
                            {user.username}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-gray-500 text-center">No users found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Image
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                      <Upload className="w-5 h-5 mr-2" />
                      Choose File
                      <input
                        type="file"
                        name="assetImage"
                        onChange={handleFileChange}
                        className="sr-only"
                        accept="image/*"
                        disabled={loading}
                      />
                    </label>
                    {assetImagePreview && (
                      <div className="relative h-16 w-16">
                        <img
                          src={assetImagePreview}
                          alt="Asset preview"
                          className="h-16 w-16 object-cover rounded-md"
                        />
                        <button
                          title="remove image"
                          type="button"
                          onClick={() => {
                            setAssetImagePreview(null);
                            setFormData(prev => ({ ...prev, assetImage: null }));
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Asset'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="text-sm font-medium text-blue-800">Bulk Asset Upload</h4>
                </div>
                <p className="mt-2 text-sm text-blue-700">
                  Upload multiple assets at once using a CSV or Excel file. Download the template below to ensure proper formatting.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File (CSV, XLS, XLSX)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleBulkFileChange}
                          disabled={bulkLoading}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">CSV, XLS, XLSX up to 10MB</p>
                    {bulkFile && (
                      <p className="text-sm font-medium text-green-600">
                        Selected: {bulkFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {bulkResult && (
                <div className={`border rounded-md p-4 ${
                  bulkResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center">
                    {bulkResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <h4 className={`text-sm font-medium ${
                      bulkResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Upload Results
                    </h4>
                  </div>
                  <div className={`mt-2 text-sm ${
                    bulkResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    <p>Processed: {bulkResult.processedCount} assets</p>
                    {bulkResult.errorCount > 0 && (
                      <p>Errors: {bulkResult.errorCount} assets</p>
                    )}
                  </div>
                  {bulkResult.errors.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-red-800">Error Details:</h5>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside max-h-32 overflow-y-auto">
                        {bulkResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {bulkResult.errors.length > 10 && (
                          <li>... and {bulkResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  disabled={bulkLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={!bulkFile || bulkLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Upload Assets'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddAssetModal;