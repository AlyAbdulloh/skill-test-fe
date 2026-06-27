import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import expenseService from '../services/expenseService';
import type { Expense, ExpenseFilters } from '../services/expenseService';

export const Expenses: React.FC = () => {
  const navigate = useNavigate();

  // Lists & pagination
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 10,
  });

  // State Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete Confirmation Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  // Debounce search filter by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Expenses
  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters: ExpenseFilters = {
        search: debouncedSearch,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };
      const response = await expenseService.getExpenses(filters, page, pagination.perPage);
      if (response.success && response.data) {
        setExpenses(response.data.data);
        if (response.data.meta) {
          setPagination({
            currentPage: response.data.meta.current_page,
            lastPage: response.data.meta.last_page,
            total: response.data.meta.total,
            perPage: response.data.meta.per_page,
          });
        }
      } else {
        setErrorMessage(response.message || 'Gagal mengambil data pengeluaran.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Gagal terhubung dengan server backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, startDate, endDate, pagination.perPage]);

  // Reload fee types on filter / search changes
  useEffect(() => {
    fetchExpenses(1);
  }, [debouncedSearch, startDate, endDate]);

  // Confirm delete handler
  const confirmDelete = (expense: Expense) => {
    setDeleteTarget(expense);
    setIsDeleteOpen(true);
  };

  // Perform delete operation
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const response = await expenseService.deleteExpense(deleteTarget.id);
      if (response.success) {
        showToast('Catatan pengeluaran berhasil dihapus.');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        
        // Adjust page if we deleted the last item on the page
        const isLastItem = expenses.length === 1;
        const targetPage = isLastItem && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
        fetchExpenses(targetPage);
      } else {
        setErrorMessage(response.message || 'Gagal menghapus pengeluaran.');
        setIsDeleteOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Gagal menghapus data pengeluaran.'
      );
      setIsDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Toast alert trigger
  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Helper format currency IDR
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const getExpenseTotal = (expense: Expense) => {
    return expense.details?.reduce((acc, detail) => acc + Number(detail.amount), 0) || 0;
  };

  return (
    <div>
      {/* Toast Alert */}
      {successMessage && (
        <div className="toast toast-end toast-top z-50">
          <div className="alert alert-success text-white shadow-lg flex gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-base-content m-0">Catatan Pengeluaran Kas</h1>
          <p className="text-sm text-base-content/60">Catat biaya operasional perumahan, gaji pekerja, dan proyek perbaikan.</p>
        </div>
        <button
          onClick={() => navigate('/expenses/create')}
          className="btn btn-primary btn-sm gap-2 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Catat Pengeluaran
        </button>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="alert alert-error text-white shadow mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Expenses Listing */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-6">

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-base-content/65 font-medium">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input input-sm input-bordered focus:outline-primary"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-base-content/65 font-medium">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input input-sm input-bordered focus:outline-primary"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="btn btn-ghost btn-xs text-error font-semibold"
                >
                  Hapus Filter Tanggal
                </button>
              )}
            </div>

            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Cari catatan atau item kebutuhan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm input-bordered pl-8 w-full focus:outline-primary"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="absolute left-2.5 top-2.5 h-4 w-4 opacity-50 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            {loading && expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-sm text-base-content/60">Mengambil data pengeluaran kas...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>Kode</th>
                    <th>Tanggal</th>
                    <th>Catatan</th>
                    <th>Item Kebutuhan</th>
                    <th>Total Biaya</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 ? (
                    expenses.map((exp) => {
                      const totalAmount = getExpenseTotal(exp);
                      return (
                        <tr key={exp.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                          <td className="font-semibold text-sm text-error">
                            EXP-{String(exp.id).padStart(5, '0')}
                          </td>
                          <td className="text-sm text-base-content/80">
                            {new Date(exp.expense_date).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="text-sm max-w-sm whitespace-normal break-words" title={exp.notes}>
                            {exp.notes}
                          </td>
                          <td className="text-xs">
                            <div className="flex flex-col gap-1 max-w-xs">
                              {exp.details?.slice(0, 3).map((detail, idx) => (
                                <span key={detail.id || idx} className="badge badge-sm font-medium badge-ghost truncate block max-w-full">
                                  {detail.title} ({formatCurrency(detail.amount)})
                                </span>
                              ))}
                              {exp.details && exp.details.length > 3 && (
                                <span className="text-[10px] text-base-content/50 italic font-semibold pl-1">
                                  + {exp.details.length - 3} item lagi
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="font-bold text-sm text-error">
                            {formatCurrency(totalAmount)}
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => navigate(`/expenses/edit/${exp.id}`)}
                              className="btn btn-ghost btn-xs text-primary font-bold mr-1 hover:bg-primary/10"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => confirmDelete(exp)}
                              className="btn btn-ghost btn-xs text-error font-bold hover:bg-error/10"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-base-content/50">
                        Catatan pengeluaran tidak ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-xs text-base-content/50">
                Menampilkan Halaman {pagination.currentPage} dari {pagination.lastPage} (Total {pagination.total} data)
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === 1 || loading}
                  onClick={() => fetchExpenses(pagination.currentPage - 1)}
                >
                  &laquo; Prev
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-xs ${p === pagination.currentPage ? 'btn-primary text-white' : 'btn-outline'}`}
                    onClick={() => fetchExpenses(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === pagination.lastPage || loading}
                  onClick={() => fetchExpenses(pagination.currentPage + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box border border-base-200 text-center max-w-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-base-content m-0">Hapus Pengeluaran</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-6">
              Apakah Anda yakin ingin menghapus catatan pengeluaran <strong>EXP-{String(deleteTarget?.id).padStart(5, '0')}</strong>? Semua rincian transaksi terkait akan dihapus secara permanen.
            </p>
            <div className="flex justify-center gap-2">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteTarget(null);
                }}
                disabled={loading}
              >
                Batal
              </button>
              <button
                className="btn btn-sm btn-error text-white"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  'Hapus Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
