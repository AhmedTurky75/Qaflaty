// Merchant Auth
export interface MerchantDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  phone?: string;
  phoneCountryCode?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface InitiateLoginResponse {
  email: string;
}

export interface VerifyLoginResponse {
  merchant: MerchantDto;
  storeIds: string[];
}

export interface SelectStoreResult {
  storeId: string;
  role: string;
  permissions: string[];
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCountryCode?: string;
}

// Customer Auth
export interface StoreCustomerDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  fullName: string;
  phone?: string;
  phoneCountryCode?: string;
  secondaryPhone?: string;
  secondaryPhoneCountryCode?: string;
  isVerified: boolean;
  createdAt: string;
  addresses: CustomerAddressDto[];
}

export interface CustomerAddressDto {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

export interface RegisterCustomerRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  phone?: string;
}

export interface LoginCustomerRequest {
  emailOrUsername: string;
  password: string;
}

export interface StoreMemberDto {
  merchantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}
