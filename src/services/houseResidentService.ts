import api from './api';
import type { PaginatedResponse, ApiResponseWrapper } from '../types/api';
import type { House } from './houseService';
import type { Resident } from './residentService';

export interface HouseResident {
  id: number;
  house_id: number;
  house?: House;
  resident_id: number;
  resident?: Resident;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HouseResidentFilters {
  search?: string;
  is_active?: boolean | '';
  house_id?: number | '';
  resident_id?: number | '';
}

export const houseResidentService = {
  /**
   * Retrieve list of house-resident assignments
   */
  async getHouseResidents(
    filters?: HouseResidentFilters,
    page = 1,
    perPage = 10
  ): Promise<ApiResponseWrapper<PaginatedResponse<HouseResident>>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.house_id) params.house_id = filters.house_id;
      if (filters.resident_id) params.resident_id = filters.resident_id;
      if (filters.is_active !== undefined && filters.is_active !== '') {
        params.is_active = filters.is_active ? '1' : '0';
      }
    }

    const response = await api.get<ApiResponseWrapper<PaginatedResponse<HouseResident>>>('/house-residents', { params });
    return response.data;
  },

  /**
   * Retrieve a specific house-resident assignment by ID
   */
  async getHouseResidentById(id: number): Promise<ApiResponseWrapper<HouseResident>> {
    const response = await api.get<ApiResponseWrapper<HouseResident>>(`/house-residents/${id}`);
    return response.data;
  },

  /**
   * Create a new house-resident assignment
   */
  async createHouseResident(data: {
    house_id: number;
    resident_id: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
  }): Promise<ApiResponseWrapper<HouseResident>> {
    const response = await api.post<ApiResponseWrapper<HouseResident>>('/house-residents', data);
    return response.data;
  },

  /**
   * Update an existing house-resident assignment
   */
  async updateHouseResident(
    id: number,
    data: {
      house_id: number;
      resident_id: number;
      start_date: string;
      end_date: string | null;
      is_active: boolean;
    }
  ): Promise<ApiResponseWrapper<HouseResident>> {
    const response = await api.put<ApiResponseWrapper<HouseResident>>(`/house-residents/${id}`, data);
    return response.data;
  },

  /**
   * Delete a house-resident assignment
   */
  async deleteHouseResident(id: number): Promise<ApiResponseWrapper<null>> {
    const response = await api.delete<ApiResponseWrapper<null>>(`/house-residents/${id}`);
    return response.data;
  },
};

export default houseResidentService;
