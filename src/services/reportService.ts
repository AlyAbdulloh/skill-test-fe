import api from './api';
import type { ApiResponseWrapper } from '../types/api';

export interface MonthlyIncome {
  month: number;
  total_income: number;
}

export interface MonthlyExpense {
  month: number;
  total_expense: number;
}

export interface SummaryReportData {
  year: number;
  income: MonthlyIncome[];
  expense: MonthlyExpense[];
}

export interface ReportFilters {
  month?: string;
}

export interface DetailedIncomeItem {
  id: number;
  billing_month: string;
  amount: number;
  status: string;
  paid_at: string | null;
  house_resident?: {
    resident?: { full_name: string };
    house?: { house_number: string };
  };
  fee_type?: { name: string };
}

export interface DetailedExpenseItem {
  id: number;
  expense_id: number;
  title: string;
  amount: number;
  expense?: {
    expense_date: string;
    notes: string;
  };
}

export interface DetailedReportData {
  month: string;
  incomes: DetailedIncomeItem[];
  expenses: DetailedExpenseItem[];
  total_income: number;
  total_expense: number;
}

export const reportService = {
  /**
   * Fetch the dashboard summary report
   */
  async getSummaryReport(filters?: ReportFilters): Promise<ApiResponseWrapper<SummaryReportData>> {
    const params: Record<string, any> = {};
    if (filters?.month) {
      params.month = filters.month;
    }
    const response = await api.get<ApiResponseWrapper<SummaryReportData>>('/reports/summary', { params });
    return response.data;
  },

  /**
   * Fetch detailed transaction items for a specific month
   */
  async getMonthlyDetailReport(filters?: ReportFilters): Promise<ApiResponseWrapper<DetailedReportData>> {
    const params: Record<string, any> = {};
    if (filters?.month) {
      params.month = filters.month;
    }
    const response = await api.get<ApiResponseWrapper<DetailedReportData>>('/reports/detail', { params });
    return response.data;
  }
};

export default reportService;
