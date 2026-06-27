import React, { useState, useEffect, useCallback } from 'react';
import houseService from '../services/houseService';
import type { House, HouseFilters } from '../services/houseService';
import houseResidentService from '../services/houseResidentService';
import type { HouseResident } from '../services/houseResidentService';

export const Houses: React.FC = () => {
  // Lists & pagination
  const [houses, setHouses] = useState<House[]>([]);
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
  const [statusFilter, setStatusFilter] = useState<'occupied' | 'unoccupied' | ''>('');

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
  const [houseNumber, setHouseNumber] = useState('');
  const [address, setAddress] = useState('');
  const [occupancyStatus, setOccupancyStatus] = useState<'occupied' | 'unoccupied'>('unoccupied');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Delete Confirmation Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<House | null>(null);

  // Occupancy History Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<House | null>(null);
  const [historyList, setHistoryList] = useState<HouseResident[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Debounce search filter by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Houses from Backend
  const fetchHouses = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters: HouseFilters = {
        search: debouncedSearch,
        occupancy_status: statusFilter,
      };
      const response = await houseService.getHouses(filters, page, pagination.perPage);
      if (response.success && response.data) {
        setHouses(response.data.data);
        if (response.data.meta) {
          setPagination({
            currentPage: response.data.meta.current_page,
            lastPage: response.data.meta.last_page,
            total: response.data.meta.total,
            perPage: response.data.meta.per_page,
          });
        }
      } else {
        setErrorMessage(response.message || 'Gagal mengambil data rumah.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Gagal terhubung dengan server backend.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.perPage]);

  // Reload houses on filter / search changes
  useEffect(() => {
    fetchHouses(1);
  }, [debouncedSearch, statusFilter]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalType('create');
    setSelectedId(null);
    setHouseNumber('');
    setAddress('');
    setOccupancyStatus('unoccupied');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (house: House) => {
    setModalType('edit');
    setSelectedId(house.id);
    setHouseNumber(house.house_number);
    setAddress(house.address);
    setOccupancyStatus(house.occupancy_status);
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
      house_number: houseNumber,
      address,
      occupancy_status: occupancyStatus,
    };

    try {
      let res;
      if (modalType === 'create') {
        res = await houseService.createHouse(payload);
      } else {
        if (!selectedId) return;
        res = await houseService.updateHouse(selectedId, payload);
      }

      if (res.success) {
        showToast(res.message || 'Sukses!');
        setIsModalOpen(false);
        fetchHouses(pagination.currentPage);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
      } else {
        setErrorMessage(
          err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.'
        );
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Confirm Delete
  const confirmDelete = (house: House) => {
    setDeleteTarget(house);
    setIsDeleteOpen(true);
  };

  // Delete Action handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await houseService.deleteHouse(deleteTarget.id);
      if (res.success) {
        showToast(res.message || 'Data rumah berhasil dihapus.');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        // Page adjustment if last item deleted
        const isLastItem = houses.length === 1;
        const targetPage = isLastItem && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
        fetchHouses(targetPage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Gagal menghapus data rumah.'
      );
      setIsDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // View Occupancy History
  const viewHistory = async (house: House, page = 1) => {
    setHistoryTarget(house);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await houseResidentService.getHouseResidents({ house_id: house.id }, page, 5);
      if (res.success && res.data) {
        setHistoryList(res.data.data);
        if (res.data.meta) {
          setHistoryPagination({
            currentPage: res.data.meta.current_page,
            lastPage: res.data.meta.last_page,
            total: res.data.meta.total,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load occupancy history:', err);
    } finally {
      setHistoryLoading(false);
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
          <h1 className="text-2xl font-bold text-base-content m-0">Data Rumah & Properti</h1>
          <p className="text-sm text-base-content/60">Kelola, catat, dan periksa data hunian rumah di seluruh blok perumahan.</p>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Rumah
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

      {/* Stats Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4 flex flex-row items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span className="text-xs text-base-content/50 font-semibold block">Total Properti</span>
            <span className="text-xl font-bold">{pagination.total} Unit</span>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 p-4 flex flex-row items-center gap-4">
          <div className="p-3 bg-success/10 rounded-xl text-success">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <span className="text-xs text-base-content/50 font-semibold block">Rumah Dihuni</span>
            <span className="text-xl font-bold">
              {houses.filter((h) => h.occupancy_status === 'occupied').length} Aktif
            </span>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 p-4 flex flex-row items-center gap-4">
          <div className="p-3 bg-neutral/10 rounded-xl text-neutral-content">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-xs text-base-content/50 font-semibold block">Rumah Kosong</span>
            <span className="text-xl font-bold">
              {houses.filter((h) => h.occupancy_status === 'unoccupied').length} Kosong
            </span>
          </div>
        </div>
      </section>

      {/* Houses Table List Card */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-6">
          
          {/* Filtering controls */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari berdasarkan nomor rumah atau alamat..."
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
                <option value="">Semua Status Hunian</option>
                <option value="occupied">Dihuni</option>
                <option value="unoccupied">Kosong</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            {loading && houses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-sm text-base-content/60">Mengambil data properti...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>Nomor Rumah</th>
                    <th>Alamat Lengkap</th>
                    <th>Status Hunian</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.length > 0 ? (
                    houses.map((house) => (
                      <tr key={house.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                        <td className="font-bold text-sm text-primary">{house.house_number}</td>
                        <td className="text-sm text-base-content/85 max-w-sm truncate" title={house.address}>
                          {house.address}
                        </td>
                        <td>
                          <span className={`badge badge-sm font-semibold ${
                            house.occupancy_status === 'occupied' 
                              ? 'badge-primary' 
                              : 'badge-ghost text-base-content/60'
                          }`}>
                            {house.occupancy_status === 'occupied' ? 'Dihuni' : 'Kosong'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn btn-ghost btn-xs text-success font-bold mr-1 hover:bg-success/10"
                            onClick={() => viewHistory(house)}
                          >
                            Riwayat
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-primary font-bold mr-1 hover:bg-primary/10"
                            onClick={() => openEditModal(house)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error font-bold hover:bg-error/10"
                            onClick={() => confirmDelete(house)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-base-content/50">
                        Data rumah tidak ditemukan. Tambahkan rumah baru untuk memulai.
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
                Menampilkan Halaman {pagination.currentPage} dari {pagination.lastPage} (Total {pagination.total} data)
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === 1 || loading}
                  onClick={() => fetchHouses(pagination.currentPage - 1)}
                >
                  &laquo; Prev
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-xs ${p === pagination.currentPage ? 'btn-primary text-white' : 'btn-outline'}`}
                    onClick={() => fetchHouses(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === pagination.lastPage || loading}
                  onClick={() => fetchHouses(pagination.currentPage + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* House Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box max-w-md border border-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4">
              {modalType === 'create' ? 'Tambah Data Rumah' : 'Ubah Detail Rumah'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* House Number */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Nomor Rumah (Unik)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Blok A/12"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${
                    fieldErrors.house_number ? 'input-error' : ''
                  }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.house_number && (
                  <p className="text-error text-xs mt-1">{fieldErrors.house_number[0]}</p>
                )}
              </div>

              {/* Address */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Alamat Lengkap</span>
                </label>
                <textarea
                  placeholder="Masukkan alamat jalan lengkap dan detail"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`textarea textarea-bordered textarea-sm focus:outline-primary w-full h-20 ${
                    fieldErrors.address ? 'textarea-error' : ''
                  }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.address && (
                  <p className="text-error text-xs mt-1">{fieldErrors.address[0]}</p>
                )}
              </div>

              {/* Occupancy Status */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Status Hunian</span>
                </label>
                <select
                  value={occupancyStatus}
                  onChange={(e) => setOccupancyStatus(e.target.value as any)}
                  className="select select-bordered select-sm w-full focus:outline-primary"
                  disabled={submitLoading}
                >
                  <option value="unoccupied">Kosong (Belum Dihuni)</option>
                  <option value="occupied">Dihuni</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="modal-action border-t border-base-200 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-sm btn-ghost"
                  disabled={submitLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary text-white gap-2"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Detail'
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
            <h3 className="font-bold text-lg text-base-content m-0">Hapus Rumah</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-6">
              Apakah Anda yakin ingin menghapus rumah <strong>{deleteTarget?.house_number}</strong>? Tindakan ini akan menghapus riwayat data properti tersebut.
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
                {loading ? 'Menghapus...' : 'Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resident Occupancy History Modal */}
      {isHistoryOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box max-w-2xl border border-base-200">
            <div className="flex justify-between items-center mb-4 border-b border-base-200 pb-3">
              <h3 className="font-bold text-lg text-base-content m-0">
                Riwayat Hunian: {historyTarget?.house_number}
              </h3>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => {
                  setIsHistoryOpen(false);
                  setHistoryList([]);
                  setHistoryTarget(null);
                }}
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <span className="text-xs text-base-content/60">Mengambil riwayat penghuni...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto w-full max-h-72">
                  <table className="table table-compact w-full">
                    <thead>
                      <tr className="border-b border-base-200">
                        <th>Nama Penghuni</th>
                        <th>Nomor Telepon</th>
                        <th>Tanggal Mulai</th>
                        <th>Tanggal Selesai</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.length > 0 ? (
                        historyList.map((history) => (
                          <tr key={history.id} className="border-b border-base-200">
                            <td className="font-semibold text-sm">
                              {history.resident?.full_name || `Penghuni ID #${history.resident_id}`}
                            </td>
                            <td className="text-xs">{history.resident?.phone_number || '-'}</td>
                            <td className="text-xs">{history.start_date}</td>
                            <td className="text-xs">{history.end_date || 'Sekarang (Aktif)'}</td>
                            <td>
                              <span className={`badge badge-xs font-bold ${
                                history.is_active ? 'badge-success text-white' : 'badge-ghost text-base-content/40'
                              }`}>
                                {history.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-base-content/40 italic text-xs">
                            Belum ada riwayat hunian yang tercatat untuk rumah ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* History Pagination */}
                {historyPagination.lastPage > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-base-200">
                    <span className="text-[10px] text-base-content/50">
                      Menampilkan Halaman {historyPagination.currentPage} dari {historyPagination.lastPage}
                    </span>
                    <div className="join">
                      <button
                        className="join-item btn btn-[10px] btn-outline h-7 min-h-0 px-2"
                        disabled={historyPagination.currentPage === 1}
                        onClick={() => historyTarget && viewHistory(historyTarget, historyPagination.currentPage - 1)}
                      >
                        &laquo; Prev
                      </button>
                      <button
                        className="join-item btn btn-[10px] btn-outline h-7 min-h-0 px-2"
                        disabled={historyPagination.currentPage === historyPagination.lastPage}
                        onClick={() => historyTarget && viewHistory(historyTarget, historyPagination.currentPage + 1)}
                      >
                        Next &raquo;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Houses;
