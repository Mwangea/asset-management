export interface User {
    id: string;
    username: string;
    role: 'admin' | 'user';
  }
  
  export interface AuthResponse {
    token: string;
    role: 'admin' | 'user';
  }