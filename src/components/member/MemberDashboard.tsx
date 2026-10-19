import React, { useEffect, useState } from 'react';
import {
  Award, Clock, AlertTriangle, RefreshCw, FileText, History,
  User, Bell, Calendar, ChevronRight, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Renewal, Notification, CERT_STATUS_COLORS, STATUS_LABELS, STATUS_COLORS } from '../../types';
import { Page } from '../common/Sidebar';
import TopBar from '../common/TopBar';

interface MemberDashboardProps {
  onNavigate: (page: Page) => void;
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MemberDashboard({ onNavigate }: MemberDashboardProps) {
  const { profile } = useAuth();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase
        .from('renewals')
        .select('*')
        .eq('member_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([r, n]) => {
      setRenewals(r.data ?? []);
      setNotifications(n.data ?? []);
    }).finally(() => setLoading(false));
  }, [profile?.id]);

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Member';
  const days = daysUntil(profile?.expiration_date ?? null);
  const certStatusColor = CERT_STATUS_COLORS[profile?.cert_status ?? 'active'];

  const certStatusLabel: Record<string, string> = {
    active: 'Active',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    pending_renewal: 'Pending Renewal',
  };

  const latestRenewal = renewals[0];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-royal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TopBar
        title="Member Dashboard"
        subtitle="Computer Engineering Certification Board (CPECB) — Professional Certification Renewal Portal"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome banner */}
        <div
          className="rounded-card p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'linear-gradient(135deg, #001F5B 0%, #0056B8 100%)' }}
        >
          <div>
            <p className="text-blue-200 text-sm font-medium">Welcome back,</p>
            <h2 className="text-2xl font-bold mt-0.5">
              {profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ''}`.trim() : fullName}
            </h2>
            {profile?.certification_type && (
              <p className="text-blue-200 text-sm mt-1">
                {profile.certification_type} &mdash; {profile.icpep_region ?? 'Region not set'}
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigate('renew')}
            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-lg transition-all text-sm flex items-center gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Renew Certification
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Certification Status */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Cert. Status</p>
                <span className={`status-badge mt-2 ${certStatusColor}`}>
                  {certStatusLabel[profile?.cert_status ?? 'active']}
                </span>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-royal-500" />
              </div>
            </div>
          </div>

          {/* Cert Type */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Certification</p>
                <p className="text-navy-900 font-bold text-xl mt-1">{profile?.certification_type ?? '—'}</p>
                <p className="text-gray-400 text-xs mt-0.5">Certification Type</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Expires</p>
                <p className="text-navy-900 font-bold text-lg mt-1">
                  {profile?.expiration_date
                    ? new Date(profile.expiration_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
                {days !== null && (
                  <p className={`text-xs mt-0.5 font-medium ${days < 0 ? 'text-red-500' : days <= 90 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {days < 0 ? `${Math.abs(days)} days ago` : `${days} days remaining`}
                  </p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${days !== null && days <= 90 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <Clock className={`w-5 h-5 ${days !== null && days <= 90 ? 'text-yellow-500' : 'text-green-500'}`} />
              </div>
            </div>
          </div>

          {/* Cert Number */}
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Cert. Number</p>
                <p className="text-navy-900 font-bold text-base mt-1 font-mono">
                  {profile?.certification_number ?? '—'}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Issued: {profile?.date_issued
                    ? new Date(profile.date_issued).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-navy-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="card p-6">
            <h3 className="text-navy-900 font-semibold text-base mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Renew Certification', icon: RefreshCw, page: 'renew' as Page, color: 'text-royal-500 bg-blue-50' },
                { label: 'View Previous Renewals', icon: History, page: 'history' as Page, color: 'text-green-600 bg-green-50' },
                { label: 'Update Profile', icon: User, page: 'profile' as Page, color: 'text-purple-600 bg-purple-50' },
              ].map(({ label, icon: Icon, page, color }) => (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-cpecb-border hover:border-royal-300 hover:bg-blue-50/50 transition-all group"
                >
                  <span className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-navy-900">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-royal-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Latest application */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy-900 font-semibold text-base">Latest Application</h3>
              <button onClick={() => onNavigate('history')} className="text-xs text-royal-500 hover:text-royal-700 font-medium">
                View all
              </button>
            </div>
            {latestRenewal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <span className="text-sm font-semibold text-navy-900">{latestRenewal.renewal_type} Renewal</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`status-badge ${STATUS_COLORS[latestRenewal.status]}`}>
                    {STATUS_LABELS[latestRenewal.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Submitted</span>
                  <span className="text-sm font-medium text-navy-900">
                    {latestRenewal.submitted_at
                      ? new Date(latestRenewal.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Not submitted'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Cert. No.</span>
                  <span className="text-sm font-mono text-navy-900">{latestRenewal.certification_number}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No applications yet</p>
                <button onClick={() => onNavigate('renew')} className="btn-primary mt-4 text-sm py-2 px-4">
                  Start Renewal
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-navy-900 font-semibold text-base">Recent Notifications</h3>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className={`p-3 rounded-xl border text-sm ${
                    n.type === 'success' ? 'bg-green-50 border-green-200' :
                    n.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    n.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <p className="font-semibold text-navy-900">{n.title}</p>
                    <p className="text-gray-600 mt-0.5 line-clamp-2 text-xs">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cert info detail */}
        {(profile?.certification_number || profile?.date_issued || profile?.expiration_date) && (
          <div className="card p-6">
            <h3 className="text-navy-900 font-semibold text-base mb-4">Certification Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: 'Certification Number', value: profile?.certification_number ?? '—' },
                { label: 'Certification Type', value: profile?.certification_type ?? '—' },
                { label: 'Date Issued', value: profile?.date_issued ? new Date(profile.date_issued).toLocaleDateString('en-PH') : '—' },
                { label: 'Expiration Date', value: profile?.expiration_date ? new Date(profile.expiration_date).toLocaleDateString('en-PH') : '—' },
                {
                  label: 'Days Remaining',
                  value: days !== null ? (days < 0 ? 'Expired' : `${days} days`) : '—',
                  highlight: days !== null && days <= 90,
                },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="bg-cpecb-bg rounded-xl p-4">
                  <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                  <p className={`font-semibold text-sm ${highlight ? 'text-red-600' : 'text-navy-900'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
