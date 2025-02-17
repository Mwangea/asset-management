export interface Asset {
    _id: string;
    name: string;
    type: string;
    location: string;
    status: string;
    assignedToName?: string;
    qrCodeImage?: string;
    assetImage?: string;
    dateAssigned?: string;
  }