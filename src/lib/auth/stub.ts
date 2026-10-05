import { AuthService, AuthCredentials, AuthResponse, User } from './types';

const DEMO_USER: User = {
  id: 'usr_demo_01',
  email: 'demo@mohasby.app',
  name: 'أحمد الشناوي',
  companyName: 'محطة وادي النيل للحاصلات الزراعية',
  role: 'admin',
};

export class StubAuthService implements AuthService {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    // Artificial latency of ~700ms per Part 9.1
    await new Promise((resolve) => setTimeout(resolve, 700));

    const emailMatch = credentials.email.trim().toLowerCase() === 'demo@mohasby.app';
    const passwordMatch = credentials.password === 'Demo@12345';

    if (emailMatch && passwordMatch) {
      return {
        success: true,
        user: DEMO_USER,
      };
    }

    return {
      success: false,
      error: 'بيانات الدخول غير صحيحة. راجع البريد وكلمة المرور وحاول مرة أخرى.',
    };
  }

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  async getCurrentUser(): Promise<User | null> {
    return DEMO_USER;
  }
}

export const authService = new StubAuthService();
