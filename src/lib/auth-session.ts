import type { AuthResponse } from '@/types';

export function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<AuthResponse>;
  return Boolean(
    typeof response.access_token === 'string' &&
    response.access_token &&
    typeof response.refresh_token === 'string' &&
    response.refresh_token &&
    response.user &&
    typeof response.user.id === 'string' &&
    response.user.id
  );
}
