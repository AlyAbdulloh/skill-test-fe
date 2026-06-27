import api from './api';
import type { PaginatedResponse, ApiResponseWrapper } from '../types/api';
import type { HouseResident } from './houseResidentService';
import type { FeeType } from './feeTypeService';

export interface PaymentBill {
  id: number;
  house_resident_id: number;
  house_resident?: HouseResident;
  fee_type_id: number;
  fee_type?: FeeType;
  billing_month: string; // YYYY-MM-DD
  amount: number;
  status: 'paid' | 'unpaid';
  paid_at: string | null; // YYYY-MM-DD
  payment_group_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentBillFilters {
  search?: string;
  status?: 'paid' | 'unpaid' | '';
  payment_group_id?: string;
  house_resident_id?: number | '';
  fee_type_id?: number | '';
}

export interface CreatePaymentBillPayload {
  months: string[]; // YYYY-MM
  house_resident_id: number;
  fee_type_id: number;
  amount_per_month: number;
  paid_at: string;
}

export interface UpdatePaymentBillPayload {
  house_resident_id?: number;
  fee_type_id?: number;
  billing_month?: string;
  amount?: number;
  status?: 'paid' | 'unpaid';
  paid_at?: string | null;
  payment_group_id?: string | null;
}

export const paymentBillService = {
  /**
   * Retrieve list of payment bills
   */
  async getPaymentBills(
    filters?: PaymentBillFilters,
    page = 1,
    perPage = 10
  ): Promise<ApiResponseWrapper<PaginatedResponse<PaymentBill>>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.payment_group_id) params.payment_group_id = filters.payment_group_id;
      if (filters.house_resident_id) params.house_resident_id = filters.house_resident_id;
      if (filters.fee_type_id) params.fee_type_id = filters.fee_type_id;
    }

    const response = await api.get<ApiResponseWrapper<PaginatedResponse<PaymentBill>>>('/payment-bills', { params });
    return response.data;
  },

  /**
   * Retrieve a specific payment bill by ID
   */
  async getPaymentBillById(id: number): Promise<ApiResponseWrapper<PaymentBill>> {
    const response = await api.get<ApiResponseWrapper<PaymentBill>>(`/payment-bills/${id}`);
    return response.data;
  },

  /**
   * Create new payment bills (bulk or single month)
   */
  async createPaymentBills(data: CreatePaymentBillPayload): Promise<ApiResponseWrapper<{
    total_months: number;
    total_amount: number;
    payment_group_id: string | null;
  }>> {
    const response = await api.post<ApiResponseWrapper<{
      total_months: number;
      total_amount: number;
      payment_group_id: string | null;
    }>>('/payment-bills', data);
    return response.data;
  },

  /**
   * Update an existing payment bill (e.g. record payment or update details)
   */
  async updatePaymentBill(
    id: number,
    data: UpdatePaymentBillPayload
  ): Promise<ApiResponseWrapper<PaymentBill>> {
    const response = await api.put<ApiResponseWrapper<PaymentBill>>(`/payment-bills/${id}`, data);
    return response.data;
  },

  /**
   * Delete a payment bill
   */
  async deletePaymentBill(id: number): Promise<ApiResponseWrapper<null>> {
    const response = await api.delete<ApiResponseWrapper<null>>(`/payment-bills/${id}`);
    return response.data;
  },
};

export default paymentBillService;
