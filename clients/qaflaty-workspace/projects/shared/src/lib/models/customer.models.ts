import { OrderDto } from './order.models';

// These mirror the API's CustomerDto / CustomerListDto exactly. The shapes are FLAT — the API does
// not nest contact or address. HttpClient's generic is an unchecked cast, so any drift here fails
// at runtime in the template, not at compile time. Keep them in step with
// src/Qaflaty.Application/Ordering/DTOs/CustomerDto.cs.

/** Full customer record — returned by GET /api/customers/{id}. */
export interface CustomerDto {
  id: string;
  storeId: string;
  fullName: string;
  phone: string;
  email?: string;
  street: string;
  city: string;
  district?: string;
  postalCode?: string;
  country: string;
  notes?: string;
  orderCount: number;
  totalSpent: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  createdAt: string;
  /** Non-null exactly when this customer's phone is on the store blocklist; pass it back to unblock. */
  blockedPhoneId?: string | null;
  blockReason?: string | null;
  blockedAt?: string | null;
}

/** Trimmed row shape — returned by GET /api/customers. Has no address beyond `city`. */
export interface CustomerListDto {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  /** Non-null exactly when this customer's phone is on the store blocklist. */
  blockedPhoneId?: string | null;
}

export interface CustomerDetailDto extends CustomerDto {
  orders: OrderDto[];
}

export interface UpdateCustomerNotesRequest {
  notes: string;
}

export interface CustomerFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: CustomerSortBy;
  sortOrder?: 'asc' | 'desc';
}

export enum CustomerSortBy {
  Name = 'name',
  OrdersCount = 'ordersCount',
  TotalSpent = 'totalSpent',
  LastOrderDate = 'lastOrderDate'
}

/** Mirrors the API's PaginatedList<T>. Field names must match the wire format exactly. */
export interface PaginatedCustomers {
  items: CustomerListDto[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
