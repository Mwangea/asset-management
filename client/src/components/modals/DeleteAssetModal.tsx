/* eslint-disable @typescript-eslint/no-explicit-any */
// components/modals/DeleteAssetModal.tsx
import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Asset } from '../../types/asset';

interface DeleteAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

const DeleteAssetModal: React.FC<DeleteAssetModalProps> = ({ isOpen, onClose, onSuccess, asset }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!asset) return;
    
    setLoading(true);

    try {
      await api.delete(`/assets/${asset._id}`);
      toast.success('Asset deleted successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      toast.error(error.response?.data?.msg || 'Failed to delete asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Delete Asset</h3>
          <button
          title='close'
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete <span className="font-semibold">{asset.name}</span>? This action cannot be undone.
          </p>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Asset'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAssetModal;