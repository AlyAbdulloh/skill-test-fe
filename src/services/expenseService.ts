import api from './api';
import type { PaginatedResponse, ApiResponseWrapper } from '../types/api';

export interface ExpenseDetail {
  id?: number;
  expense_id?: number;
  title: string;
  amount: number;
}

export interface Expense {
  id: number;
  expense_date: string;
  notes: string;
  details: ExpenseDetail[];
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFilters {
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface ExpensePayload {
  expense_date: string;
  notes: string;
  details: Array<{ title: string; amount: number }>;
}

export const expenseService = {
  /**
   * Retrieve list of expenses with optional filtering and pagination
   */
  async getExpenses(filters?: ExpenseFilters, page = 1, perPage = 10): Promise<ApiResponseWrapper<PaginatedResponse<Expense>>> {
    const params: Record<string, any> = {
      page,
      per_page: perPage,
    };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
    }

    const response = await api.get<ApiResponseWrapper<PaginatedResponse<Expense>>>('/expenses', { params });
    return response.data;
  },

  /**
   * Retrieve a specific expense record by ID
   */
  async getExpenseById(id: number): Promise<ApiResponseWrapper<Expense>> {
    const response = await api.get<ApiResponseWrapper<Expense>>(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Create a new expense record (with details)
   */
  async createExpense(data: ExpensePayload): Promise<ApiResponseWrapper<Expense>> {
    const response = await api.post<ApiResponseWrapper<Expense>>('/expenses', data);
    return response.data;
  },

  /**
   * Update an existing expense record (with details)
   */
  async updateExpense(id: number, data: ExpensePayload): Promise<ApiResponseWrapper<Expense>> {
    const response = await api.put<ApiResponseWrapper<Expense>>(`/expenses/${id}`, data);
    return response.data;
  },

  /**
   * Delete an expense record
   */
  async deleteExpense(id: number): Promise<ApiResponseWrapper<null>> {
    const response = await api.delete<ApiResponseWrapper<null>>(`/expenses/${id}`);
    return response.data;
  },
};

export default expenseService;
