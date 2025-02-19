export interface IActivity {
    _id?: string;
    action: string;
    details?: string;
    timestamp: string;
    username: string;
    asset?: {
      name: string;
      [key: string]: unknown;
    };
  }


  export interface DistributionItem {
    type: string;
    count: number;
    percentage?: number;
  }

  export interface LocationItem {
    location: string;
    count: number;
    percentage?: number;
  }

  export interface UserItem {
    user: string;
    count: number;
  }