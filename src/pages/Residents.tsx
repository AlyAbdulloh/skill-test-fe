import React, { useState, useEffect, useCallback } from 'react';
import residentService from '../services/residentService';
import type { Resident, ResidentFilters } from '../services/residentService';

export const Residents: React.FC = () => {
  // State lists
  const [residents, setResidents] = useState<Resident[]>([]);
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

  const FILE_PATH = import.meta.env.VITE_FILE_PATH;

  // State filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'contract' | 'permanent' | ''>('');
  const [isMarriedFilter, setIsMarriedFilter] = useState<boolean | ''>('');

  // Debounce search input by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Skeletons and UI states
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [residentStatus, setResidentStatus] = useState<'contract' | 'permanent'>('permanent');
  const [isMarried, setIsMarried] = useState<boolean>(false);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);

  // Visual helpers for form
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delete Confirmation Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);

  // Fetch Residents from Backend
  const fetchResidents = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters: ResidentFilters = {
        search: debouncedSearch,
        resident_status: statusFilter,
        is_married: isMarriedFilter,
      };
      const response = await residentService.getResidents(filters, page, pagination.perPage);
      if (response.success && response.data) {
        setResidents(response.data.data);
        if (response.data.meta) {
          setPagination({
            currentPage: response.data.meta.current_page,
            lastPage: response.data.meta.last_page,
            total: response.data.meta.total,
            perPage: response.data.meta.per_page,
          });
        }
      } else {
        setErrorMessage(response.message || 'Failed to fetch residents.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to connect to the backend server.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, isMarriedFilter, pagination.perPage]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchResidents(1);
  }, [debouncedSearch, statusFilter, isMarriedFilter]);

  // Handle Image Upload Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFile(file);
      // Create local URL for preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Clean up object URL when modal closes or preview changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalType('create');
    setSelectedId(null);
    setFullName('');
    setPhoneNumber('');
    setResidentStatus('permanent');
    setIsMarried(false);
    setIdCardFile(null);
    setImagePreview(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (resident: Resident) => {
    setModalType('edit');
    setSelectedId(resident.id);
    setFullName(resident.full_name);
    setPhoneNumber(resident.phone_number);
    setResidentStatus(resident.resident_status);
    setIsMarried(Boolean(resident.is_married));
    setIdCardFile(null);
    // Display existing photo as preview
    setImagePreview(FILE_PATH + resident.id_card_photo);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Close Form Modal
  const closeFormModal = () => {
    setIsModalOpen(false);
  };

  // Form Submit Handler (Create & Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFieldErrors({});
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('phone_number', phoneNumber);
    formData.append('resident_status', residentStatus);
    formData.append('is_married', isMarried ? '1' : '0');

    if (idCardFile) {
      formData.append('id_card_photo', idCardFile);
    }

    try {
      let res;
      if (modalType === 'create') {
        res = await residentService.createResident(formData);
      } else {
        if (!selectedId) return;
        res = await residentService.updateResident(selectedId, formData);
      }

      if (res.success) {
        showToast(res.message || 'Success!');
        closeFormModal();
        fetchResidents(pagination.currentPage);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        // Validation Errors from Laravel
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

  // Open Delete Modal
  const confirmDelete = (resident: Resident) => {
    setDeleteTarget(resident);
    setIsDeleteOpen(true);
  };

  // Handle Delete Action
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await residentService.deleteResident(deleteTarget.id);
      if (res.success) {
        showToast(res.message || 'Resident deleted successfully.');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        // If we deleted the last item on the page, go to previous page
        const isLastItem = residents.length === 1;
        const targetPage = isLastItem && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
        fetchResidents(targetPage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to delete resident.'
      );
      setIsDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Toast Helper
  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
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
          <h1 className="text-2xl font-bold text-base-content m-0">Resident Management</h1>
          <p className="text-sm text-base-content/60">View, add, and manage housing estate residents details.</p>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Resident
        </button>
      </div>

      {/* Error Alert Display */}
      {errorMessage && (
        <div className="alert alert-error text-white shadow mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Table Card */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-6">
          {/* Filters Bar */}
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="select select-sm select-bordered w-36 focus:outline-primary"
              >
                <option value="">All Statuses</option>
                <option value="permanent">Permanent</option>
                <option value="contract">Contract</option>
              </select>

              <select
                value={isMarriedFilter === '' ? '' : isMarriedFilter ? '1' : '0'}
                onChange={(e) => {
                  const val = e.target.value;
                  setIsMarriedFilter(val === '' ? '' : val === '1');
                }}
                className="select select-sm select-bordered w-40 focus:outline-primary"
              >
                <option value="">All Marital</option>
                <option value="1">Married</option>
                <option value="0">Single</option>
              </select>
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto w-full">
            {loading && residents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-sm text-base-content/60">Fetching resident data...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>ID Card Photo</th>
                    <th>Full Name</th>
                    <th>Contact Info</th>
                    <th>Occupancy Type</th>
                    <th>Marital Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.length > 0 ? (
                    residents.map((resident) => (
                      <tr key={resident.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                        <td>
                          <div className="avatar">
                            <div className="w-16 h-10 rounded-lg border border-base-300 overflow-hidden bg-base-200">
                              {resident.id_card_photo_url ? (
                                <img
                                  src={FILE_PATH + resident.id_card_photo}
                                  alt={`${resident.full_name} ID Card`}
                                  className="object-cover w-full h-full cursor-zoom-in"
                                  onClick={() => window.open(FILE_PATH + resident.id_card_photo, '_blank')}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-xs text-base-content/40 italic">No File</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-sm">{resident.full_name}</div>
                          <div className="text-xs text-base-content/50">ID: #{resident.id}</div>
                        </td>
                        <td className="text-sm text-base-content/85">{resident.phone_number}</td>
                        <td>
                          <span className={`badge badge-sm font-semibold ${resident.resident_status === 'permanent'
                            ? 'badge-primary badge-outline'
                            : 'badge-secondary badge-outline'
                            }`}>
                            {resident.resident_status === 'permanent' ? 'Permanent' : 'Contract'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-sm ${resident.is_married ? 'badge-success text-white' : 'badge-ghost'}`}>
                            {resident.is_married ? 'Married' : 'Single'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-xs text-primary font-bold mr-1 hover:bg-primary/10"
                            onClick={() => openEditModal(resident)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error font-bold hover:bg-error/10"
                            onClick={() => confirmDelete(resident)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-base-content/50">
                        No resident records found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.lastPage > 1 && (
            <div className="flex justify-between items-center mt-6">
              <span className="text-xs text-base-content/50">
                Showing Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} records total)
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === 1 || loading}
                  onClick={() => fetchResidents(pagination.currentPage - 1)}
                >
                  &laquo; Prev
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-xs ${p === pagination.currentPage ? 'btn-primary text-white' : 'btn-outline'
                      }`}
                    onClick={() => fetchResidents(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === pagination.lastPage || loading}
                  onClick={() => fetchResidents(pagination.currentPage + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CRUD Modal Form (Create / Edit) */}
      {isModalOpen && (
        <div className="modal modal-open z-50 bg-black/60 transition-opacity duration-300">
          <div className="modal-box max-w-lg border border-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4">
              {modalType === 'create' ? 'Add Resident Profile' : 'Edit Resident Profile'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.full_name ? 'input-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.full_name && (
                  <p className="text-error text-xs mt-1">{fieldErrors.full_name[0]}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Phone Number (Numeric only)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0812345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.phone_number ? 'input-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.phone_number && (
                  <p className="text-error text-xs mt-1">{fieldErrors.phone_number[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Resident Status */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Resident Status</span>
                  </label>
                  <select
                    value={residentStatus}
                    onChange={(e) => setResidentStatus(e.target.value as any)}
                    className="select select-bordered select-sm w-full focus:outline-primary"
                    disabled={submitLoading}
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Marital Status</span>
                  </label>
                  <select
                    value={isMarried ? '1' : '0'}
                    onChange={(e) => setIsMarried(e.target.value === '1')}
                    className="select select-bordered select-sm w-full focus:outline-primary"
                    disabled={submitLoading}
                  >
                    <option value="0">Single</option>
                    <option value="1">Married</option>
                  </select>
                </div>
              </div>

              {/* ID Card File Upload */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">ID Card Photo (KTP)</span>
                </label>

                {/* Drag and Drop Box */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-base-300 rounded-xl p-4 bg-base-200/20 hover:bg-base-200/50 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={submitLoading}
                    required={modalType === 'create'}
                  />
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="mx-auto w-8 h-8 text-base-content/40 mb-2 group-hover:scale-110 transition-transform">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-base-content/65 block font-medium">Click or drag image to upload</span>
                    <span className="text-[10px] text-base-content/40 block mt-0.5">JPG, PNG up to 2MB</span>
                  </div>
                </div>

                {fieldErrors.id_card_photo && (
                  <p className="text-error text-xs mt-1">{fieldErrors.id_card_photo[0]}</p>
                )}

                {/* Local or Remote Preview */}
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-base-content/50 mb-1">Image Preview:</p>
                    <div className="relative rounded-lg overflow-hidden border border-base-200 bg-base-200/30 max-h-36 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="KTP Preview"
                        className="object-contain max-w-full max-h-32"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="modal-action border-t border-base-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="btn btn-sm btn-ghost"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary text-white gap-2 shadow"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
            <h3 className="font-bold text-lg text-base-content m-0">Confirm Deletion</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-6">
              Are you sure you want to delete resident <strong>{deleteTarget?.full_name}</strong>? This action cannot be undone.
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
                {loading ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residents;
