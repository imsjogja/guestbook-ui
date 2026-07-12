import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post<AuthResponse>('/auth/login', {
          email: data.email,
          password: data.password,
        });
        const { access_token, user: userData } = response.data;
        storeLogin(access_token, userData);
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const msg = axiosErr.response?.data?.message ?? 'Email atau kata sandi salah';
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.post<AuthResponse>('/auth/register', {
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          tenant_subdomain: data.tenantSubdomain,
        });
        const { access_token, user: userData } = response.data;
        storeLogin(access_token, userData);
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const msg = axiosErr.response?.data?.message;
        const errors = axiosErr.response?.data?.errors;
        let errorMsg: string;
        if (errors) {
          const firstError = Object.values(errors)[0]?.[0];
          errorMsg = firstError ?? msg ?? 'Registrasi gagal';
        } else {
          errorMsg = msg ?? 'Registrasi gagal. Silakan coba lagi.';
        }
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin]
  );

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
