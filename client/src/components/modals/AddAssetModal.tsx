/* eslint-disable @typescript-eslint/no-explicit-any */
// components/modals/AddAssetModal.tsx
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { AssetFormData } from '../../types/asset';

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
    status: 'available',
    assignedToName: '',
    dateAssigned: '',
    assetImage: null,
    qrCodeImage: null
  });
  const [loading, setLoading] = useState(false);
  const [assetImagePreview, setAssetImagePreview] = useState<string | null>(null);
  const [qrCodeImagePreview, setQrCodeImagePreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        if (name === 'assetImage') {
          setAssetImagePreview(reader.result as string);
        } else if (name === 'qrCodeImage') {
          setQrCodeImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Append text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'assetImage' && key !== 'qrCodeImage' && value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });
      
      // Append file fields
      if (formData.assetImage) {
        formDataToSend.append('assetImage', formData.assetImage);
      }
      if (formData.qrCodeImage) {
        formDataToSend.append('qrCodeImage', formData.qrCodeImage);
      }

      await api.post('/assets', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Asset added successfully');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        type: '',
        location: '',
        status: 'available',
        assignedToName: '',
        dateAssigned: '',
        assetImage: null,
        qrCodeImage: null
      });
      setAssetImagePreview(null);
      setQrCodeImagePreview(null);
      
    } catch (error: any) {
      console.error('Error adding asset:', error);
      toast.error(error.response?.data?.msg || 'Failed to add asset');
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
          title='close'
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
                disabled={loading}
              >
                <option value="available">Available</option>
                <option value="in use">In Use</option>
                <option value="under maintenance">Under Maintenance</option>
              </select>
            </div>

            <div>
              <label htmlFor="assignedToName" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <input
                type="text"
                id="assignedToName"
                name="assignedToName"
                value={formData.assignedToName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="dateAssigned" className="block text-sm font-medium text-gray-700 mb-1">
                Date Assigned
              </label>
              <input
                type="date"
                id="dateAssigned"
                name="dateAssigned"
                value={formData.dateAssigned}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
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
                    title='button'
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                QR Code Image
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                  <Upload className="w-5 h-5 mr-2" />
                  Choose File
                  <input
                    type="file"
                    name="qrCodeImage"
                    onChange={handleFileChange}
                    className="sr-only"
                    accept="image/*"
                    disabled={loading}
                  />
                </label>
                {qrCodeImagePreview && (
                  <div className="relative h-16 w-16">
                    <img
                      src={qrCodeImagePreview}
                      alt="QR code preview"
                      className="h-16 w-16 object-cover rounded-md"
                    />
                    <button
                      title='button'
                      type="button"
                      onClick={() => {
                        setQrCodeImagePreview(null);
                        setFormData(prev => ({ ...prev, qrCodeImage: null }));
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