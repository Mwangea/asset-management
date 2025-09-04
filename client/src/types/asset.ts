
export interface Asset {
  _id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  assignedToName?: string;
  assignedTo?: string;
  qrCodeImage?: string;
  assetImage?: string;
  dateAssigned?: string;
  lastUpdated?: string;
}

export interface AssetFormData {
  name: string;
  type: string;
  location: string;
  status: string;
  assignedToName?: string;
  assignedTo?: string;
  dateAssigned?: string;
  assetImage?: File | null;
  qrCodeImage?: File | null;
  category: string;
  subcategory: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: string;
  warranty: string;
}