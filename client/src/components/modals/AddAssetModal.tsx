/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Upload, Search, Loader2 } from 'lucide-react';
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

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    type: '',
    location: '',
    status: 'Available',
    assignedTo: '',
    assignedToName: '',
    dateAssigned: '',
    assetImage: null
  });
  
  const [loading, setLoading] = useState(false);
  const [assetImagePreview, setAssetImagePreview] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

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
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      if (!formData.name || !formData.type || !formData.location) {
        throw new Error('Name, type, and location are required fields');
      }
  
      const formDataToSend = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'assetImage' && value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, String(value));
          // Log each field as it's added to FormData
          console.log(`Adding to FormData: ${key} = ${value}`);
        }
      });
      
      if (formData.assetImage) {
        formDataToSend.append('assetImage', formData.assetImage);
        console.log('Adding image to FormData:', formData.assetImage.name);
      }
  
      const response = await api.post('/assets', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      // Log successful response
      console.log('Success response:', response.data);
  
      toast.success('Asset added successfully');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        location: '',
        status: 'Available',
        assignedTo: '',
        assignedToName: '',
        dateAssigned: '',
        assetImage: null
      });
      setAssetImagePreview(null);
      setSearchTerm('');
      
    } catch (error: any) {
      // Enhanced error logging
      console.error('Detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        validationErrors: error.response?.data?.errors
      });
      
      // More specific error message
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center border-b border-gray-200 px-6 py-4 bg-white">
          <h3 className="text-xl font-semibold">Add New Asset</h3>
          <button
            title="close"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
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

            <div className="relative">
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

            <div>
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
              onClick={onClose}
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
      </div>
    </div>
  );
};

export default AddAssetModal;