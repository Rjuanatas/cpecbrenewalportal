import React, { useEffect, useState } from 'react';
import {
  Users, FileText, CheckCircle, XCircle,
  ThumbsUp, ThumbsDown, Search, Eye, Award, Calendar, Mail, AlertCircle, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Renewal, Profile, Document, STATUS_LABELS, STATUS_COLORS, ICPEP_REGIONS } from '../../types';
import TopBar from '../common/TopBar';

type AdminView = 'dashboard' | 'renewals' | 'members';

interface AdminDashboardProps {
  initialView?: AdminView;
}

interface RenewalWithProfile extends Renewal {
  profiles?: Profile;
}

export default function AdminDashboard({ initialView = 'dashboard' }: AdminDashboardProps) {
  const { profile: adminProfile } = useAuth();
  const [view, setView] = useState<AdminView>(initialView);
  const [renewals, setRenewals] = useState<RenewalWithProfile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RenewalWithProfile | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [remarkText, setRemarkText] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('renewals').select('*, profiles!renewals_member_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'member').order('created_at', { ascending: false }),
    ]).then(([r, m]) => {
      setRenewals(r.data ?? []);
      setMembers(m.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const reload = async () => {
    const [r, m] = await Promise.all([
      supabase.from('renewals').select('*, profiles!renewals_member_id_fkey(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('role', 'member').order('created_at', { ascending: false }),
    ]);
    setRenewals(r.data ?? []);
    setMembers(m.data ?? []);
  };

  const loadDocs = async (id: string) => {
    const { data } = await supabase.from('documents').select('*').eq('renewal_id', id);
    setDocs(data ?? []);
  };

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 8000);
  };

  const approveOrReject = async (status: 'approved' | 'rejected') => {
    if (!selected) return;
    setSaving(true);
    const now = new Date().toISOString();

    await supabase.from('renewals').update({
      status,
      remarks: remarkText,
      reviewed_by: adminProfile!.id,
      reviewed_at: now,
      updated_at: now,
    }).eq('id', selected.id);

    await supabase.from('renewal_status_history').insert({
      renewal_id: selected.id,
      status,
      changed_by: adminProfile!.id,
      remarks: remarkText,
    });

    await supabase.from('notifications').insert({
      user_id: selected.member_id,
      title: status === 'approved' ? 'Renewal Application Approved' : 'Renewal Application Rejected',
      message: `Your ${selected.renewal_type} renewal application has been ${status}${remarkText ? `. Remarks: ${remarkText}` : '.'}`,
      type: status === 'approved' ? 'success' : 'error',
    });

    if (status === 'approved') {
      const memberEmail = selected.profiles?.communication_email || selected.profiles?.email;
      const memberName = [selected.profiles?.first_name, selected.profiles?.last_name].filter(Boolean).join(' ') || 'Member';
      if (memberEmail) {
        const { error: emailErr } = await supabase.functions.invoke('send-approval-email', {
          body: {
            member_name: memberName,
            member_email: memberEmail,
            renewal_type: selected.renewal_type,
            certification_number: selected.certification_number,
            approval_date: new Date(now).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
            remarks: remarkText || undefined,
          },
        });
        if (emailErr) {
          showToast('error', `Application approved, but the email notification failed to send: ${emailErr.message}`);
        } else {
          showToast('success', `Application approved. Congratulatory email sent to ${memberEmail}.`);
        }
      } else {
        showToast('info', 'Application approved. No email address is on file for this member.');
      }
    }

    setSelected(null);
    await reload();
    setSaving(false);
  };

  // ── Analytics ──────────────────────────────────────────────
  const byRegion = ICPEP_REGIONS.map((r) => ({
    region: r.replace('Region ', 'R'),
    count: renewals.filter((rn) => rn.profiles?.icpep_region === r).length,
  })).filter((d) => d.count > 0);

  // 12-month breakdown: total, ccpe, pcpe per month
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    const m = d.getMonth();
    const y = d.getFullYear();
    const subset = renewals.filter((r) => {
      if (!r.submitted_at) return false;
      const dt = new Date(r.submitted_at);
      return dt.getMonth() === m && dt.getFullYear() === y;
    });
    return {
      label: d.toLocaleString('en-PH', { month: 'short' }),
      monthKey: `${y}-${String(m + 1).padStart(2, '0')}`,
      year: y,
      monthNum: m,
      total: subset.length,
      ccpe: subset.filter((r) => r.renewal_type === 'CCPE').length,
      pcpe: subset.filter((r) => r.renewal_type === 'PCPE').length,
    };
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.cert_status === 'active').length,
    pending: renewals.filter((r) => !['approved', 'rejected', 'draft'].includes(r.status)).length,
    approved: renewals.filter((r) => r.status === 'approved').length,
    rejected: renewals.filter((r) => r.status === 'rejected').length,
    ccpe: renewals.filter((r) => r.renewal_type === 'CCPE').length,
    pcpe: renewals.filter((r) => r.renewal_type === 'PCPE').length,
  };

  const filteredRenewals = renewals.filter((r) => {
    const q = search.toLowerCase();
    return !q || [
      r.profiles?.first_name, r.profiles?.last_name,
      r.certification_number, r.batch_number, r.profiles?.icpep_region
    ].some((v) => v?.toLowerCase().includes(q));
  });

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return !q || [m.first_name, m.last_name, m.email, m.certification_number, m.icpep_region].some((v) => v?.toLowerCase().includes(q));
  });

  // ── Review detail view ─────────────────────────────────────
  if (selected) {
    const memberName = [selected.profiles?.first_name, selected.profiles?.last_name].filter(Boolean).join(' ') || 'Member';
    const docsByType = docs.reduce((acc, d) => {
      if (!acc[d.document_type]) acc[d.document_type] = [];
      acc[d.document_type].push(d);
      return acc;
    }, {} as Record<string, Document[]>);
    const docLabels: Record<string, string> = {
      profile_photo: '2x2 Photo', old_id: 'Old Cert ID',
      regional_certificate: 'Regional Activity', national_certificate: 'National Activity',
      proof_of_payment: 'Proof of Payment', signature: 'Signature',
    };

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopBar title="Application Review" subtitle={`Admin review — ${memberName}`} />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <button onClick={() => setSelected(null)} className="btn-secondary mb-6 flex items-center gap-2">
              Back to Renewals
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="card p-5">
                  <h3 className="font-semibold text-navy-900 text-sm mb-4">Renewal Info</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { l: 'Member', v: memberName },
                      { l: 'Type', v: `${selected.renewal_type} Renewal` },
                      { l: 'Cert No.', v: selected.certification_number },
                      { l: 'Region', v: selected.profiles?.icpep_region ?? '—' },
                      { l: 'Batch', v: selected.batch_number ?? '—' },
                      { l: 'Amount', v: selected.amount_paid ? `PHP ${selected.amount_paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—' },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-gray-400">{l}</span>
                        <span className="text-navy-900 font-medium text-right">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <span className={`status-badge ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span>
                  </div>
                </div>
                <div className="card p-5 space-y-3">
                  <h3 className="font-semibold text-navy-900 text-sm">Admin Decision</h3>
                  <div>
                    <label className="label text-xs">Remarks</label>
                    <textarea value={remarkText} onChange={(e) => setRemarkText(e.target.value)} className="input-field min-h-[80px] text-sm resize-y" placeholder="Add remarks..." />
                  </div>
                  <button onClick={() => approveOrReject('approved')} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                    <ThumbsUp className="w-4 h-4" /> Approve Application
                  </button>
                  <button onClick={() => approveOrReject('rejected')} disabled={saving} className="btn-danger w-full flex items-center justify-center gap-2">
                    <ThumbsDown className="w-4 h-4" /> Reject Application
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2 card p-6">
                <h3 className="font-semibold text-navy-900 text-base mb-5">Documents</h3>
                {docs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">No documents uploaded.</div>
                ) : (
                  <div className="space-y-5">
                    {Object.entries(docsByType).map(([type, typeDocs]) => (
                      <div key={type}>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">{docLabels[type] ?? type} ({typeDocs.length})</p>
                        <div className="grid grid-cols-2 gap-3">
                          {typeDocs.map((doc) => {
                            const isImg = /\.(jpg|jpeg|png)$/i.test(doc.file_name);
                            return (
                              <div key={doc.id} className="border border-cpecb-border rounded-xl overflow-hidden">
                                {isImg ? (
                                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                                    <img src={doc.file_url} alt={doc.file_name} className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <div className="aspect-[4/3] flex items-center justify-center bg-gray-100">
                                    <div className="text-center"><FileText className="w-10 h-10 text-gray-400 mx-auto" /><p className="text-xs text-gray-500 mt-1">PDF</p></div>
                                  </div>
                                )}
                                <div className="p-2">
                                  <p className="text-xs text-navy-900 truncate font-medium">{doc.file_name}</p>
                                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-royal-500 hover:underline">Open</a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TopBar
        title={view === 'dashboard' ? 'Admin Dashboard' : view === 'renewals' ? 'Renewal Management' : 'Member Management'}
        subtitle="Computer Engineering Certification Board (CPECB)"
      />

      {toast && (
        <div className={`mx-6 mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {toast.type === 'success' && <Mail className="w-4 h-4 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5" />}
          <div className="flex-1">
            <span>{toast.text}</span>
            {toast.type === 'error' && (
              <p className="mt-1 text-xs opacity-75">
                Note: If using the Resend test sender, emails can only be delivered to your Resend account's own verified email address. To send to any address, verify a custom domain in Resend.
              </p>
            )}
          </div>
          <button onClick={() => setToast(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      )}

      <div className="bg-white border-b border-cpecb-border px-6 flex gap-1">
        {([
          { v: 'dashboard' as AdminView, label: 'Analytics' },
          { v: 'renewals' as AdminView, label: 'Renewals' },
          { v: 'members' as AdminView, label: 'Members' },
        ] as const).map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${view === v ? 'border-royal-500 text-royal-500' : 'border-transparent text-gray-500 hover:text-navy-900'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-royal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'dashboard' ? (
          <DashboardView stats={stats} byRegion={byRegion} monthlyData={monthlyData} />
        ) : view === 'renewals' ? (
          <RenewalsView
            renewals={filteredRenewals}
            search={search}
            onSearch={setSearch}
            onReview={(r) => { setSelected(r); loadDocs(r.id); setRemarkText(r.remarks ?? ''); }}
          />
        ) : (
          <MembersView members={filteredMembers} search={search} onSearch={setSearch} />
        )}
      </div>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────

function GroupedBarChart({ data }: {
  data: Array<{ label: string; ccpe: number; pcpe: number }>;
}) {
  const maxVal = Math.max(...data.flatMap((d) => [d.ccpe, d.pcpe]), 1);
  const h = 160;
  const groupW = 52;
  const barW = 16;
  const gap = 4;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: data.length * (groupW + 8) }}>
        <svg
          width="100%"
          height={h + 40}
          viewBox={`0 0 ${data.length * (groupW + 8)} ${h + 40}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {data.map((d, i) => {
            const gx = i * (groupW + 8) + 4;
            const ccpeH = Math.max(2, (d.ccpe / maxVal) * h);
            const pcpeH = Math.max(2, (d.pcpe / maxVal) * h);
            return (
              <g key={i}>
                {/* CCPE bar */}
                <rect x={gx} y={h - ccpeH} width={barW} height={ccpeH} fill="#0056B8" rx={3} opacity={0.9} />
                {d.ccpe > 0 && (
                  <text x={gx + barW / 2} y={h - ccpeH - 4} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="600">{d.ccpe}</text>
                )}
                {/* PCPE bar */}
                <rect x={gx + barW + gap} y={h - pcpeH} width={barW} height={pcpeH} fill="#4DA3FF" rx={3} opacity={0.9} />
                {d.pcpe > 0 && (
                  <text x={gx + barW + gap + barW / 2} y={h - pcpeH - 4} textAnchor="middle" fontSize={9} fill="#374151" fontWeight="600">{d.pcpe}</text>
                )}
                {/* Month label */}
                <text x={gx + barW + gap / 2} y={h + 16} textAnchor="middle" fontSize={9} fill="#9CA3AF">{d.label}</text>
              </g>
            );
          })}
          <line x1={0} y1={h} x2={data.length * (groupW + 8)} y2={h} stroke="#E5E7EB" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

function BarChartSVG({ data, dataKey, labelKey, color = '#0056B8' }: {
  data: Record<string, unknown>[];
  dataKey: string;
  labelKey: string;
  color?: string;
}) {
  const values = data.map((d) => Number(d[dataKey]) || 0);
  const max = Math.max(...values, 1);
  const h = 180;
  const barW = Math.max(16, Math.min(40, (100 / data.length) - 4));

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: data.length * 48 }}>
        <svg width="100%" height={h + 36} viewBox={`0 0 ${data.length * 52} ${h + 36}`} preserveAspectRatio="xMidYMid meet">
          {values.map((v, i) => {
            const barH = Math.max(2, (v / max) * h);
            const x = i * 52 + (52 - barW) / 2;
            const y = h - barH;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} fill={color} rx={4} opacity={0.85} />
                {v > 0 && (
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="600">{v}</text>
                )}
                <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize={9} fill="#9CA3AF">{String(data[i][labelKey])}</text>
              </g>
            );
          })}
          <line x1={0} y1={h} x2={data.length * 52} y2={h} stroke="#E5E7EB" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

// ── Dashboard analytics view ──────────────────────────────────

type MonthEntry = {
  label: string;
  monthKey: string;
  year: number;
  monthNum: number;
  total: number;
  ccpe: number;
  pcpe: number;
};

function DashboardView({ stats, byRegion, monthlyData }: {
  stats: Record<string, number>;
  byRegion: Array<{ region: string; count: number }>;
  monthlyData: MonthEntry[];
}) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const monthlyFiltered = selectedMonth === 'all'
    ? monthlyData
    : monthlyData.filter((m) => m.monthKey === selectedMonth);

  const filteredCcpe = monthlyFiltered.reduce((s, m) => s + m.ccpe, 0);
  const filteredPcpe = monthlyFiltered.reduce((s, m) => s + m.pcpe, 0);
  const filteredTotal = filteredCcpe + filteredPcpe;

  const monthOptions = monthlyData.map((m) => ({
    value: m.monthKey,
    label: `${m.label} ${m.year}`,
  }));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { label: 'Total Members', value: stats.total, icon: Users, colorIcon: 'text-royal-500', colorBg: 'bg-blue-50' },
          { label: 'Active Certs', value: stats.active, icon: CheckCircle, colorIcon: 'text-green-600', colorBg: 'bg-green-50' },
          { label: 'Pending', value: stats.pending, icon: FileText, colorIcon: 'text-yellow-600', colorBg: 'bg-yellow-50' },
          { label: 'Approved', value: stats.approved, icon: ThumbsUp, colorIcon: 'text-teal-600', colorBg: 'bg-teal-50' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, colorIcon: 'text-red-600', colorBg: 'bg-red-50' },
          { label: 'CCPE Renewals', value: stats.ccpe, icon: Award, colorIcon: 'text-royal-500', colorBg: 'bg-blue-50' },
          { label: 'PCPE Renewals', value: stats.pcpe, icon: Award, colorIcon: 'text-indigo-600', colorBg: 'bg-indigo-50' },
        ].map(({ label, value, icon: Icon, colorIcon, colorBg }) => (
          <div key={label} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-500 text-xs font-medium leading-tight">{label}</p>
                <p className="text-navy-900 font-bold text-2xl mt-1">{value}</p>
              </div>
              <div className={`p-2 rounded-xl shrink-0 ${colorBg}`}>
                <Icon className={`w-4 h-4 ${colorIcon}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly CCPE vs PCPE breakdown with month filter */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-navy-900 font-semibold text-base">CCPE vs PCPE by Month</h3>
            <p className="text-gray-400 text-xs mt-0.5">Renewals submitted per certification type</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field text-sm py-1.5 pr-8"
            >
              <option value="all">All Months (Last 12)</option>
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary numbers for selected period */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { label: 'Total', value: filteredTotal, color: 'text-navy-900', bg: 'bg-gray-50 border-gray-200' },
            { label: 'CCPE', value: filteredCcpe, color: 'text-royal-500', bg: 'bg-blue-50 border-blue-200' },
            { label: 'PCPE', value: filteredPcpe, color: 'text-sky-500', bg: 'bg-sky-50 border-sky-200' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${bg}`}>
              <p className="text-gray-500 text-xs font-medium">{label}</p>
              <p className={`font-bold text-2xl mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Chart — show all 12 months or just the selected one */}
        {selectedMonth === 'all' ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#0056B8]" /><span className="text-xs text-gray-500">CCPE</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#4DA3FF]" /><span className="text-xs text-gray-500">PCPE</span></div>
            </div>
            <GroupedBarChart data={monthlyData} />
          </>
        ) : (
          <div className="flex items-center justify-center gap-12 py-6">
            {[
              { label: 'CCPE', value: filteredCcpe, color: '#0056B8' },
              { label: 'PCPE', value: filteredPcpe, color: '#4DA3FF' },
            ].map(({ label, value, color }) => {
              const pct = filteredTotal > 0 ? Math.round((value / filteredTotal) * 100) : 0;
              return (
                <div key={label} className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg viewBox="0 0 80 80" width={80} height={80}>
                      <circle cx={40} cy={40} r={32} fill="none" stroke="#F3F4F6" strokeWidth={10} />
                      <circle
                        cx={40} cy={40} r={32}
                        fill="none"
                        stroke={color}
                        strokeWidth={10}
                        strokeDasharray={`${pct * 2.01} 201`}
                        strokeDashoffset={50.25}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-sm font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <p className="font-bold text-2xl text-navy-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-500">{label} Renewals</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By region */}
        <div className="card p-6">
          <h3 className="text-navy-900 font-semibold text-base mb-4">Renewals by Region</h3>
          {byRegion.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No renewal data yet</div>
          ) : (
            <BarChartSVG
              data={byRegion as unknown as Record<string, unknown>[]}
              dataKey="count"
              labelKey="region"
            />
          )}
        </div>

        {/* Monthly total trend */}
        <div className="card p-6">
          <h3 className="text-navy-900 font-semibold text-base mb-4">Total Monthly Renewals</h3>
          <BarChartSVG
            data={monthlyData as unknown as Record<string, unknown>[]}
            dataKey="total"
            labelKey="label"
            color="#0056B8"
          />
        </div>
      </div>
    </div>
  );
}

function RenewalsView({
  renewals, search, onSearch, onReview
}: {
  renewals: RenewalWithProfile[];
  search: string;
  onSearch: (s: string) => void;
  onReview: (r: RenewalWithProfile) => void;
}) {
  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} className="input-field pl-9" placeholder="Search renewals..." />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cpecb-bg border-b border-cpecb-border">
                {['Member Name', 'Cert. No.', 'Type', 'Region', 'Submitted', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renewals.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">No renewals found</td></tr>
              ) : renewals.map((r, i) => {
                const name = [r.profiles?.first_name, r.profiles?.last_name].filter(Boolean).join(' ') || '—';
                return (
                  <tr key={r.id} className={`border-b border-cpecb-border hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-navy-900 whitespace-nowrap">{name}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{r.certification_number}</td>
                    <td className="px-4 py-3"><span className="bg-navy-50 text-navy-700 text-xs font-semibold px-2 py-1 rounded-full">{r.renewal_type}</span></td>
                    <td className="px-4 py-3 text-gray-600">{r.profiles?.icpep_region ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3"><span className={`status-badge ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => onReview(r)} className="flex items-center gap-1.5 text-royal-500 hover:text-royal-700 text-xs font-medium">
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MembersView({ members, search, onSearch }: { members: Profile[]; search: string; onSearch: (s: string) => void }) {
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    expiring_soon: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
    pending_renewal: 'bg-blue-100 text-blue-800',
  };
  const statusLabels: Record<string, string> = {
    active: 'Active', expiring_soon: 'Expiring Soon', expired: 'Expired', pending_renewal: 'Pending Renewal',
  };

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => onSearch(e.target.value)} className="input-field pl-9" placeholder="Search members..." />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cpecb-bg border-b border-cpecb-border">
                {['Name', 'Email', 'Region', 'Cert. Type', 'Cert. No.', 'Cert. Status', 'Joined'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-400">No members found</td></tr>
              ) : members.map((m, i) => {
                const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || '—';
                return (
                  <tr key={m.id} className={`border-b border-cpecb-border hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-navy-900 whitespace-nowrap">{name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{m.email ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.icpep_region ?? '—'}</td>
                    <td className="px-4 py-3">
                      {m.certification_type && (
                        <span className="bg-navy-50 text-navy-700 text-xs font-semibold px-2 py-1 rounded-full">{m.certification_type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{m.certification_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${statusColors[m.cert_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[m.cert_status] ?? m.cert_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
