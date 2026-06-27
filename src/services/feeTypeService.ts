import api from './api';
import type { PaginatedResponse, ApiResponseWrapper } from '../types/api';

export interface FeeType {
  id: number;
  name: string;
  amount: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FeeTypeFilters {
  search?: string;
  is_active?: boolean | '';
}

export const feeTypeService = {
  /**
   * Retrieve list of fee types
   */
  async getFeeTypes(
    filters?: FeeTypeFilters,
    page = 1,
    perPage = 100 // Default to high number for dropdown options selection
  ): Promise<ApiResponseWrapper<PaginatedResponse<FeeType>>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.is_active !== undefined && filters.is_active !== '') {
        params.is_active = filters.is_active ? '1' : '0';
      }
    }

    const response = await api.get<ApiResponseWrapper<PaginatedResponse<FeeType>>>('/fee-types', { params });
    return response.data;
  },

  /**
   * Retrieve a specific fee type by ID
   */
  async getFeeTypeById(id: number): Promise<ApiResponseWrapper<FeeType>> {
    const response = await api.get<ApiResponseWrapper<FeeType>>(`/fee-types/${id}`);
    return response.data;
  },

  /**
   * Create a new fee type
   */
  async createFeeType(payload: Record<string, any>): Promise<ApiResponseWrapper<FeeType>> {
    const response = await api.post<ApiResponseWrapper<FeeType>>('/fee-types', payload);
    return response.data;
  },

  /**
   * Update an existing fee type
   */
  async updateFeeType(id: number, payload: Record<string, any>): Promise<ApiResponseWrapper<FeeType>> {
    const response = await api.put<ApiResponseWrapper<FeeType>>(`/fee-types/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a fee type
   */
  async deleteFeeType(id: number): Promise<ApiResponseWrapper<null>> {
    const response = await api.delete<ApiResponseWrapper<null>>(`/fee-types/${id}`);
    return response.data;
  },
};

export default feeTypeService;
