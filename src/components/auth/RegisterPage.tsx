import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ICPEP_REGIONS } from '../../types';

interface RegisterPageProps {
  onGoLogin: () => void;
}

export default function RegisterPage({ onGoLogin }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    icpepRegion: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(form);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cpecb-bg flex items-center justify-center px-6">
        <div className="card p-10 max-w-md w-full text-center animate-fadeInUp">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-navy-900 text-2xl font-bold mb-2">Registration Successful</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account has been created. You may now sign in to access the CPECB Renewal Portal.
          </p>
          <button onClick={onGoLogin} className="btn-primary w-full">
            Sign In to Your Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cpecb-bg flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 px-12 py-12"
        style={{ background: 'linear-gradient(160deg, #001F5B 0%, #0056B8 60%, #4DA3FF 100%)' }}
      >
        <div className="flex items-center gap-4">
          <img
            src="/CPECB-Logo.png"
            alt="CPECB Logo"
            className="h-16 w-16 object-contain"
          />
          <div>
            <p className="text-accent-200 text-xs font-semibold uppercase tracking-widest">CPECB</p>
            <p className="text-white font-bold text-lg leading-tight">Computer Engineering<br />Certification Board</p>
          </div>
        </div>

        <div className="animate-fadeInUp">
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            Join the CPECB<br />
            <span className="text-accent-300">Renewal Portal</span>
          </h1>
          <p className="text-blue-200 text-base leading-relaxed max-w-xs">
            Create your account to manage your CCPE and PCPE certifications online.
          </p>
          <ul className="mt-8 space-y-3 text-blue-100 text-sm">
            {[
              'Submit renewal applications online',
              'Track application status in real-time',
              'Receive email updates & notifications',
              'Manage your certification records',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-blue-300 text-sm">
          &copy; {new Date().getFullYear()} CPECB. All rights reserved.
        </p>
      </div>

      {/* Right register form */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg animate-fadeInUp">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <img
              src="/CPECB-Logo.png"
              alt="CPECB Logo"
              className="h-16 w-16 object-contain mb-2"
            />
            <h2 className="text-navy-900 font-bold text-lg text-center">CPECB Renewal Portal</h2>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-navy-900 text-2xl font-bold">Create Account</h2>
              <p className="text-gray-500 text-sm mt-1">Register to access the CPECB Renewal Portal</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">First Name <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => update('firstName', e.target.value)}
                      className="input-field pl-9"
                      placeholder="Juan"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Middle Name</label>
                  <input
                    type="text"
                    value={form.middleName}
                    onChange={(e) => update('middleName', e.target.value)}
                    className="input-field"
                    placeholder="Santos"
                  />
                </div>
                <div>
                  <label className="label">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    className="input-field"
                    placeholder="Dela Cruz"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="input-field pl-10"
                    placeholder="juan@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Mobile Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.mobileNumber}
                    onChange={(e) => update('mobileNumber', e.target.value)}
                    className="input-field pl-10"
                    placeholder="+63 9XX XXX XXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">ICPEP Region <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={form.icpepRegion}
                    onChange={(e) => update('icpepRegion', e.target.value)}
                    className="input-field pl-10 appearance-none"
                    required
                  >
                    <option value="">Select Region</option>
                    {ICPEP_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={onGoLogin}
                  className="text-royal-500 hover:text-royal-700 font-semibold transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
