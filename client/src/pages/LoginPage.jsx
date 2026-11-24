import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { AxiosError } from 'axios';
import { SmartMessLogo } from '../components/common/SmartMessLogo.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [roleTab, setRoleTab] = useState('student');
  const [studentId, setStudentId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore remembered identifier when switching role tab or mounting
  useEffect(() => {
    try {
      if (roleTab === 'student') {
        const savedId = localStorage.getItem('smart_mess_remember_student_id');
        if (savedId) {
          setStudentId(savedId);
          setRememberMe(true);
        } else {
          setRememberMe(false);
        }
      } else {
        const savedEmail = localStorage.getItem('smart_mess_remember_email');
        if (savedEmail) {
          setAdminEmail(savedEmail);
          setRememberMe(true);
        } else {
          setRememberMe(false);
        }
      }
    } catch {
      // Storage access blocked or unavailable
    }
  }, [roleTab]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      if (roleTab === 'student') {
        const cleanId = studentId.trim();
        if (!cleanId) {
          setError('Student ID is required');
          setIsSubmitting(false);
          return;
        }
        if (!/^\d+$/.test(cleanId)) {
          setError('Student ID must contain only numbers');
          setIsSubmitting(false);
          return;
        }

        await login({ studentId: cleanId, password });

        try {
          if (rememberMe) {
            localStorage.setItem('smart_mess_remember_student_id', cleanId);
          } else {
            localStorage.removeItem('smart_mess_remember_student_id');
          }
        } catch {
          // Storage blocked
        }

        navigate('/student');
      } else {
        const cleanEmail = adminEmail.trim();
        if (!cleanEmail) {
          setError('Admin email address is required');
          setIsSubmitting(false);
          return;
        }

        await login({ email: cleanEmail, password });

        try {
          if (rememberMe) {
            localStorage.setItem('smart_mess_remember_email', cleanEmail);
          } else {
            localStorage.removeItem('smart_mess_remember_email');
          }
        } catch {
          // Storage blocked
        }

        navigate('/admin');
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (err instanceof Error) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Quick fill demo credentials for test and development convenience
  function handleQuickFill(type) {
    if (type === 'student') {
      setRoleTab('student');
      setStudentId('12410001');
      setPassword('StrongPass1');
    } else {
      setRoleTab('admin');
      setAdminEmail('rkrevanth07@gmail.com');
      setPassword('TestPass@123');
    }
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center selection:bg-indigo-500 selection:text-white">
      {/* Background Accent Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-300/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-emerald-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* ══════════════════════════════════════════════════════
              LEFT COLUMN: Modern Dynamic Login Form
             ══════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            {/* Top Header & Brand */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <SmartMessLogo size="md" />
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Mess Service
                </span>
              </div>

              {/* Title & Contextual Heading */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {roleTab === 'student' ? 'Student Dining Access' : 'Mess Administration'}
                </h1>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {roleTab === 'student'
                    ? 'Enter your numeric Student ID and password to reserve meal slots and track your queue status.'
                    : 'Sign in with your authorized admin email to manage schedules, counter capacity, and waste logs.'}
                </p>
                {/* Hidden accessibility text */}
                <span className="sr-only">Smart Mess Queue</span>
              </div>

              {/* Role Switcher: Student vs Admin Segmented Control */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Portal Role
                </label>
                <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleTab('student');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      roleTab === 'student'
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l9-5-9-5-9 5 9 5z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                      />
                    </svg>
                    <span>Student Login</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleTab('admin');
                      setError('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      roleTab === 'admin'
                        ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span>Admin Login</span>
                  </button>
                </div>
              </div>

              {/* Informational Role Banner */}
              {roleTab === 'admin' && (
                <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs text-purple-900">
                  <svg className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong>Admin Portal:</strong> Sign in with your registered admin email. Access requires the verified MESS_ADMIN role.
                  </span>
                </div>
              )}

              {/* Alerts: Error & Info */}
              {error && (
                <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 animate-fadeIn">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {infoMessage && (
                <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
                  <p className="text-xs">{infoMessage}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dynamic Identifier Input: Student ID vs Admin Email */}
                {roleTab === 'student' ? (
                  <div>
                    <label htmlFor="studentId" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Student ID <span className="text-slate-400 font-normal">(Numbers only)</span>
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        {/* ID Badge Icon */}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                          />
                        </svg>
                      </div>
                      <input
                        id="studentId"
                        name="studentId"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        autoComplete="username"
                        value={studentId}
                        onChange={(e) => {
                          const numOnly = e.target.value.replace(/\D/g, '');
                          setStudentId(numOnly);
                        }}
                        placeholder="e.g. 12410001"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        {/* Mail Icon */}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                          />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="rkrevanth07@gmail.com"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Password Input with Visibility Toggle */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {/* Lock Icon */}
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-11 py-3 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                      aria-label={showPassword ? 'Hide credentials' : 'Reveal credentials'}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between pt-1">
                  <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-600">Remember me</span>
                  </label>

                  {/* Demo Credential Fill Button (Development Only) */}
                  {import.meta.env.DEV && (
                    <button
                      type="button"
                      onClick={() => handleQuickFill(roleTab)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline focus:outline-none"
                    >
                      Use Demo {roleTab === 'student' ? 'Student' : 'Admin'}
                    </button>
                  )}
                </div>

                {/* Submit Sign In Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
                      roleTab === 'student'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-indigo-200 focus:ring-indigo-500'
                        : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 shadow-purple-200 focus:ring-purple-500'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>{roleTab === 'student' ? 'Sign In as Student' : 'Sign In as Admin'}</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Footer Links */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
              {roleTab === 'student' ? (
                <div>
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/register"
                    className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    Create Student Account →
                  </Link>
                </div>
              ) : (
                <div className="text-slate-500">
                  Need admin credentials?{' '}
                  <span className="font-medium text-slate-700">Contact Mess Administration.</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400">
                v1.2.0 • Smart Mess Queue
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              RIGHT COLUMN: Modern SaaS Feature Showcase
             ══════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 text-white p-10 flex-col justify-between relative overflow-hidden">
            {/* Background glowing orbs */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-10 -left-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Zero-Waste Smart Dining System
              </div>

              <h2 className="mt-6 text-2xl font-bold tracking-tight text-white leading-snug">
                Smarter Queuing, Zero Confusion, Less Food Waste.
              </h2>
              <p className="mt-2 text-xs text-indigo-200/90 leading-relaxed">
                Connect your campus dining hall with real-time queue orchestration and predictive kitchen prep.
              </p>
            </div>

            {/* Interactive/Visual Showcase Cards */}
            <div className="relative z-10 my-8 space-y-3">
              {/* Feature Pill 1: Live Queue */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/30 flex items-center justify-center text-lg shrink-0">
                  🎫
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Live Virtual Dining Ticket</h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    No physical waiting line. Check in and get notified when your meal is ready.
                  </p>
                </div>
              </div>

              {/* Feature Pill 2: Seat Reservation */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                <div className="h-10 w-10 rounded-xl bg-purple-500/30 flex items-center justify-center text-lg shrink-0">
                  ⏱️
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Guaranteed Meal Slots</h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    Pre-book preferred breakfast, lunch, and dinner times with automated seating caps.
                  </p>
                </div>
              </div>

              {/* Feature Pill 3: Waste Analytics */}
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3 transition-transform hover:translate-x-1 duration-200">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-lg shrink-0">
                  🌱
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Food Waste Optimization</h4>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    Real-time waste logs and operational insights helping campus kitchens prevent surplus prep.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom System Stats */}
            <div className="relative z-10 pt-6 border-t border-white/15 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-extrabold text-white">99.8%</p>
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">
                  Slot Accuracy
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-300">-40%</p>
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">
                  Wait Times
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-purple-200">Zero</p>
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold mt-0.5">
                  Queue Chaos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

