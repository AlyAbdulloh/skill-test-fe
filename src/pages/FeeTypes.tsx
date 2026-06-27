import React, { useState, useEffect, useCallback } from 'react';
import feeTypeService from '../services/feeTypeService';
import type { FeeType, FeeTypeFilters } from '../services/feeTypeService';

export const FeeTypes: React.FC = () => {
  // Lists & pagination
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<'1' | '0' | ''>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delete Confirmation Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FeeType | null>(null);

  // Debounce search filter by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Fee Types from Backend
  const fetchFeeTypes = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters: FeeTypeFilters = {
        search: debouncedSearch,
        is_active: statusFilter === '' ? '' : statusFilter === '1',
      };
      const response = await feeTypeService.getFeeTypes(filters, page, pagination.perPage);
      if (response.success && response.data) {
        setFeeTypes(response.data.data);
        if (response.data.meta) {
          setPagination({
            currentPage: response.data.meta.current_page,
            lastPage: response.data.meta.last_page,
            total: response.data.meta.total,
            perPage: response.data.meta.per_page,
          });
        }
      } else {
        setErrorMessage(response.message || 'Failed to fetch fee types.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to connect to the backend server.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.perPage]);

  // Reload fee types on filter / search changes
  useEffect(() => {
    fetchFeeTypes(1);
  }, [debouncedSearch, statusFilter]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalType('create');
    setSelectedId(null);
    setName('');
    setAmount('');
    setIsActive(true);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (fee: FeeType) => {
    setModalType('edit');
    setSelectedId(fee.id);
    setName(fee.name);
    setAmount(fee.amount);
    setIsActive(!!fee.is_active);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Submit Handler (Create & Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFieldErrors({});
    setErrorMessage(null);

    const payload = {
      name,
      amount: Number(amount),
      is_active: isActive,
    };

    try {
      let res;
      if (modalType === 'create') {
        res = await feeTypeService.createFeeType(payload);
      } else {
        if (!selectedId) return;
        res = await feeTypeService.updateFeeType(selectedId, payload);
      }

      if (res.success) {
        showToast(res.message || 'Success!');
        setIsModalOpen(false);
        fetchFeeTypes(pagination.currentPage);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        setErrorMessage(
          err.response?.data?.message || 'An error occurred during submission.'
        );
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Confirm Delete
  const confirmDelete = (fee: FeeType) => {
    setDeleteTarget(fee);
    setIsDeleteOpen(true);
  };

  // Delete Action handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await feeTypeService.deleteFeeType(deleteTarget.id);
      if (res.success) {
        showToast(res.message || 'Fee type deleted successfully.');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        // Page adjustment if last item deleted
        const isLastItem = feeTypes.length === 1;
        const targetPage = isLastItem && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
        fetchFeeTypes(targetPage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to delete fee type record.'
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

  // Format currency value to IDR
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
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
          <h1 className="text-2xl font-bold text-base-content m-0">Master Fee Types</h1>
          <p className="text-sm text-base-content/60">Configure and manage various billing categories and templates.</p>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Fee Type
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

      {/* Fee Types Table List Card */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-6">
          
          {/* Filtering controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm input-bordered pl-8 w-full max-w-md focus:outline-primary"
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

            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="select select-sm select-bordered w-36 focus:outline-primary"
              >
                <option value="">All Statuses</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            {loading && feeTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-sm text-base-content/60">Fetching billing templates...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>Fee Name</th>
                    <th>Base Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTypes.length > 0 ? (
                    feeTypes.map((fee) => (
                      <tr key={fee.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                        <td className="font-bold text-sm text-primary">{fee.name}</td>
                        <td className="font-semibold text-sm">{formatIDR(fee.amount)}</td>
                        <td>
                          <span className={`badge badge-sm font-semibold ${
                            fee.is_active 
                              ? 'badge-success text-white' 
                              : 'badge-ghost text-base-content/40'
                          }`}>
                            {fee.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-xs text-primary font-bold mr-1 hover:bg-primary/10"
                            onClick={() => openEditModal(fee)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error font-bold hover:bg-error/10"
                            onClick={() => confirmDelete(fee)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-base-content/50">
                        No billing categories configured yet. Click "Add Fee Type" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination controls */}
          {pagination.lastPage > 1 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-xs text-base-content/50">
                Showing Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} records total)
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === 1 || loading}
                  onClick={() => fetchFeeTypes(pagination.currentPage - 1)}
                >
                  &laquo; Prev
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-xs ${p === pagination.currentPage ? 'btn-primary text-white' : 'btn-outline'}`}
                    onClick={() => fetchFeeTypes(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === pagination.lastPage || loading}
                  onClick={() => fetchFeeTypes(pagination.currentPage + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Type Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box max-w-md border border-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4">
              {modalType === 'create' ? 'Add Fee Category' : 'Edit Fee Details'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Fee Name *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Iuran Keamanan, Sampah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${
                    fieldErrors.name ? 'input-error' : ''
                  }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-error text-xs mt-1">{fieldErrors.name[0]}</p>
                )}
              </div>

              {/* Base Amount */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Billing Amount (IDR) *</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${
                    fieldErrors.amount ? 'input-error' : ''
                  }`}
                  disabled={submitLoading}
                  required
                  min={0}
                />
                {fieldErrors.amount && (
                  <p className="text-error text-xs mt-1">{fieldErrors.amount[0]}</p>
                )}
              </div>

              {/* Is Active Status checkbox toggle */}
              <div className="form-control">
                <label className="label cursor-pointer flex justify-start gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="checkbox checkbox-primary checkbox-sm"
                    disabled={submitLoading}
                  />
                  <span className="label-text font-semibold text-xs">Is Active template</span>
                </label>
                {fieldErrors.is_active && (
                  <p className="text-error text-xs mt-1">{fieldErrors.is_active[0]}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="modal-action border-t border-base-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-ghost"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary text-white gap-2"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Details'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box border border-base-200 text-center max-w-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-base-content m-0">Delete Fee Type</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-6">
              Are you sure you want to delete fee type <strong>{deleteTarget?.name}</strong>? This will clear its billing template.
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
                Cancel
              </button>
              <button
                className="btn btn-sm btn-error text-white"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeTypes;
