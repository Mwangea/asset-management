export interface User {
    _id: string;
    username: string;
    role: 'admin' | 'user';
    lastLogin: string;
    createdAt: string;
  }
  
  export interface UserFormData {
    username: string;
    password: string;
    role: 'admin' | 'user';
  }