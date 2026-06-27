import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Redirect if already authenticated
  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!email || !password) {
      setErrorMessage('Harap isi email dan password.');
      return;
    }

    setSubmitLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 422) {
        setFieldErrors(err.response.data.errors || {});
        setErrorMessage('Validasi gagal. Harap periksa format email dan password Anda.');
      } else if (err.response?.status === 401) {
        setErrorMessage(err.response.data.message || 'Email atau password salah.');
      } else {
        setErrorMessage(err.message || 'Gagal terhubung ke layanan login.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-300/40 p-4 relative overflow-hidden">
      
      {/* Background glowing gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none"></div>

      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-200/60 relative z-10 overflow-hidden">
        
        {/* Colorful top border line */}
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>

        <div className="card-body p-8">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="avatar placeholder mb-3">
              <div className="bg-primary text-primary-content w-12 rounded-2xl font-black text-2xl shadow-md shadow-primary/20">
                G
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-base-content">
              Selamat Datang di GriyaHub
            </h1>
            <p className="text-xs text-base-content/60 mt-1">
              Sistem Administrasi Perumahan Modern
            </p>
          </div>

          {/* Error alerts */}
          {errorMessage && (
            <div className="alert alert-error text-white text-xs py-2.5 px-3 rounded-xl mb-4 shadow">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-base-content/75">Alamat Email *</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Contoh: admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input input-bordered focus:outline-primary w-full pl-10 ${
                    fieldErrors.email ? 'input-error' : ''
                  }`}
                  disabled={submitLoading}
                  required
                />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 absolute left-3 top-3.5 opacity-60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              {fieldErrors.email && (
                <p className="text-error text-[10px] mt-1 font-semibold">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-base-content/75">Password *</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input input-bordered focus:outline-primary w-full pl-10 pr-10 ${
                    fieldErrors.password ? 'input-error' : ''
                  }`}
                  disabled={submitLoading}
                  required
                />
                {/* Lock icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5 absolute left-3 top-3.5 opacity-60">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {/* Show/Hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-ghost btn-xs btn-circle absolute right-2.5 top-3 text-base-content/65 hover:bg-transparent"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.815 7.815L21 21m-3.956-3.956l-3.09-3.09m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-error text-[10px] mt-1 font-semibold">{fieldErrors.password[0]}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary w-full text-white gap-2 font-bold"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Memverifikasi Admin...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
