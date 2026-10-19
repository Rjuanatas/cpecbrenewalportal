import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Clock, Eye, ThumbsUp, ThumbsDown,
  FileImage, ChevronRight, Search, User, CreditCard,
  MapPin, FileText, PenLine, X, ZoomIn, Download, ExternalLink,
  Banknote, ChevronDown, ChevronUp, History, Award, Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Renewal, Profile, Document, RenewalStatusHistory, STATUS_LABELS, STATUS_COLORS } from '../../types';
import TopBar from '../common/TopBar';

type Tab = 'all' | 'pending' | 'reviewing' | 'recommended';
type ReviewTab = 'application' | 'documents' | 'history';

interface RenewalWithProfile extends Renewal {
  profiles?: Profile;
  documents?: Document[];
}

interface HistoryEntry extends RenewalStatusHistory {
  profiles?: Pick<Profile, 'first_name' | 'last_name' | 'role'>;
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null | boolean; mono?: boolean }) {
  const display = value === null || value === undefined || value === '' ? '—'
    : typeof value === 'boolean' ? (value ? 'Yes' : 'No')
    : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-400 text-xs font-medium">{label}</span>
      <span className={`text-navy-900 text-sm font-medium break-words ${mono ? 'font-mono' : ''}`}>{display}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children, defaultOpen = true }: {
  icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-cpecb-bg hover:bg-blue-50/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-royal-500" />
          <span className="text-navy-900 font-semibold text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-4 border-t border-cpecb-border">{children}</div>}
    </div>
  );
}

function LightboxImage({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-7 h-7" />
        </button>
        <img src={src} alt={alt} className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain" />
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white hover:text-gray-300 text-sm transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4" />
          Open original
        </a>
      </div>
    </div>
  );
}

