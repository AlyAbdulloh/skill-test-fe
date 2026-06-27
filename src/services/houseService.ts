import api from './api';
import type { PaginatedResponse, ApiResponseWrapper } from '../types/api';
import type { Resident } from './residentService';

export interface House {
  id: number;
  house_number: string;
  address: string;
  occupancy_status: 'occupied' | 'unoccupied';
  created_at?: string;
  updated_at?: string;
}

export interface HouseFilters {
  search?: string;
  occupancy_status?: 'occupied' | 'unoccupied' | '';
}

export interface HouseResidentHistory {
  id: number;
  house_id: number;
  resident_id: number;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  resident?: Resident; // Eager-loaded from the backend
  created_at?: string;
  updated_at?: string;
}

export const houseService = {
  /**
   * Retrieve list of houses with optional search and status filtering
   */
  async getHouses(filters?: HouseFilters, page = 1, perPage = 10): Promise<ApiResponseWrapper<PaginatedResponse<House>>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.occupancy_status) params.occupancy_status = filters.occupancy_status;
    }

    const response = await api.get<ApiResponseWrapper<PaginatedResponse<House>>>('/houses', { params });
    return response.data;
  },

  /**
   * Retrieve a specific house by ID
   */
  async getHouseById(id: number): Promise<ApiResponseWrapper<House>> {
    const response = await api.get<ApiResponseWrapper<House>>(`/houses/${id}`);
    return response.data;
  },

  /**
   * Create a new house record
   */
  async createHouse(data: Omit<House, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponseWrapper<House>> {
    const response = await api.post<ApiResponseWrapper<House>>('/houses', data);
    return response.data;
  },

  /**
   * Update an existing house record
   */
  async updateHouse(id: number, data: Omit<House, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponseWrapper<House>> {
    const response = await api.put<ApiResponseWrapper<House>>(`/houses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a house record
   */
  async deleteHouse(id: number): Promise<ApiResponseWrapper<null>> {
    const response = await api.delete<ApiResponseWrapper<null>>(`/houses/${id}`);
    return response.data;
  },

  /**
   * Retrieve resident occupancy history for a specific house
   */
  async getHouseResidentHistory(id: number, page = 1, perPage = 10): Promise<ApiResponseWrapper<PaginatedResponse<HouseResidentHistory>>> {
    const params = {
      page,
      per_page: perPage,
    };
    const response = await api.get<ApiResponseWrapper<PaginatedResponse<HouseResidentHistory>>>(`/houses/${id}/residents`, { params });
    return response.data;
  },
};

export default houseService;
