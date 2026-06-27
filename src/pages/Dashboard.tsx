import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import reportService from '../services/reportService';
import type { DetailedReportData } from '../services/reportService';
import houseService from '../services/houseService';
import residentService from '../services/residentService';
import houseResidentService from '../services/houseResidentService';
import paymentBillService from '../services/paymentBillService';
import type { PaymentBill } from '../services/paymentBillService';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Statistics States
  const [totalHouses, setTotalHouses] = useState<number>(0);
  const [totalResidents, setTotalResidents] = useState<number>(0);
  const [activeOccupancies, setActiveOccupancies] = useState<number>(0);
  const [pendingInvoices, setPendingInvoices] = useState<number>(0);

  // Financial Summary States
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [remainingBalance, setRemainingBalance] = useState<number>(0);

  // Financial Report State (Annual)
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [chartData, setChartData] = useState<{
    income: number[];
    expense: number[];
  }>({
    income: Array(12).fill(0),
    expense: Array(12).fill(0),
  });

  // Detailed Monthly Report States
  const [detailMonth, setDetailMonth] = useState<string>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  const [detailReport, setDetailReport] = useState<DetailedReportData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Recent Unpaid Bills
  const [recentBills, setRecentBills] = useState<PaymentBill[]>([]);

  // UI States
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch metrics counts
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [housesRes, residentsRes, occupanciesRes, billsRes] = await Promise.all([
        houseService.getHouses({}, 1, 1),
        residentService.getResidents({}, 1, 1),
        houseResidentService.getHouseResidents({ is_active: true }, 1, 1),
        paymentBillService.getPaymentBills({ status: 'unpaid' }, 1, 5), // Fetch top 5 unpaid
      ]);

      if (housesRes.success && housesRes.data.meta) {
        setTotalHouses(housesRes.data.meta.total);
      }
      if (residentsRes.success && residentsRes.data.meta) {
        setTotalResidents(residentsRes.data.meta.total);
      }
      if (occupanciesRes.success && occupanciesRes.data.meta) {
        setActiveOccupancies(occupanciesRes.data.meta.total);
      }
      if (billsRes.success) {
        if (billsRes.data.meta) {
          setPendingInvoices(billsRes.data.meta.total);
        }
        setRecentBills(billsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch report data for chart
  const fetchReport = async (year: string) => {
    setLoadingChart(true);
    setErrorMessage(null);
    try {
      const res = await reportService.getSummaryReport({ month: `${year}-01` });
      if (res.success && res.data) {
        const incomeArr = Array(12).fill(0);
        const expenseArr = Array(12).fill(0);

        res.data.income.forEach((item) => {
          const idx = item.month - 1;
          if (idx >= 0 && idx < 12) {
            incomeArr[idx] = Number(item.total_income);
          }
        });

        res.data.expense.forEach((item) => {
          const idx = item.month - 1;
          if (idx >= 0 && idx < 12) {
            expenseArr[idx] = Number(item.total_expense);
          }
        });

        setChartData({
          income: incomeArr,
          expense: expenseArr,
        });

        // Store overall financial figures
        setTotalIncome(res.data.total_income || 0);
        setTotalExpense(res.data.total_expense || 0);
        setRemainingBalance(res.data.remaining_balance || 0);
      } else {
        setErrorMessage(res.message || 'Failed to fetch financial report summary.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to connect to report API.'
      );
    } finally {
      setLoadingChart(false);
    }
  };

  // Fetch detailed monthly report data
  const fetchDetailedReport = async (monthStr: string) => {
    setLoadingDetail(true);
    try {
      const res = await reportService.getMonthlyDetailReport({ month: monthStr });
      if (res.success && res.data) {
        setDetailReport(res.data);
      }
    } catch (err) {
      console.error('Failed to load detailed monthly report:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReport(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    fetchDetailedReport(detailMonth);
  }, [detailMonth]);

  // Format currency helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Months labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Individual chart datasets configuration
  const incomeChartData = {
    labels: months,
    datasets: [
      {
        label: 'Penerimaan Iuran',
        data: chartData.income,
        borderColor: '#10B981', // Emerald green
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#10B981',
        pointHoverRadius: 6,
      },
    ],
  };

  const expenseChartData = {
    labels: months,
    datasets: [
      {
        label: 'Pengeluaran Operasional',
        data: chartData.expense,
        borderColor: '#EF4444', // Rose red
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#EF4444',
        pointHoverRadius: 6,
      },
    ],
  };

  // Chart JS Options (shared options)
  const chartOptions = (datasetLabel: string) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Turn off legend inside chart area for clean minimal look
      },
      tooltip: {
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: {
          family: 'Outfit, Inter, sans-serif',
          size: 13,
        },
        bodyFont: {
          family: 'Outfit, Inter, sans-serif',
          size: 13,
        },
        callbacks: {
          label: (context: any) => {
            const val = context.parsed.y || 0;
            return `${datasetLabel}: ${formatCurrency(val)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.06)',
        },
        ticks: {
          color: 'currentColor',
          font: {
            family: 'Outfit, Inter, sans-serif',
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(156, 163, 175, 0.06)',
        },
        ticks: {
          color: 'currentColor',
          font: {
            family: 'Outfit, Inter, sans-serif',
            size: 10,
          },
          callback: (value: any) => {
            if (value >= 1e6) {
              return `${(value / 1e6).toFixed(1)}M`;
            }
            if (value >= 1e3) {
              return `${(value / 1e3).toFixed(0)}k`;
            }
            return value;
          },
        },
      },
    },
  });

  // Helper format billing period
  const formatPeriod = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthsNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthsNames[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  const getNetBalance = () => {
    if (!detailReport) return 0;
    return detailReport.total_income - detailReport.total_expense;
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary text-primary-content rounded-3xl p-6 md:p-8 mb-8 shadow-lg">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 pointer-events-none flex items-center justify-center pr-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-64 h-64 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="max-w-xl">
          {/* <span className="badge badge-accent font-bold mb-3">Panel Kontrol GriyaHub</span> */}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            Selamat Datang, Admin!
          </h1>
          <p className="text-primary-content/85 text-sm md:text-base mb-4 leading-relaxed">
            Monitor data hunian rumah, status pembayaran iuran warga, catat pengeluaran operasional, serta pantau grafik kesehatan keuangan perumahan secara real-time.
          </p>
          <div className="flex gap-2">
            <button onClick={() => { fetchStats(); fetchDetailedReport(detailMonth); fetchReport(selectedYear); }} className="btn btn-accent btn-sm shadow-md gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
              </svg>
              Segarkan Data
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="mb-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-base-content/60 m-0">Ringkasan Kas & Keuangan</h2>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Saldo Kas Perumahan */}
        <div className="card bg-base-100 shadow border-2 border-primary/20 hover:border-primary transition-all">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Sisa Saldo Kas</span>
                {loadingChart ? (
                  <div className="h-9 w-28 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1 text-primary">{formatCurrency(remainingBalance)}</p>
                )}
              </div>
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h.007m-.008-.005h-.006V4.5h.007zm0 15h.007m-.008-.005h-.006v-.001h.007zm0-3h.007m-.008-.005h-.006V16.5h.007zm0-3h.007m-.008-.005h-.006v-.001h.007zm0-3h.007m-.008-.005h-.006V10.5h.007zm0-3h.007m-.008-.005h-.006v-.001h.007zm16.5 0h.008v.007h-.008V4.5zm0 15h.008v.007h-.008v-.007zm0-3h.008v.007h-.008V16.5zm0-3h.008v.007h-.008v-.007zm0-3h.008v.007h-.008V10.5zm0-3h.008v.007h-.008v-.007zm-12-6a2.25 2.25 0 00-2.25 2.25v13.5a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5h-15zM7.5 12a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-base-content/40 font-semibold block">Total dana kas bersih perumahan</div>
          </div>
        </div>

        {/* Total Pendapatan */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Total Pendapatan</span>
                {loadingChart ? (
                  <div className="h-9 w-28 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1 text-success">{formatCurrency(totalIncome)}</p>
                )}
              </div>
              <div className="p-2.5 bg-success/10 rounded-xl text-success">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-base-content/40 font-semibold block">Pembayaran iuran warga terbayar</div>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Total Pengeluaran</span>
                {loadingChart ? (
                  <div className="h-9 w-28 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1 text-error">{formatCurrency(totalExpense)}</p>
                )}
              </div>
              <div className="p-2.5 bg-error/10 rounded-xl text-error">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-base-content/40 font-semibold block">Pengeluaran kas operasional & gaji</div>
          </div>
        </div>

        {/* Tagihan Belum Lunas */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Tagihan Belum Lunas</span>
                {loadingStats ? (
                  <div className="h-9 w-12 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1 text-warning">{pendingInvoices}</p>
                )}
              </div>
              <div className="p-2.5 bg-warning/10 rounded-xl text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-warning font-semibold block">Outstanding tagihan warga</div>
          </div>
        </div>
      </section>

      {/* General Stats Section */}
      <div className="mb-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-base-content/60 m-0">Statistik Unit & Hunian</h2>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Total Rumah */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Total Rumah</span>
                {loadingStats ? (
                  <div className="h-9 w-12 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1">{totalHouses}</p>
                )}
              </div>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-base-content/40 font-semibold block">Kavling rumah terdaftar</div>
          </div>
        </div>

        {/* Total Penghuni */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Total Penghuni</span>
                {loadingStats ? (
                  <div className="h-9 w-12 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1">{totalResidents}</p>
                )}
              </div>
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-base-content/40 font-semibold block">Profil penghuni terverifikasi</div>
          </div>
        </div>

        {/* Rumah Terisi */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-base-content/60 text-xs font-semibold uppercase tracking-wider">Rumah Terisi</span>
                {loadingStats ? (
                  <div className="h-9 w-12 bg-base-300 animate-pulse rounded-lg mt-1"></div>
                ) : (
                  <p className="text-2xl font-extrabold mt-1">{activeOccupancies}</p>
                )}
              </div>
              <div className="p-2 bg-success/10 rounded-lg text-success">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="mt-3 text-xs text-base-content/40 font-semibold block">Rumah dengan hunian aktif</div>
          </div>
        </div>
      </section>

      {/* Control Filter Bar */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-base-content m-0">Aliran Keuangan Tahunan</h2>
          <p className="text-xs text-base-content/50 mt-0.5">Ikhtisar aliran keuangan tahunan (Grafik Ringkasan).</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="select select-sm select-bordered font-bold text-xs focus:outline-primary w-32"
          disabled={loadingChart}
        >
          <option value="2026">Tahun 2026</option>
          <option value="2025">Tahun 2025</option>
          <option value="2024">Tahun 2024</option>
        </select>
      </div>

      {errorMessage && (
        <div className="alert alert-error text-white text-xs py-2 px-3 mb-6 shadow">
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: 2 Separate Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Income Chart Card */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider m-0">Penerimaan & Iuran</h3>
              </div>
              <p className="text-xs text-base-content/50 mt-0.5">Akumulasi pembayaran tagihan iuran tahunan yang lunas.</p>
            </div>

            <div className="h-[220px] w-full relative">
              {loadingChart && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/50 z-10">
                  <span className="loading loading-spinner loading-md text-emerald-500"></span>
                </div>
              )}
              <Line data={incomeChartData} options={chartOptions('Penerimaan')} />
            </div>
          </div>
        </div>

        {/* Expense Chart Card */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider m-0">Pengeluaran Operasional</h3>
              </div>
              <p className="text-xs text-base-content/50 mt-0.5">Akumulasi biaya operasional & gaji yang tercatat.</p>
            </div>

            <div className="h-[220px] w-full relative">
              {loadingChart && (
                <div className="absolute inset-0 flex items-center justify-center bg-base-100/50 z-10">
                  <span className="loading loading-spinner loading-md text-rose-500"></span>
                </div>
              )}
              <Line data={expenseChartData} options={chartOptions('Pengeluaran')} />
            </div>
          </div>
        </div>

      </section>

      {/* Monthly Detailed Transaction Section */}
      <div className="card bg-base-100 shadow border border-base-200 mb-8">
        <div className="card-body p-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-base-content m-0">Detail Transaksi Bulanan</h2>
                {detailReport && (
                  <span className={`badge font-bold px-2.5 py-1 text-xs border ${getNetBalance() >= 0
                      ? 'badge-success text-success bg-success/10 border-success/20'
                      : 'badge-error text-error bg-error/10 border-error/20'
                    }`}>
                    Saldo Bersih: {formatCurrency(getNetBalance())}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">Rincian detail transaksi (Pemasukan vs Pengeluaran) untuk audit pelaporan perumahan.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-base-content/60">Bulan Target:</span>
              <input
                type="month"
                value={detailMonth}
                onChange={(e) => setDetailMonth(e.target.value)}
                className="input input-sm input-bordered focus:outline-primary font-bold w-40"
                disabled={loadingDetail}
              />
            </div>
          </div>

          {loadingDetail && !detailReport ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <span className="text-xs text-base-content/50">Mengambil rincian data audit bulanan...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
              {loadingDetail && (
                <div className="absolute inset-0 bg-base-100/40 z-10 flex items-center justify-center">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              )}

              {/* Collections Column (Left) */}
              <div className="p-4 rounded-2xl bg-base-200/15 border border-base-200 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex justify-between items-center border-b border-base-200 pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Penerimaan Bulanan</span>
                    <span className="badge badge-sm font-semibold badge-ghost">Tagihan Lunas</span>
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="table table-xs w-full">
                      <thead>
                        <tr>
                          <th>Tanggal Bayar</th>
                          <th>Penghuni</th>
                          <th>Jenis Iuran</th>
                          <th className="text-right">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailReport && detailReport.incomes.length > 0 ? (
                          detailReport.incomes.map((income) => (
                            <tr key={income.id} className="hover:bg-base-200/20">
                              <td className="text-xs text-base-content/65">
                                {income.paid_at ? new Date(income.paid_at).toLocaleDateString('id-ID', {
                                  month: 'short',
                                  day: 'numeric'
                                }) : '-'}
                              </td>
                              <td>
                                <div className="font-semibold text-xs text-base-content">
                                  {income.house_resident?.resident?.full_name || 'Penghuni'}
                                </div>
                                <div className="text-[10px] text-base-content/55">
                                  Rumah: {income.house_resident?.house?.house_number || '-'}
                                </div>
                              </td>
                              <td className="text-xs text-base-content/75">{income.fee_type?.name}</td>
                              <td className="font-bold text-xs text-emerald-500 text-right">
                                {formatCurrency(income.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-xs text-base-content/50">
                              Tidak ada transaksi penerimaan yang tercatat pada bulan ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-base-200 pt-3 mt-4 flex justify-between items-center">
                  <span className="text-xs font-bold text-base-content/60">Total Pemasukan:</span>
                  <span className="font-extrabold text-sm text-emerald-500">
                    {formatCurrency(detailReport?.total_income || 0)}
                  </span>
                </div>
              </div>

              {/* Expenses Column (Right) */}
              <div className="p-4 rounded-2xl bg-base-200/15 border border-base-200 flex flex-col justify-between min-h-[300px]">
                <div>
                  <div className="flex justify-between items-center border-b border-base-200 pb-3 mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Pengeluaran Bulanan</span>
                    <span className="badge badge-sm font-semibold badge-ghost">Catatan Pengeluaran</span>
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="table table-xs w-full">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>Nama Kebutuhan</th>
                          <th>Deskripsi</th>
                          <th className="text-right">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailReport && detailReport.expenses.length > 0 ? (
                          detailReport.expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-base-200/20">
                              <td className="text-xs text-base-content/65">
                                {expense.expense?.expense_date ? new Date(expense.expense.expense_date).toLocaleDateString('id-ID', {
                                  month: 'short',
                                  day: 'numeric'
                                }) : '-'}
                              </td>
                              <td className="font-semibold text-xs text-base-content">
                                {expense.title}
                              </td>
                              <td className="text-[10px] text-base-content/60 max-w-[130px] truncate" title={expense.expense?.notes}>
                                {expense.expense?.notes || '-'}
                              </td>
                              <td className="font-bold text-xs text-rose-500 text-right">
                                {formatCurrency(expense.amount)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-10 text-xs text-base-content/50">
                              Tidak ada transaksi pengeluaran yang tercatat pada bulan ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-base-200 pt-3 mt-4 flex justify-between items-center">
                  <span className="text-xs font-bold text-base-content/60">Total Pengeluaran:</span>
                  <span className="font-extrabold text-sm text-rose-500">
                    {formatCurrency(detailReport?.total_expense || 0)}
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Grid: Unpaid Invoices List & Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Table Panel: Unpaid Bills */}
        <div className="card bg-base-100 shadow border border-base-200 lg:col-span-2">
          <div className="card-body p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-base-content m-0">Tagihan Tertunggak Terbaru</h2>
              <p className="text-xs text-base-content/60">Daftar tagihan iuran warga yang belum terbayar.</p>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-200">
                    <th>Penghuni</th>
                    <th>Rumah</th>
                    <th>Jenis Iuran</th>
                    <th>Periode</th>
                    <th className="text-right">Total Tunggakan</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBills.length > 0 ? (
                    recentBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-base-200/20 border-b border-base-200 transition-colors">
                        <td>
                          <span className="font-semibold text-sm">
                            {bill.house_resident?.resident?.full_name || `Penghuni ID #${bill.house_resident?.resident_id}`}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-sm font-semibold badge-ghost">
                            {bill.house_resident?.house?.house_number}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-base-content/85">{bill.fee_type?.name}</span>
                        </td>
                        <td className="text-xs text-base-content/60">
                          {formatPeriod(bill.billing_month.substring(0, 7))}
                        </td>
                        <td className="font-bold text-sm text-error text-right">
                          {formatCurrency(bill.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-base-content/50">
                        Tidak ada tagihan tertunggak yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widget: Quick Actions */}
        <div className="card bg-base-100 shadow border border-base-200">
          <div className="card-body p-6">
            <h2 className="text-lg font-bold text-base-content mb-1">Aksi Cepat</h2>
            <p className="text-xs text-base-content/60 mb-4">Pintasan cepat untuk manajemen administrasi.</p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/expenses/create')}
                className="btn btn-outline btn-primary btn-sm justify-start gap-3 w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Catat Pengeluaran Kas
              </button>
              <button
                onClick={() => navigate('/payment-bills')}
                className="btn btn-outline btn-secondary btn-sm justify-start gap-3 w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Buat Tagihan Iuran
              </button>
              <button
                onClick={() => navigate('/residents')}
                className="btn btn-outline btn-accent btn-sm justify-start gap-3 w-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Daftarkan Penghuni Baru
              </button>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};

export default Dashboard;
