export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  merchant: MerchantDto;
}

export interface MerchantDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}
