import api from './api';
import type { PaginatedResponse, ApiResponseWrapper } from '../types/api';

export interface Resident {
  id: number;
  full_name: string;
  id_card_photo: string;
  id_card_photo_url: string;
  resident_status: 'contract' | 'permanent';
  phone_number: string;
  is_married: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ResidentFilters {
  search?: string;
  resident_status?: 'contract' | 'permanent' | '';
  is_married?: boolean | '';
}

export const residentService = {
  /**
   * Retrieve list of residents with optional filtering and pagination
   */
  async getResidents(filters?: ResidentFilters, page = 1, perPage = 10): Promise<ApiResponseWrapper<PaginatedResponse<Resident>>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.resident_status) params.resident_status = filters.resident_status;
      if (filters.is_married !== undefined && filters.is_married !== '') {
        params.is_married = filters.is_married ? '1' : '0';
      }
    }

    const response = await api.get<ApiResponseWrapper<PaginatedResponse<Resident>>>('/residents', { params });
    return response.data;
  },

  /**
   * Retrieve a specific resident by ID
   */
  async getResidentById(id: number): Promise<ApiResponseWrapper<Resident>> {
    const response = await api.get<ApiResponseWrapper<Resident>>(`/residents/${id}`);
    return response.data;
  },

  /**
   * Create a new resident (handles image file uploads via FormData)
   */
  async createResident(data: FormData): Promise<ApiResponseWrapper<Resident>> {
    const response = await api.post<ApiResponseWrapper<Resident>>('/residents', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update an existing resident's profile.
   * Note: Laravel does not parse PUT/PATCH requests with multipart/form-data natively.
   * To support updating files (like ID card photo), we submit as a POST request
   * with a `_method=PUT` field in the FormData payload.
   */
  async updateResident(id: number, data: FormData): Promise<ApiResponseWrapper<Resident>> {
    // Append Laravel method spoofing if not already present
    if (!data.has('_method')) {
      data.append('_method', 'PUT');
    }

    const response = await api.post<ApiResponseWrapper<Resident>>(`/residents/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a resident record
   */
  async deleteResident(id: number): Promise<ApiResponseWrapper<null>> {
    const response = await api.delete<ApiResponseWrapper<null>>(`/residents/${id}`);
    return response.data;
  },
};

export default residentService;
