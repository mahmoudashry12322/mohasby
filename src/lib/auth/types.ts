export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  role: 'admin' | 'accountant' | 'auditor';
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthService {
  login(credentials: AuthCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
