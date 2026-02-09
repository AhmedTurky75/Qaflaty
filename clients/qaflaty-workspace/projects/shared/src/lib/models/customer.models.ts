import { Address, OrderDto } from './order.models';

export interface CustomerDto {
  id: string;
  storeId: string;
  contact: CustomerContactInfo;
  address: Address;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate?: string;
  lastOrderDate?: string;
  createdAt: string;
}

export interface CustomerContactInfo {
  fullName: string;
  phone: string;
  email?: string;
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

export interface PaginatedCustomers {
  customers: CustomerDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
