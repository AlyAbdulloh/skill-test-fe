import React, { useState, useEffect, useCallback } from 'react';
import paymentBillService from '../services/paymentBillService';
import houseResidentService from '../services/houseResidentService';
import feeTypeService from '../services/feeTypeService';
import type { PaymentBill, PaymentBillFilters } from '../services/paymentBillService';
import type { HouseResident } from '../services/houseResidentService';
import type { FeeType } from '../services/feeTypeService';

export const PaymentBills: React.FC = () => {
  // Lists & Pagination
  const [bills, setBills] = useState<PaymentBill[]>([]);
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
  const [houseResidents, setHouseResidents] = useState<HouseResident[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);

  // State Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'paid' | 'unpaid' | ''>('');
  const [feeTypeFilter, setFeeTypeFilter] = useState<number | ''>('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Form Fields
  const [houseResidentId, setHouseResidentId] = useState<number | ''>('');
  const [feeTypeId, setFeeTypeId] = useState<number | ''>('');
  const [amountPerMonth, setAmountPerMonth] = useState<number | ''>('');
  const [paidAt, setPaidAt] = useState('');
  const [isMultiMonth, setIsMultiMonth] = useState(false);
  const [singleMonth, setSingleMonth] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // Delete Confirmation Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentBill | null>(null);

  // Debounce search filter by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Bills from Backend
  const fetchBills = useCallback(async (page = 1) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const filters: PaymentBillFilters = {
        search: debouncedSearch,
        status: statusFilter,
        fee_type_id: feeTypeFilter,
      };
      const response = await paymentBillService.getPaymentBills(filters, page, pagination.perPage);
      if (response.success && response.data) {
        setBills(response.data.data);
        if (response.data.meta) {
          setPagination({
            currentPage: response.data.meta.current_page,
            lastPage: response.data.meta.last_page,
            total: response.data.meta.total,
            perPage: response.data.meta.per_page,
          });
        }
      } else {
        setErrorMessage(response.message || 'Failed to fetch payment bills.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to connect to the backend server.'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, feeTypeFilter, pagination.perPage]);

  // Load dropdown lists once on mount
  const fetchFormSourceData = async () => {
    try {
      // Query house residents (retrieve up to 100 active)
      const hrRes = await houseResidentService.getHouseResidents({ is_active: true }, 1, 100);
      if (hrRes.success && hrRes.data) {
        setHouseResidents(hrRes.data.data);
      }

      // Query fee types (retrieve up to 100 active)
      const ftRes = await feeTypeService.getFeeTypes({ is_active: true }, 1, 100);
      if (ftRes.success && ftRes.data) {
        setFeeTypes(ftRes.data.data);
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
    fetchBills(1);
  }, [debouncedSearch, statusFilter, feeTypeFilter]);

  // Handle selected FeeType changes to default the amount and billing cycle checks
  useEffect(() => {
    if (feeTypeId) {
      const selectedFee = feeTypes.find((f) => f.id === Number(feeTypeId));
      if (selectedFee) {
        setAmountPerMonth(selectedFee.amount);
      } else {
        setAmountPerMonth('');
      }
    } else {
      setAmountPerMonth('');
    }
  }, [feeTypeId, feeTypes]);

  // Helper: Format timezone-safe billing month to "Month Year" (e.g. "June 2026")
  const formatPeriod = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  // Helper: Format currency to IDR
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Helper: Generate list of YYYY-MM strings between start and end inclusive
  const getMonthsBetween = (startStr: string, endStr: string): string[] => {
    const months: string[] = [];
    const [startYear, startMonth] = startStr.split('-').map(Number);
    const [endYear, endMonth] = endStr.split('-').map(Number);

    let currentYear = startYear;
    let currentMonth = startMonth;

    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      const formattedMonth = String(currentMonth).padStart(2, '0');
      months.push(`${currentYear}-${formattedMonth}`);

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    return months;
  };

  // Toast alert trigger
  const showToast = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setHouseResidentId('');
    setFeeTypeId('');
    setAmountPerMonth('');
    // Default single month, start/end months to current year/month
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSingleMonth(currentYearMonth);
    setStartMonth(currentYearMonth);
    setEndMonth(currentYearMonth);
    setPaidAt(now.toISOString().split('T')[0]);
    setIsMultiMonth(false);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  // Submit Handler (Create Bill)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseResidentId || !feeTypeId || !amountPerMonth || !paidAt) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    let calculatedMonths: string[] = [];
    if (isMultiMonth) {
      if (!startMonth || !endMonth) {
        setErrorMessage('Please select start and end months.');
        return;
      }
      if (startMonth > endMonth) {
        setErrorMessage('Bulan selesai tidak boleh lebih awal dari bulan mulai.');
        return;
      }
      calculatedMonths = getMonthsBetween(startMonth, endMonth);
    } else {
      if (!singleMonth) {
        setErrorMessage('Please select billing month.');
        return;
      }
      calculatedMonths = [singleMonth];
    }

    setSubmitLoading(true);
    setFieldErrors({});
    setErrorMessage(null);

    const payload = {
      house_resident_id: Number(houseResidentId),
      fee_type_id: Number(feeTypeId),
      amount_per_month: Number(amountPerMonth),
      months: calculatedMonths,
      paid_at: paidAt,
    };

    try {
      const res = await paymentBillService.createPaymentBills(payload);
      if (res.success) {
        showToast(res.message || 'Pembayaran berhasil disimpan');
        setIsModalOpen(false);
        fetchBills(1);
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

  // Record Pay action handler
  const handleRecordPay = async (billId: number) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await paymentBillService.updatePaymentBill(billId, {
        status: 'paid',
        paid_at: todayStr,
      });
      if (res.success) {
        showToast('Status tagihan iuran berhasil diubah menjadi Paid.');
        fetchBills(pagination.currentPage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to update payment status.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Open Delete Confirmation
  const confirmDelete = (bill: PaymentBill) => {
    setDeleteTarget(bill);
    setIsDeleteOpen(true);
  };

  // Delete Action handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await paymentBillService.deletePaymentBill(deleteTarget.id);
      if (res.success) {
        showToast('Tagihan iuran berhasil dihapus.');
        setIsDeleteOpen(false);
        setDeleteTarget(null);
        // Page adjustment if last item deleted
        const isLastItem = bills.length === 1;
        const targetPage = isLastItem && pagination.currentPage > 1 ? pagination.currentPage - 1 : pagination.currentPage;
        fetchBills(targetPage);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to delete payment bill.'
      );
      setIsDeleteOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const isMonthlyFeeType = true;

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
          <h1 className="text-2xl font-bold text-base-content m-0">Payment Bills</h1>
          <p className="text-sm text-base-content/60">Issue invoices, record payments, and track household collections.</p>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Issue Bill
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

      {/* Stats Summary (Calculated from current page list) */}
      {/* <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <span className="text-xs text-base-content/50 font-semibold block uppercase">Page Collected</span>
          <span className="text-2xl font-black mt-1 text-success">
            {formatCurrency(collectedAmount)}
          </span>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <span className="text-xs text-base-content/50 font-semibold block uppercase">Page Outstanding</span>
          <span className="text-2xl font-black mt-1 text-error">
            {formatCurrency(unpaidAmount)}
          </span>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200 p-4">
          <span className="text-xs text-base-content/50 font-semibold block uppercase">Page Invoices Count</span>
          <span className="text-2xl font-black mt-1 text-primary">
            {totalCount} Invoices
          </span>
        </div>
      </section> */}

      {/* Bills Listing */}
      <div className="card bg-base-100 shadow border border-base-200">
        <div className="card-body p-6">

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={feeTypeFilter}
                onChange={(e) => setFeeTypeFilter(e.target.value ? Number(e.target.value) : '')}
                className="select select-sm select-bordered w-full sm:w-44 focus:outline-primary"
              >
                <option value="">All Dues Types</option>
                {feeTypes.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="select select-sm select-bordered w-full sm:w-44 focus:outline-primary"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
              <input
                type="text"
                placeholder="Search resident or house..."
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
            {loading && bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <span className="text-sm text-base-content/60">Fetching bills...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>Invoice No.</th>
                    <th>Resident</th>
                    <th>Bill Type</th>
                    <th>Period</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length > 0 ? (
                    bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                        <td className="font-semibold text-sm text-primary">
                          INV-{bill.id}-{bill.billing_month.substring(0, 7).replace('-', '')}
                        </td>
                        <td>
                          <div>
                            <div className="font-semibold text-sm">
                              {bill.house_resident?.resident?.full_name || `Resident ID #${bill.house_resident?.resident_id}`}
                            </div>
                            <div className="text-xs text-base-content/50">
                              House: {bill.house_resident?.house?.house_number}
                            </div>
                          </div>
                        </td>
                        <td className="text-sm font-medium">{bill.fee_type?.name}</td>
                        <td className="text-xs text-base-content/60">
                          {formatPeriod(bill.billing_month.substring(0, 7))}
                        </td>
                        <td className="font-bold text-sm">{formatCurrency(bill.amount)}</td>
                        <td>
                          <span className={`badge badge-sm font-semibold capitalize ${bill.status === 'paid' ? 'badge-success text-white' : 'badge-error text-white'
                            }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {bill.status === 'unpaid' && (
                            <button
                              onClick={() => handleRecordPay(bill.id)}
                              className="btn btn-ghost btn-xs text-primary font-bold mr-1 hover:bg-primary/10"
                            >
                              Record Pay
                            </button>
                          )}
                          <button
                            onClick={() => confirmDelete(bill)}
                            className="btn btn-ghost btn-xs text-error font-bold hover:bg-error/10"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-base-content/50">
                        No invoices found matching criteria.
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
                Showing Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} records total)
              </span>
              <div className="join">
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === 1 || loading}
                  onClick={() => fetchBills(pagination.currentPage - 1)}
                >
                  &laquo; Prev
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`join-item btn btn-xs ${p === pagination.currentPage ? 'btn-primary text-white' : 'btn-outline'}`}
                    onClick={() => fetchBills(p)}
                    disabled={loading}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="join-item btn btn-xs btn-outline"
                  disabled={pagination.currentPage === pagination.lastPage || loading}
                  onClick={() => fetchBills(pagination.currentPage + 1)}
                >
                  Next &raquo;
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Form Modal: Issue Bill */}
      {isModalOpen && (
        <div className="modal modal-open z-50 bg-black/60">
          <div className="modal-box max-w-md border border-base-200">
            <h3 className="font-bold text-lg text-base-content mb-4">Issue New Bill</h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Select House Resident */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Resident & House *</span>
                </label>
                <select
                  value={houseResidentId}
                  onChange={(e) => setHouseResidentId(Number(e.target.value))}
                  className={`select select-bordered select-sm w-full focus:outline-primary ${fieldErrors.house_resident_id ? 'select-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                >
                  <option value="">-- Choose Resident --</option>
                  {houseResidents.map((hr) => (
                    <option key={hr.id} value={hr.id}>
                      {hr.resident?.full_name} ({hr.house?.house_number})
                    </option>
                  ))}
                </select>
                {fieldErrors.house_resident_id && (
                  <p className="text-error text-xs mt-1">{fieldErrors.house_resident_id[0]}</p>
                )}
              </div>

              {/* Select Fee Type */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Fee Type *</span>
                </label>
                <select
                  value={feeTypeId}
                  onChange={(e) => setFeeTypeId(Number(e.target.value))}
                  className={`select select-bordered select-sm w-full focus:outline-primary ${fieldErrors.fee_type_id ? 'select-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                >
                  <option value="">-- Choose Fee Type --</option>
                  {feeTypes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.fee_type_id && (
                  <p className="text-error text-xs mt-1">{fieldErrors.fee_type_id[0]}</p>
                )}
              </div>

              {/* Amount Per Month */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Amount Per Month (IDR) *</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountPerMonth}
                  onChange={(e) => setAmountPerMonth(e.target.value ? Number(e.target.value) : '')}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.amount_per_month ? 'input-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.amount_per_month && (
                  <p className="text-error text-xs mt-1">{fieldErrors.amount_per_month[0]}</p>
                )}
              </div>

              {/* Multi Month Radio/Checkbox */}
              <div className="form-control border border-base-200 rounded-lg p-3 bg-base-200/20">
                <label className={`label cursor-pointer flex justify-start gap-3 py-1 ${!isMonthlyFeeType ? 'opacity-50 cursor-not-allowed' : ''
                  }`}>
                  <input
                    type="checkbox"
                    checked={isMultiMonth}
                    onChange={(e) => setIsMultiMonth(e.target.checked)}
                    className="checkbox checkbox-primary checkbox-sm"
                    disabled={submitLoading || !isMonthlyFeeType}
                  />
                  <div>
                    <span className="label-text font-semibold text-xs block">Bayar Multi Bulan</span>
                    {!isMonthlyFeeType && feeTypeId && (
                      <span className="text-[10px] text-base-content/50 block">
                        Hanya tersedia untuk tipe iuran bulanan (monthly).
                      </span>
                    )}
                  </div>
                </label>
              </div>

              {/* Month Pickers */}
              {isMultiMonth ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs">Bulan Mulai *</span>
                    </label>
                    <input
                      type="month"
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="input input-bordered input-sm focus:outline-primary w-full"
                      disabled={submitLoading}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-semibold text-xs">Bulan Selesai *</span>
                    </label>
                    <input
                      type="month"
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                      className="input input-bordered input-sm focus:outline-primary w-full"
                      disabled={submitLoading}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs">Bulan Tagihan *</span>
                  </label>
                  <input
                    type="month"
                    value={singleMonth}
                    onChange={(e) => setSingleMonth(e.target.value)}
                    className="input input-bordered input-sm focus:outline-primary w-full"
                    disabled={submitLoading}
                    required
                  />
                </div>
              )}
              {fieldErrors.months && (
                <p className="text-error text-xs mt-1">{fieldErrors.months[0]}</p>
              )}

              {/* Paid At */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs">Paid At *</span>
                </label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.paid_at ? 'input-error' : ''
                    }`}
                  disabled={submitLoading}
                  required
                />
                {fieldErrors.paid_at && (
                  <p className="text-error text-xs mt-1">{fieldErrors.paid_at[0]}</p>
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
                    'Save Bill'
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
            <h3 className="font-bold text-lg text-base-content m-0">Delete Bill</h3>
            <p className="text-sm text-base-content/60 mt-1 mb-6">
              Are you sure you want to delete the invoice for{' '}
              <strong>
                {deleteTarget?.house_resident?.resident?.full_name || `Resident ID #${deleteTarget?.house_resident?.resident_id}`}
              </strong>{' '}
              ({deleteTarget?.fee_type?.name} - {deleteTarget && formatPeriod(deleteTarget.billing_month.substring(0, 7))})? This action cannot be undone.
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
                {loading ? 'Deleting...' : 'Delete Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentBills;