function DocCard({ doc, label }: { doc: Document; label: string }) {
  const [lightbox, setLightbox] = useState(false);
  const isImage = /\.(jpg|jpeg|png)$/i.test(doc.file_name);
  const isPdf = /\.pdf$/i.test(doc.file_name);

  return (
    <>
      {lightbox && isImage && (
        <LightboxImage src={doc.file_url} alt={doc.file_name} onClose={() => setLightbox(false)} />
      )}
      <div className="border border-cpecb-border rounded-xl overflow-hidden bg-white hover:shadow-card-hover transition-shadow">
        {isImage ? (
          <button
            className="w-full aspect-[4/3] overflow-hidden bg-gray-100 relative group block"
            onClick={() => setLightbox(true)}
          >
            <img
              src={doc.file_url}
              alt={doc.file_name}
              className="w-full h-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ) : isPdf ? (
          <div className="aspect-[4/3] bg-gray-50 flex flex-col items-center justify-center gap-2 border-b border-cpecb-border">
            <FileText className="w-10 h-10 text-orange-400" />
            <span className="text-xs text-gray-500 font-medium">PDF Document</span>
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-royal-500 hover:text-royal-700 flex items-center gap-1 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              View PDF
            </a>
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center border-b border-cpecb-border">
            <FileImage className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="px-3 py-2.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-sm text-navy-900 font-medium truncate mt-0.5">{doc.file_name}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {isImage && (
              <button
                onClick={() => setLightbox(true)}
                className="text-xs text-royal-500 hover:text-royal-700 font-medium flex items-center gap-1"
              >
                <ZoomIn className="w-3 h-3" />
                View
              </button>
            )}
            <a
              href={doc.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-royal-500 font-medium flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </a>
            <a
              href={doc.file_url}
              download={doc.file_name}
              className="text-xs text-gray-500 hover:text-royal-500 font-medium flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Save
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default function OfficerDashboard() {
  const { profile: officerProfile } = useAuth();
  const [renewals, setRenewals] = useState<RenewalWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RenewalWithProfile | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [remarkText, setRemarkText] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewTab, setReviewTab] = useState<ReviewTab>('application');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  const loadRenewals = async () => {
    const { data, error } = await supabase
      .from('renewals')
      .select('*, profiles!renewals_member_id_fkey(*)')
      .neq('status', 'draft')
      .order('submitted_at', { ascending: false });
    if (error) console.error('loadRenewals error:', error);
    setRenewals(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadRenewals(); }, []);

  const loadDocs = async (renewalId: string) => {
    const { data } = await supabase.from('documents').select('*').eq('renewal_id', renewalId).order('upload_date');
    setDocs(data ?? []);
  };

  const loadHistory = async (renewalId: string) => {
    const { data } = await supabase
      .from('renewal_status_history')
      .select('*, profiles!renewal_status_history_changed_by_fkey(first_name, last_name, role)')
      .eq('renewal_id', renewalId)
      .order('created_at', { ascending: false });
    setHistory(data ?? []);
  };

  const openReview = (r: RenewalWithProfile) => {
    setSelected(r);
    setRemarkText(r.remarks ?? '');
    setReviewTab('application');
    loadDocs(r.id);
    loadHistory(r.id);
  };

  const updateStatus = async (status: Renewal['status']) => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('renewals').update({
      status,
      remarks: remarkText,
      reviewed_by: officerProfile!.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);

    await supabase.from('renewal_status_history').insert({
      renewal_id: selected.id,
      status,
      changed_by: officerProfile!.id,
      remarks: remarkText,
    });

    await supabase.from('notifications').insert({
      user_id: selected.member_id,
      title: `Application ${STATUS_LABELS[status]}`,
      message: `Your ${selected.renewal_type} renewal application status has been updated to: ${STATUS_LABELS[status]}${remarkText ? `. Remarks: ${remarkText}` : '.'}`,
      type: status === 'approved' || status === 'recommended_approval' ? 'success' :
            status === 'rejected' || status === 'recommended_rejection' ? 'error' : 'info',
    });

    setSelected(null);
    await loadRenewals();
    setSaving(false);
  };

  const filtered = renewals.filter((r) => {
    const matchTab =
      tab === 'all' ? true :
      tab === 'pending' ? ['submitted', 'under_review'].includes(r.status) :
      tab === 'reviewing' ? ['payment_verification', 'document_verification'].includes(r.status) :
      ['recommended_approval', 'recommended_rejection'].includes(r.status);

    const q = search.toLowerCase();
    const matchSearch = !q || [
      r.profiles?.first_name, r.profiles?.last_name, r.certification_number, r.batch_number
    ].some((v) => v?.toLowerCase().includes(q));

    const matchMonth = monthFilter === 'all' || (() => {
      if (!r.submitted_at) return false;
      const dt = new Date(r.submitted_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      return key === monthFilter;
    })();

    return matchTab && matchSearch && matchMonth;
  });

  const counts = {
    all: renewals.length,
    pending: renewals.filter((r) => ['submitted', 'under_review'].includes(r.status)).length,
    reviewing: renewals.filter((r) => ['payment_verification', 'document_verification'].includes(r.status)).length,
    recommended: renewals.filter((r) => ['recommended_approval', 'recommended_rejection'].includes(r.status)).length,
    ccpe: renewals.filter((r) => r.renewal_type === 'CCPE').length,
    pcpe: renewals.filter((r) => r.renewal_type === 'PCPE').length,
  };

  // Month options derived from actual submissions (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('en-PH', { month: 'long', year: 'numeric' }),
    };
  }).filter((o) => renewals.some((r) => {
    if (!r.submitted_at) return false;
    const dt = new Date(r.submitted_at);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}` === o.value;
  }));

  const DOC_LABELS: Record<string, string> = {
    profile_photo: '2x2 Photo',
    old_id: 'Old Certificate ID',
    regional_certificate: 'Regional Activity Certificate',
    national_certificate: 'National Activity Certificate',
    proof_of_payment: 'Proof of Payment',
    signature: 'Signature',
    other: 'Other Document',
  };

  // ── Review detail view ────────────────────────────────────────
  if (selected) {
    const p = selected.profiles;
    const memberName = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || 'Unknown Member';
    const profilePhoto = docs.find((d) => d.document_type === 'profile_photo');
    const signatureDoc = docs.find((d) => d.document_type === 'signature');
    const otherDocs = docs.filter((d) => d.document_type !== 'profile_photo' && d.document_type !== 'signature');

    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopBar title="Application Review" subtitle={`Reviewing — ${memberName}`} />

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          {/* ── Main scrollable content ── */}
          <div className="flex-1 overflow-y-auto p-6 min-w-0">
            <button
              onClick={() => setSelected(null)}
              className="btn-secondary mb-5 flex items-center gap-2 text-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Applications
            </button>

            {/* Member header card */}
            <div className="card p-5 mb-5 flex items-center gap-5">
              {profilePhoto ? (
                <img
                  src={profilePhoto.file_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-cpecb-border shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-cpecb-bg border-2 border-cpecb-border flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-navy-900 font-bold text-lg">{memberName}</h2>
                <p className="text-gray-500 text-sm">{p?.email ?? '—'}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`status-badge ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                  <span className="text-xs text-gray-400">
                    Submitted: {selected.submitted_at
                      ? new Date(selected.submitted_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                      : '—'}
                  </span>
                  <span className="bg-navy-100 text-navy-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {selected.renewal_type} Renewal
                  </span>
                </div>
              </div>
            </div>

            {/* Review tabs */}
            <div className="flex gap-1 mb-5 bg-cpecb-bg border border-cpecb-border rounded-lg p-1">
              {([
                { key: 'application', label: 'Application Data', icon: FileText },
                { key: 'documents', label: `Documents (${docs.length})`, icon: FileImage },
                { key: 'history', label: 'Status History', icon: History },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setReviewTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all
                    ${reviewTab === key ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-900'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>

            {/* ── Application Data tab ── */}
            {reviewTab === 'application' && (
              <div className="space-y-4">
                <SectionCard icon={User} title="Personal Information">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoRow label="Last Name" value={p?.last_name} />
                    <InfoRow label="First Name" value={p?.first_name} />
                    <InfoRow label="Middle Name" value={p?.middle_name} />
                    <InfoRow label="Email Address" value={p?.email} />
                    <InfoRow label="Communication Email" value={p?.communication_email} />
                    <InfoRow label="Mobile Number" value={p?.mobile_number} />
                    <InfoRow label="Place of Birth" value={p?.place_of_birth} />
                    <InfoRow label="ICPEP Region" value={p?.icpep_region} />
                  </div>
                </SectionCard>

                <SectionCard icon={MapPin} title="Address">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoRow label="Unit / House No." value={p?.unit_number} />
                    <InfoRow label="Village / Subdivision" value={p?.village_subdivision} />
                    <InfoRow label="Street" value={p?.street} />
                    <InfoRow label="Barangay" value={p?.barangay} />
                    <InfoRow label="City / Town" value={p?.city_town} />
                    <InfoRow label="ZIP Code" value={p?.zip_code} />
                  </div>
                </SectionCard>

                <SectionCard icon={CreditCard} title="Certification Details">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoRow label="Certification Type" value={p?.certification_type} />
                    <InfoRow label="Certification Number" value={p?.certification_number} mono />
                    <InfoRow label="Date Issued" value={p?.date_issued ? new Date(p.date_issued).toLocaleDateString('en-PH') : null} />
                    <InfoRow label="Expiration Date" value={p?.expiration_date ? new Date(p.expiration_date).toLocaleDateString('en-PH') : null} />
                    <InfoRow label="Cert. Status" value={p?.cert_status ?? null} />
                  </div>
                </SectionCard>

                <SectionCard icon={FileText} title="Renewal Application">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoRow label="Renewal Type" value={selected.renewal_type} />
                    <InfoRow label="Certification No." value={selected.certification_number} mono />
                    <InfoRow label="Date of ID Validity" value={selected.date_id_validity ? new Date(selected.date_id_validity).toLocaleDateString('en-PH') : null} />
                    <InfoRow label="Batch Number" value={selected.batch_number} mono />
                  </div>
                </SectionCard>

                <SectionCard icon={Banknote} title="Payment Details">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoRow label="Amount Paid"
                      value={selected.amount_paid != null
                        ? `PHP ${Number(selected.amount_paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                        : null} />
                    <InfoRow label="Bank Name" value={selected.bank_name} />
                    <InfoRow label="Branch Location" value={selected.branch_location} />
                    <InfoRow label="Deposit Date" value={selected.deposit_date ? new Date(selected.deposit_date).toLocaleDateString('en-PH') : null} />
                    <InfoRow label="Deposit Time" value={selected.deposit_time} />
                    <InfoRow label="Reference Number" value={selected.reference_number} mono />
                  </div>
                </SectionCard>

                <SectionCard icon={PenLine} title="Declaration & Signature">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <InfoRow label="Declaration Agreed" value={selected.declaration_agreed} />
                    <InfoRow label="Date Signed" value={selected.date_signed ? new Date(selected.date_signed).toLocaleDateString('en-PH') : null} />
                  </div>
                  {signatureDoc && (
                    <div>
                      <p className="text-gray-400 text-xs font-medium mb-2">Signature</p>
                      <div className="bg-gray-50 border border-cpecb-border rounded-xl p-4 inline-block">
                        <img
                          src={signatureDoc.file_url}
                          alt="Signature"
                          className="max-h-24 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).alt = 'Signature unavailable'; }}
                        />
                      </div>
                    </div>
                  )}
                </SectionCard>

                {selected.remarks && (
                  <SectionCard icon={MessageSquare} title="Previous Remarks">
                    <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                      {selected.remarks}
                    </p>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ── Documents tab ── */}
            {reviewTab === 'documents' && (
              <div className="space-y-6">
                {docs.length === 0 ? (
                  <div className="card p-16 text-center">
                    <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No documents uploaded</p>
                  </div>
                ) : (
                  <>
                    {/* Profile photo & signature inline at top */}
                    {(profilePhoto || signatureDoc) && (
                      <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">Identity</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {profilePhoto && <DocCard doc={profilePhoto} label="2x2 Photo" />}
                          {signatureDoc && <DocCard doc={signatureDoc} label="Signature" />}
                        </div>
                      </div>
                    )}

                    {/* Group remaining docs */}
                    {(() => {
                      const grouped = otherDocs.reduce((acc, d) => {
                        if (!acc[d.document_type]) acc[d.document_type] = [];
                        acc[d.document_type].push(d);
                        return acc;
                      }, {} as Record<string, Document[]>);

                      return Object.entries(grouped).map(([type, typeDocs]) => (
                        <div key={type}>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
                            {DOC_LABELS[type] ?? type} ({typeDocs.length})
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {typeDocs.map((doc) => (
                              <DocCard key={doc.id} doc={doc} label={DOC_LABELS[doc.document_type] ?? doc.document_type} />
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </>
                )}
              </div>
            )}

            {/* ── History tab ── */}
            {reviewTab === 'history' && (
              <div>
                {history.length === 0 ? (
                  <div className="card p-16 text-center">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No status history yet</p>
                  </div>
                ) : (
                  <div className="card divide-y divide-cpecb-border">
                    {history.map((h, i) => {
                      const changedBy = h.profiles
                        ? [h.profiles.first_name, h.profiles.last_name].filter(Boolean).join(' ')
                        : 'System';
                      return (
                        <div key={h.id} className="flex gap-4 px-5 py-4">
                          <div className="flex flex-col items-center gap-1 pt-0.5">
                            <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-royal-500' : 'bg-gray-300'}`} />
                            {i < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" style={{ minHeight: 20 }} />}
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`status-badge ${STATUS_COLORS[h.status]}`}>{STATUS_LABELS[h.status]}</span>
                              <span className="text-xs text-gray-400">by {changedBy}</span>
                            </div>
                            {h.remarks && (
                              <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">{h.remarks}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">
                              {new Date(h.created_at).toLocaleDateString('en-PH', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Actions sidebar ── */}
          <div className="lg:w-72 xl:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-cpecb-border overflow-y-auto p-5 space-y-4 bg-white">
            <div>
              <h3 className="text-navy-900 font-semibold text-sm mb-1">Current Status</h3>
              <span className={`status-badge ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>

            <div>
              <label className="label">Remarks / Notes</label>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                className="input-field min-h-[90px] resize-y text-sm"
                placeholder="Add remarks for the member..."
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Update Status</p>

              <button
                onClick={() => updateStatus('under_review')}
                disabled={saving}
                className="w-full flex items-center gap-2 py-2.5 px-4 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-medium transition-all disabled:opacity-50"
              >
                <Clock className="w-4 h-4 shrink-0" />
                Mark Under Review
              </button>
              <button
                onClick={() => updateStatus('payment_verification')}
                disabled={saving}
                className="w-full flex items-center gap-2 py-2.5 px-4 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 text-sm font-medium transition-all disabled:opacity-50"
              >
                <Banknote className="w-4 h-4 shrink-0" />
                Verify Payment
              </button>
              <button
                onClick={() => updateStatus('document_verification')}
                disabled={saving}
                className="w-full flex items-center gap-2 py-2.5 px-4 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-sm font-medium transition-all disabled:opacity-50"
              >
                <Eye className="w-4 h-4 shrink-0" />
                Verify Documents
              </button>

              <div className="border-t border-cpecb-border pt-2 space-y-2">
                <button
                  onClick={() => updateStatus('recommended_approval')}
                  disabled={saving}
                  className="w-full flex items-center gap-2 py-2.5 px-4 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 text-sm font-medium transition-all disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4 shrink-0" />
                  Recommend Approval
                </button>
                <button
                  onClick={() => updateStatus('recommended_rejection')}
                  disabled={saving}
                  className="w-full flex items-center gap-2 py-2.5 px-4 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-sm font-medium transition-all disabled:opacity-50"
                >
                  <ThumbsDown className="w-4 h-4 shrink-0" />
                  Recommend Rejection
                </button>
              </div>

              {saving && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-royal-500 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Application list view ─────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TopBar title="Applications Review" subtitle="Review and process member renewal applications" />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Status tab cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
          {([
            { tab: 'all' as Tab, label: 'Total', count: counts.all, color: 'text-royal-500' },
            { tab: 'pending' as Tab, label: 'Pending Review', count: counts.pending, color: 'text-yellow-600' },
            { tab: 'reviewing' as Tab, label: 'Under Verification', count: counts.reviewing, color: 'text-orange-600' },
            { tab: 'recommended' as Tab, label: 'Recommended', count: counts.recommended, color: 'text-teal-600' },
          ] as const).map(({ tab: t, label, count, color }) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`card p-4 text-left transition-all hover:shadow-card-hover ${tab === t ? 'ring-2 ring-royal-500' : ''}`}
            >
              <p className="text-gray-500 text-xs font-medium">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{count}</p>
            </button>
          ))}
          {/* CCPE & PCPE info cards */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-500 text-xs font-medium">CCPE</p>
              <Award className="w-3.5 h-3.5 text-royal-500" />
            </div>
            <p className="text-3xl font-bold text-royal-500">{counts.ccpe}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-gray-500 text-xs font-medium">PCPE</p>
              <Award className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <p className="text-3xl font-bold text-sky-500">{counts.pcpe}</p>
          </div>
        </div>

        {/* Search + month filter */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              placeholder="Search by name or cert no..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="input-field text-sm py-2 pr-8"
            >
              <option value="all">All Months</option>
              {monthOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-royal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cpecb-bg border-b border-cpecb-border">
                    {['Member', 'Cert. No.', 'Type', 'Region', 'Submitted', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const name = [r.profiles?.first_name, r.profiles?.last_name].filter(Boolean).join(' ') || '—';
                    return (
                      <tr key={r.id} className={`border-b border-cpecb-border hover:bg-blue-50/30 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-navy-900 whitespace-nowrap">{name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.profiles?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600 whitespace-nowrap">{r.certification_number}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="bg-navy-100 text-navy-700 text-xs font-semibold px-2 py-1 rounded-full">{r.renewal_type}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.profiles?.icpep_region ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`status-badge ${STATUS_COLORS[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openReview(r)}
                            className="flex items-center gap-1.5 text-royal-500 hover:text-royal-700 font-medium text-xs transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-4 h-4" />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
