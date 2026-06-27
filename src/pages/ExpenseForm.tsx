import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import expenseService from '../services/expenseService';
import type { ExpenseDetail, ExpensePayload } from '../services/expenseService';

export const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Form Fields
  const [expenseDate, setExpenseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [details, setDetails] = useState<ExpenseDetail[]>([
    { title: '', amount: 0 }
  ]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Fetch expense details if in Edit Mode
  useEffect(() => {
    if (isEditMode) {
      const fetchExpense = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
          const res = await expenseService.getExpenseById(Number(id));
          if (res.success && res.data) {
            setExpenseDate(res.data.expense_date.substring(0, 10)); // Format YYYY-MM-DD
            setNotes(res.data.notes);
            setDetails(res.data.details.map(d => ({
              id: d.id,
              title: d.title,
              amount: Number(d.amount)
            })));
          } else {
            setErrorMessage(res.message || 'Failed to retrieve expense data.');
          }
        } catch (err: any) {
          console.error(err);
          setErrorMessage(
            err.response?.data?.message || 'Failed to connect to the backend server.'
          );
        } finally {
          setLoading(false);
        }
      };

      fetchExpense();
    } else {
      // Default to current date in Local Time Zone
      const today = new Date().toISOString().split('T')[0];
      setExpenseDate(today);
    }
  }, [id, isEditMode]);

  // Handle modification of detail items row
  const handleDetailChange = (index: number, field: keyof ExpenseDetail, value: string | number) => {
    setDetails(prevDetails => {
      const updated = [...prevDetails];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });

    // Clear specific field errors when user corrects inputs
    const errorKey = `details.${index}.${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors(prevErrors => {
        const cleaned = { ...prevErrors };
        delete cleaned[errorKey];
        return cleaned;
      });
    }
  };

  // Add a blank detail row
  const handleAddRow = () => {
    setDetails(prevDetails => [...prevDetails, { title: '', amount: 0 }]);
  };

  // Remove a detail row by index
  const handleRemoveRow = (index: number) => {
    if (details.length <= 1) {
      return; // Must have at least one detail row
    }
    setDetails(prevDetails => prevDetails.filter((_, idx) => idx !== index));

    // Readjust indices in fieldErrors if any existed
    setFieldErrors(prevErrors => {
      const updatedErrors: Record<string, string[]> = {};
      Object.entries(prevErrors).forEach(([key, val]) => {
        const match = key.match(/^details\.(\d+)\.(title|amount)$/);
        if (match) {
          const rowIdx = parseInt(match[1], 10);
          const fieldName = match[2];
          if (rowIdx < index) {
            updatedErrors[key] = val;
          } else if (rowIdx > index) {
            updatedErrors[`details.${rowIdx - 1}.${fieldName}`] = val;
          }
        } else if (!key.startsWith('details.')) {
          updatedErrors[key] = val;
        }
      });
      return updatedErrors;
    });
  };

  // Calculate live total amount
  const calculateTotal = () => {
    return details.reduce((acc, detail) => acc + Number(detail.amount || 0), 0);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side validations
    if (!expenseDate) {
      setErrorMessage('Expense Date is required.');
      return;
    }
    if (!notes.trim()) {
      setErrorMessage('Expense Notes are required.');
      return;
    }
    if (details.length === 0) {
      setErrorMessage('At least one expense detail item is required.');
      return;
    }

    const invalidDetailIdx = details.findIndex(d => !d.title.trim() || Number(d.amount) < 0);
    if (invalidDetailIdx !== -1) {
      setErrorMessage(`Please fill out all detail item names and ensure amounts are positive. Check item #${invalidDetailIdx + 1}.`);
      return;
    }

    setSubmitLoading(true);

    const payload: ExpensePayload = {
      expense_date: expenseDate,
      notes: notes,
      details: details.map(d => ({
        title: d.title,
        amount: Number(d.amount)
      }))
    };

    try {
      let res;
      if (isEditMode) {
        res = await expenseService.updateExpense(Number(id), payload);
      } else {
        res = await expenseService.createExpense(payload);
      }

      if (res.success) {
        navigate('/expenses', {
          state: { message: isEditMode ? 'Expense updated successfully.' : 'Expense created successfully.' }
        });
      } else {
        setErrorMessage(res.message || 'Failed to save expense.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        setErrorMessage('Validation failed. Please correct the fields marked in red.');
      } else {
        setErrorMessage(
          err.response?.data?.message || 'An error occurred while saving the expense.'
        );
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-sm text-base-content/60">Loading expense data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/expenses')}
          className="btn btn-ghost btn-sm btn-circle"
          type="button"
          title="Back to Expenses list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-5 h-5 stroke-current">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-base-content m-0">
            {isEditMode ? `Edit Expense Log (EXP-${String(id).padStart(5, '0')})` : 'Record New Expense'}
          </h1>
          <p className="text-sm text-base-content/60">
            {isEditMode ? 'Modify existing ledger transaction details.' : 'Log operational costs, utilities or maintenance details.'}
          </p>
        </div>
      </div>

      {/* Main Error Alert */}
      {errorMessage && (
        <div className="alert alert-error text-white shadow mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card bg-base-100 shadow border border-base-200">
        <form onSubmit={handleSubmit} className="card-body p-6 md:p-8 space-y-6">

          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Expense Date */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/70">Expense Date *</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors.expense_date ? 'input-error' : ''
                  }`}
                disabled={submitLoading}
                required
              />
              {fieldErrors.expense_date && (
                <p className="text-error text-xs mt-1">{fieldErrors.expense_date[0]}</p>
              )}
            </div>

            {/* Notes / Remarks */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-semibold text-xs text-base-content/70">Description / Notes *</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Purchase of street light lightbulbs, estate security guard monthly salaries..."
                className={`textarea textarea-bordered textarea-sm focus:outline-primary h-[38px] w-full min-h-[38px] ${fieldErrors.notes ? 'textarea-error' : ''
                  }`}
                disabled={submitLoading}
                required
              />
              {fieldErrors.notes && (
                <p className="text-error text-xs mt-1">{fieldErrors.notes[0]}</p>
              )}
            </div>

          </div>

          <div className="divider my-0"></div>

          {/* Details Table Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-base text-base-content m-0">Detail Cost Items</h3>
                <p className="text-xs text-base-content/50">Add individual items that comprise this expense log.</p>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="btn btn-secondary btn-xs gap-1.5 text-white"
                disabled={submitLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            {fieldErrors.details && (
              <div className="alert alert-error text-white text-xs py-2 px-3 mb-4 shadow">
                <span>{fieldErrors.details[0]}</span>
              </div>
            )}

            {/* Dynamic Items Table */}
            <div className="overflow-x-auto w-full border border-base-200 rounded-xl">
              <table className="table w-full">
                <thead>
                  <tr className="bg-base-200/50 border-b border-base-200">
                    <th className="w-12 text-center text-xs">No</th>
                    <th className="text-xs">Item Name / Title *</th>
                    <th className="w-48 text-xs">Amount (IDR) *</th>
                    <th className="w-16 text-center text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail, index) => {
                    const titleErrorKey = `details.${index}.title`;
                    const amountErrorKey = `details.${index}.amount`;

                    return (
                      <tr key={index} className="border-b border-base-200/60 hover:bg-base-200/10">
                        <td className="text-center font-medium text-xs text-base-content/50">
                          {index + 1}
                        </td>

                        {/* Title input */}
                        <td>
                          <input
                            type="text"
                            placeholder="e.g. Guard A Salary, Park grass mower contractor fee..."
                            value={detail.title}
                            onChange={(e) => handleDetailChange(index, 'title', e.target.value)}
                            className={`input input-bordered input-sm focus:outline-primary w-full ${fieldErrors[titleErrorKey] ? 'input-error' : ''
                              }`}
                            disabled={submitLoading}
                            required
                          />
                          {fieldErrors[titleErrorKey] && (
                            <p className="text-error text-[10px] mt-1 font-semibold">{fieldErrors[titleErrorKey][0]}</p>
                          )}
                        </td>

                        {/* Amount input */}
                        <td>
                          <div className="relative">
                            <span className="absolute left-3 top-[7px] text-xs font-semibold opacity-40">Rp</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={detail.amount || ''}
                              onChange={(e) => handleDetailChange(index, 'amount', e.target.value ? Number(e.target.value) : 0)}
                              className={`input input-bordered input-sm focus:outline-primary w-full pl-9 ${fieldErrors[amountErrorKey] ? 'input-error' : ''
                                }`}
                              disabled={submitLoading}
                              required
                            />
                          </div>
                          {fieldErrors[amountErrorKey] && (
                            <p className="text-error text-[10px] mt-1 font-semibold">{fieldErrors[amountErrorKey][0]}</p>
                          )}
                        </td>

                        {/* Remove Action */}
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            disabled={details.length <= 1 || submitLoading}
                            className="btn btn-ghost btn-xs text-error disabled:opacity-30 hover:bg-error/10 font-bold"
                            title={details.length <= 1 ? "Must have at least one detail row" : "Remove item"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-4 h-4 stroke-current">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary/Total Row */}
                  <tr className="bg-base-200/35 border-t-2 border-base-200">
                    <td colSpan={2} className="text-right font-bold text-sm text-base-content/75 pr-6">
                      Total Ledger Amount:
                    </td>
                    <td className="font-extrabold text-sm text-error">
                      {formatCurrency(calculateTotal())}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 border-t border-base-200 pt-6 mt-4">
            <button
              type="button"
              onClick={() => navigate('/expenses')}
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
                isEditMode ? 'Update Expense' : 'Save Expense Log'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
