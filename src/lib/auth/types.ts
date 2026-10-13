export interface User {
  id: string;
  email: string | null;
  username: string | null;
  name: string;
  companyName: string;
  companyId?: number;
  role: string;
  isActive?: boolean;
  permissions: string[];
}

export interface AuthCredentials {
  identifier?: string;
  email?: string;
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
