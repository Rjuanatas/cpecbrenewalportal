import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginPageProps {
  onGoRegister: () => void;
}

export default function LoginPage({ onGoRegister }: LoginPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cpecb-bg flex">
      {/* Left hero panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 px-14 py-12"
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
          <h1 className="text-white text-4xl font-bold leading-tight mb-6">
            Welcome to the<br />
            <span className="text-accent-300">CPECB Renewal</span><br />
            Portal
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-md">
            Renew your CCPE and PCPE certifications online through a secure and streamlined digital renewal process.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Certified & Professional CpE', value: '2,000+' },
              { label: 'Renewals Processed', value: '600+' },
              { label: 'Regions Covered', value: '20' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">
          &copy; {new Date().getFullYear()} Computer Engineering Certification Board (CPECB). All rights reserved.
        </p>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fadeInUp">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img
              src="/CPECB-Logo.png"
              alt="CPECB Logo"
              className="h-20 w-20 object-contain mb-3"
            />
            <h2 className="text-navy-900 font-bold text-xl text-center">Computer Engineering Certification Board</h2>
            <p className="text-gray-500 text-sm">Professional Certification Renewal Portal</p>
          </div>

          <div className="card p-8">
            <div className="mb-7">
              <h2 className="text-navy-900 text-2xl font-bold">Sign In</h2>
              <p className="text-gray-500 text-sm mt-1">Access your renewal portal account</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-royal-500 border-gray-300 rounded focus:ring-royal-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-royal-500 hover:text-royal-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={onGoRegister}
                  className="text-royal-500 hover:text-royal-700 font-semibold transition-colors"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Certify Locally, Practice Globally &mdash; CPECB Est. 2019
          </p>
        </div>
      </div>
    </div>
  );
}
