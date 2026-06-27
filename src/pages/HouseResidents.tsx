import React, { useState, useEffect, useCallback } from 'react';
import houseResidentService from '../services/houseResidentService';
import houseService from '../services/houseService';
import residentService from '../services/residentService';
import type { HouseResident, HouseResidentFilters } from '../services/houseResidentService';
import type { House } from '../services/houseService';
import type { Resident } from '../services/residentService';

export const HouseResidents: React.FC = () => {
  // Lists & Pagination
  const [associations, setAssociations] = useState<HouseResident[]>([]);
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

  // Source options for form select dropdowns
  const [houses, setHouses] = useState<House[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);

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
  const [houseId, setHouseId] = useState<number | ''>('');
  const [residentId, setResidentId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isContractResident, setIsContractResident] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delete Confirmation Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HouseResident | null>(null);

  // Debounce search filter by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Occupancies from Backend
  const fetchAssociations = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters: HouseResidentFilters = {
        search: debouncedSearch,
        is_active: statusFilter === '' ? '' : statusFilter === '1',
      };
      const response = await houseResidentService.getHouseResidents(filters, page, pagination.perPage);
      if (response.success && response.data) {
        setAssociations(response.data.data);
        if (response.data.meta) {
          setPagination({
            currentPage: response.data.meta.current_page,
            lastPage: response.data.meta.last_page,
            total: response.data.meta.total,
            perPage: response.data.meta.per_page,
          });
        }
      } else {
        setErrorMessage(response.message || 'Failed to fetch occupancies.');
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

  // Load dropdown lists for Houses and Residents once on mount
  const fetchFormSourceData = async () => {
    try {
      // Query houses (retrieve up to 100 properties)
      const housesRes = await houseService.getHouses({}, 1, 100);
      if (housesRes.success && housesRes.data) {
        setHouses(housesRes.data.data);
      }

      // Query residents (retrieve up to 100 people)
      const residentsRes = await residentService.getResidents({}, 1, 100);
      if (residentsRes.success && residentsRes.data) {
        setResidents(residentsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load form lookup data:', err);
    }
  };

  useEffect(() => {
    fetchFormSourceData();
  }, []);

  // Reload lists when filter states update
  useEffect(() => {
    fetchAssociations(1);
  }, [debouncedSearch, statusFilter]);

  // Detect if selected resident is a contract occupant
  useEffect(() => {
    if (residentId) {
      const foundResident = residents.find((r) => r.id === Number(residentId));
      if (foundResident && foundResident.resident_status === 'contract') {
        setIsContractResident(true);
      } else {
        setIsContractResident(false);
        setEndDate(''); // Clear end_date for permanent residents
      }
    } else {
      setIsContractResident(false);
    }
  }, [residentId, residents]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalType('create');
    setSelectedId(null);
    setHouseId('');
    setResidentId('');
    // Default start date to today in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate('');
    setIsActive(true);
    setIsContractResident(false);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (assoc: HouseResident) => {
    setModalType('edit');
    setSelectedId(assoc.id);
    setHouseId(assoc.house_id);
    setResidentId(assoc.resident_id);
    setStartDate(assoc.start_date);
    setEndDate(assoc.end_date || '');
    setIsActive(assoc.is_active);

    // Check if resident is contract
    const residentObj = residents.find((r) => r.id === assoc.resident_id) || assoc.resident;
    setIsContractResident(residentObj?.resident_status === 'contract');

    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Submit Handler (Create & Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseId || !residentId || !startDate) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitLoading(true);
    setFieldErrors({});
    setErrorMessage(null);

    const payload = {
      house_id: Number(houseId),
      resident_id: Number(residentId),
      start_date: startDate,
      end_date: isContractResident ? (endDate || null) : null,
      is_active: isActive,
    };

    try {
      let res;
      if (modalType === 'create') {
        res = await houseResidentService.createHouseResident(payload);
      } else {
        if (!selectedId) return;
        res = await houseResidentService.updateHouseResident(selectedId, payload);
      }

      if (res.success) {
        showToast(res.message || 'Occupancy record saved.');
        setIsModalOpen(false);
        fetchAssociations(pagination.currentPage);
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
  const confirmDelete = (assoc: HouseResident) => {
    setDeleteTarget(assoc);
    setIsDeleteOpen(true);
  };

  // Delete Action handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await houseResidentService.deleteHouseResident(deleteTarget.id);
      if (res.success) {
        showToast(res.message || 'Occupancy mapping cleared.');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        // Page adjustment if last item deleted
        const isLastItem = associations.length === 1;
        const targetPage = isLastItem && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
        fetchAssociations(targetPage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to clear occupancy association.'
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
          <h1 className="text-2xl font-bold text-base-content m-0">House Residents (Occupancies)</h1>
          <p className="text-sm text-base-content/60">Map residents to houses and manage occupancy timelines.</p>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Occupant
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

      {/* Filtering and Table layout */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-6">

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by resident name or house number..."
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

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="select select-sm select-bordered w-40 focus:outline-primary"
              >
                <option value="">All Occupancy States</option>
                <option value="1">Active Occupant</option>
                <option value="0">Inactive / Moved</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            {loading && associations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-sm text-base-content/60">Fetching occupancy associations...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>House Location</th>
                    <th>Resident Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.length > 0 ? (
                    associations.map((assoc) => (
                      <tr key={assoc.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                        <td>
                          <div className="font-bold text-sm text-primary">
                            {assoc.house?.house_number || `House ID #${assoc.house_id}`}
                          </div>
                          <div className="text-xs text-base-content/50 truncate max-w-xs" title={assoc.house?.address}>
                            {assoc.house?.address}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold text-sm">
                            {assoc.resident?.full_name || `Resident ID #${assoc.resident_id}`}
                          </div>
                          <div className="text-xs text-base-content/50">
                            {assoc.resident?.phone_number} •{' '}
                            <span className="capitalize">{assoc.resident?.resident_status}</span>
                          </div>
                        </td>
                        <td className="text-xs font-semibold">{assoc.start_date}</td>
                        <td className="text-xs font-semibold">
                          {assoc.end_date ? (
                            assoc.end_date
                          ) : (
                            <span className="text-base-content/30 font-normal italic">Present</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge-sm font-semibold ${assoc.is_active
                            ? 'badge-success text-white'
                            : 'badge-ghost text-base-content/40'
                            }`}>
                            {assoc.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-xs text-primary font-bold mr-1 hover:bg-primary/10"
                            onClick={() => openEditModal(assoc)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error font-bold hover:bg-error/10"
                            onClick={() => confirmDelete(assoc)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-base-content/50">
                        No occupancy mappings found. Create one to map a resident.
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
                  onClick={() => fetchAssociations(pagination.currentPage - 1)}
                >
                  &laquo; Prev
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-xs ${p === pagination.currentPage ? 'btn-primary text-white' : 'btn-outline'}`}
                    onClick={() => fetchAssociations(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === pagination.lastPage || loading}
                  onClick={() => fetchAssociations(pagination.currentPage + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HouseResident Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box max-w-md border border-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4">
              {modalType === 'create' ? 'Assign House Occupant' : 'Edit Occupancy Records'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Select Resident */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Resident *</span>
                </label>
                <select
                  value={residentId}
                  onChange={(e) => setResidentId(Number(e.target.value))}
                  className={`select select-bordered select-sm w-full focus:outline-primary ${fieldErrors.resident_id ? 'select-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                >
                  <option value="">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.resident_status === 'permanent' ? 'Permanent' : 'Contract'})
                    </option>
                  ))}
                </select>
                {fieldErrors.resident_id && (
                  <p className="text-error text-xs mt-1">{fieldErrors.resident_id[0]}</p>
                )}
              </div>

              {/* Select House */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">House Unit *</span>
                </label>
                <select
                  value={houseId}
                  onChange={(e) => setHouseId(Number(e.target.value))}
                  className={`select select-bordered select-sm w-full focus:outline-primary ${fieldErrors.house_id ? 'select-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                >
                  <option value="">-- Choose House Unit --</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.house_number} ({h.occupancy_status === 'occupied' ? 'Occupied' : 'Vacant'})
                    </option>
                  ))}
                </select>
                {fieldErrors.house_id && (
                  <p className="text-error text-xs mt-1">{fieldErrors.house_id[0]}</p>
                )}
              </div>

              {/* Start Date */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Start Date *</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.start_date ? 'input-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.start_date && (
                  <p className="text-error text-xs mt-1">{fieldErrors.start_date[0]}</p>
                )}
              </div>

              {/* End Date (Conditional field - only visible and required when resident is under contract) */}
              {isContractResident && (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-error">
                      End Date (Required for Contract Residents) *
                    </span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.end_date ? 'input-error' : ''
                      }`}
                    disabled={submitLoading}
                    required
                  />
                  {fieldErrors.end_date && (
                    <p className="text-error text-xs mt-1">{fieldErrors.end_date[0]}</p>
                  )}
                </div>
              )}

              {/* Occupant Status is_active checkbox toggle */}
              <div className="form-control">
                <label className="label cursor-pointer flex justify-start gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="checkbox checkbox-primary checkbox-sm"
                    disabled={submitLoading}
                  />
                  <span className="label-text font-semibold text-xs">Is Active Occupant</span>
                </label>
                {fieldErrors.is_active && (
                  <p className="text-error text-xs mt-1">{fieldErrors.is_active[0]}</p>
                )}
              </div>

              {/* Form Buttons */}
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
                    'Save Assignment'
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
            <h3 className="font-bold text-lg text-base-content m-0">Remove Assignment</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-6">
              Are you sure you want to remove the occupancy assignment for{' '}
              <strong>
                {deleteTarget?.resident?.full_name || `Resident ID #${deleteTarget?.resident_id}`}
              </strong>{' '}
              at house{' '}
              <strong>
                {deleteTarget?.house?.house_number || `House ID #${deleteTarget?.house_id}`}
              </strong>
              ? This action cannot be undone.
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
                {loading ? 'Deleting...' : 'Delete Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HouseResidents;
