import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AxiosError } from 'axios';
import { SmartMessLogo } from '../components/common/SmartMessLogo';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const cleanStudentId = studentId.trim();

    // Frontend validation
    if (!/^\d+$/.test(cleanStudentId)) {
      setError('Student ID must contain only numbers (digits 0-9)');
      return;
    }

    if (cleanStudentId.length < 4 || cleanStudentId.length > 20) {
      setError('Student ID must be between 4 and 20 digits long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        studentId: cleanStudentId,
        password,
        confirmPassword,
      });

      // Once successfully registered as a Student, navigate to the student portal
      navigate('/student');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else if (err instanceof Error) {
        setError(err.message || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white relative">
      {/* Background Accent Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-indigo-300/25 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Logo and Heading */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <SmartMessLogo size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Student Account
          </h1>
          <p className="mt-1.5 text-xs text-slate-600">
            Enter your numeric Student ID to register for your campus dining hall
          </p>
          <span className="sr-only">Smart Mess Queue</span>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 sm:px-10">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                placeholder="Alex Morgan"
              />
            </div>

            {/* Student ID (Numeric Only) */}
            <div>
              <label htmlFor="studentId" className="block text-xs font-semibold text-slate-700 mb-1">
                Student ID <span className="text-slate-400 font-normal">(Numbers only)</span>
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                minLength={4}
                maxLength={20}
                value={studentId}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/\D/g, '');
                  setStudentId(numbers);
                }}
                className="block w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                placeholder="12410001"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Only digits allowed (e.g. 12410001). No letters or symbols.
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3.5 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                  placeholder="Min 8 chars, uppercase, lowercase, digit"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide credentials' : 'Reveal credentials'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative rounded-xl">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3.5 pr-10 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-colors"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? 'Hide confirm credential' : 'Reveal confirm credential'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-200 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Student Account</span>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-600">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline">
                  Sign in with Student ID
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
