import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import type { AuthResponse, LoginRequest, RegisterRequest, RegistrationResponse } from '@/types';
import { getApiErrorMessage } from '@/lib/localization';

function assertAuthResponse(response: AuthResponse) {
  if (!response?.access_token || !response?.refresh_token || !response?.user?.id) {
    throw new Error('Respons login tidak valid');
  }
}

export function useAuth() {
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsLoading(true);
      setError(null);
      setErrorCode(null);
      try {
        const response = await api.post<AuthResponse>('/auth/login', {
          email: data.email,
          password: data.password,
        });
        assertAuthResponse(response.data);
        const { access_token, refresh_token, user: userData } = response.data;
        storeLogin(access_token, refresh_token, userData);
        setErrorCode(null);
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string; code?: string } } };
        const code = axiosErr.response?.data?.code ?? null;
        setErrorCode(code);
        if (code === 'EMAIL_NOT_VERIFIED') {
          // Do not leave a stale session active when authentication is rejected.
          storeLogout();
        }
        const isNetworkError =
          !axiosErr.response ||
          (err instanceof Error && err.message === 'Network Error');
        const msg = getApiErrorMessage(
          err,
          isNetworkError ? 'Tidak dapat terhubung ke server. Pastikan backend Docker aktif.' : 'Email atau kata sandi salah'
        );
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin, storeLogout]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      setError(null);
      setErrorCode(null);
      try {
        const response = await api.post<AuthResponse | RegistrationResponse>('/auth/register', {
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          tenant_name: data.tenantName,
        });
        if ('email_verification_required' in response.data && response.data.email_verification_required) {
          return response.data;
        }
        assertAuthResponse(response.data as AuthResponse);
        const { access_token, refresh_token, user: userData } = response.data as AuthResponse;
        storeLogin(access_token, refresh_token, userData);
        return response.data;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string; error?: string; code?: string; errors?: Record<string, string[]> } } };
        const code = axiosErr.response?.data?.code ?? null;
        setErrorCode(code);
        const isNetworkError =
          !axiosErr.response ||
          (err instanceof Error && err.message === 'Network Error');
        const msg = axiosErr.response?.data?.message;
        const errors = axiosErr.response?.data?.errors;
        const fallback = getApiErrorMessage(err, isNetworkError ? 'Tidak dapat terhubung ke server. Pastikan backend Docker aktif.' : 'Registrasi gagal. Silakan coba lagi.');
        let errorMsg: string;
        if (errors) {
          const firstError = Object.values(errors)[0]?.[0];
          errorMsg = firstError ?? msg ?? fallback;
        } else if (isNetworkError) {
          errorMsg = 'Tidak dapat terhubung ke server. Pastikan backend Docker aktif.';
        } else {
          errorMsg = msg ? getApiErrorMessage({ response: { data: { message: msg, code } } }, fallback) : fallback;
        }
        setError(errorMsg);
        const registrationError = new Error(errorMsg) as Error & { code?: string };
        registrationError.code = code ?? undefined;
        throw registrationError;
      } finally {
        setIsLoading(false);
      }
    },
    [storeLogin]
  );

  const resendVerification = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      await api.post('/auth/resend-verification', { email });
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        err instanceof Error && err.message === 'Network Error'
          ? 'Tidak dapat terhubung ke server. Pastikan backend Docker aktif.'
          : 'Email verifikasi gagal dikirim ulang.'
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        err instanceof Error && err.message === 'Network Error'
          ? 'Tidak dapat terhubung ke server. Pastikan backend Docker aktif.'
          : 'Permintaan reset kata sandi gagal.'
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestMagicLink = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/magic-link', { email });
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        err instanceof Error && err.message === 'Network Error'
          ? 'Tidak dapat terhubung ke server. Pastikan backend Docker aktif.'
          : 'Permintaan link masuk gagal.'
      );
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const consumeMagicLink = useCallback(async (token: string) => {
    const response = await api.post<AuthResponse>('/auth/magic-link/consume', { token });
    assertAuthResponse(response.data);
    const { access_token, refresh_token, user: userData } = response.data;
    storeLogin(access_token, refresh_token, userData);
    return response.data;
  }, [storeLogin]);

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    login,
    register,
    requestPasswordReset,
    requestMagicLink,
    consumeMagicLink,
    resendVerification,
    logout,
  };
}
