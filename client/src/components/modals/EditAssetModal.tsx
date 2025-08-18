/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Asset } from '../../types/asset';

interface User {
  _id: string;
  username: string;
}

interface AssetFormData {
  name: string;
  type: string;
  location: string;
  status: string;
  assignedTo?: string;
  assignedToName?: string;
  dateAssigned?: string;
  assetImage?: File | null;
  qrCodeImage?: null;
}

interface EditAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

const VALID_STATUSES = ['Available', 'In Use', 'Under Maintenance', 'Reservable'];

const EditAssetModal: React.FC<EditAssetModalProps> = ({ isOpen, onClose, onSuccess, asset }) => {
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    type: '',
    location: '',
    status: 'Available',
    assignedTo: '',
    assignedToName: '',
    dateAssigned: '',
    assetImage: null,
    qrCodeImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assetImagePreview, setAssetImagePreview] = useState<string | null>(null);

  // Helper function to construct image URLs
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    const baseUrl = api.defaults.baseURL?.endsWith('/api')
      ? api.defaults.baseURL.slice(0, -4)
      : api.defaults.baseURL?.replace('/api', '') || '';

    return `${baseUrl}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
  };

  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Initialize form data when asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        type: asset.type,
        location: asset.location,
        status: asset.status,
        assignedTo: asset.assignedTo || '',
        assignedToName: asset.assignedToName || '',
        dateAssigned: asset.dateAssigned ? new Date(asset.dateAssigned).toISOString().split('T')[0] : '',
        assetImage: null,
        qrCodeImage: null,
      });

      if (asset.assetImage) {
        setAssetImagePreview(getImageUrl(asset.assetImage));
      } else {
        setAssetImagePreview(null);
      }
    }
  }, [asset]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'assignedTo') {
      const selectedUser = users.find(user => user._id === value);
      setFormData(prev => ({
        ...prev,
        assignedTo: value,
        assignedToName: selectedUser ? selectedUser.username : '',
        // Only set status to "In Use" if a user is being assigned
        status: value ? 'In Use' : prev.status,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({ ...prev, assetImage: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setAssetImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('status', formData.status);

      // Only append assignedTo if it has a value
      if (formData.assignedTo) {
        formDataToSend.append('assignedTo', formData.assignedTo);
      }

      // Append file only if a new file was selected
      if (formData.assetImage instanceof File) {
        formDataToSend.append('assetImage', formData.assetImage);
      }

      await api.put(`/assets/${asset._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Asset updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating asset:', error);
      toast.error(error.response?.data?.msg || 'Failed to update asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center border-b border-gray-200 px-6 py-4 bg-white">
          <h3 className="text-xl font-semibold">Edit Asset</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
            title="Close modal"
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
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || loadingUsers}
              >
                <option value="">Not Assigned</option>
                {loadingUsers ? (
                  <option disabled>Loading users...</option>
                ) : (
                  users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))
                )}
              </select>
              {formData.assignedToName && (
                <p className="mt-1 text-sm text-gray-500">
                  Currently assigned to: {formData.assignedToName}
                </p>
              )}
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
                disabled={loading}
              >
                {VALID_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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
                      type="button"
                      onClick={() => {
                        setAssetImagePreview(null);
                        setFormData(prev => ({ ...prev, assetImage: null }));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                      disabled={loading}
                      title="Remove image"
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
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssetModal;