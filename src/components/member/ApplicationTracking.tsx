import React, { useEffect, useState } from 'react';
import { Clock, FileText, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Renewal, RenewalStatusHistory, STATUS_LABELS, STATUS_COLORS } from '../../types';
import TopBar from '../common/TopBar';

const STATUS_TIMELINE: Array<Renewal['status']> = [
  'submitted', 'under_review', 'payment_verification',
  'document_verification', 'recommended_approval', 'approved',
];

function StatusTimeline({ currentStatus, history }: { currentStatus: Renewal['status']; history: RenewalStatusHistory[] }) {
  const isRejected = currentStatus === 'rejected' || currentStatus === 'recommended_rejection';

  return (
    <div className="relative">
      {STATUS_TIMELINE.map((status, idx) => {
        const historyEntry = history.find((h) => h.status === status);
        const reached = STATUS_TIMELINE.indexOf(currentStatus) >= idx || historyEntry;
        const isCurrent = currentStatus === status;
        const isLast = idx === STATUS_TIMELINE.length - 1;

        return (
          <div key={status} className="flex gap-4 pb-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  isCurrent && !isRejected ? 'border-royal-500 bg-royal-500 text-white shadow-md' :
                  reached && !isRejected ? 'border-green-500 bg-green-500 text-white' :
                  'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {reached && !isCurrent ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 mt-1 ${reached && !isRejected ? 'bg-green-400' : 'bg-gray-200'}`} style={{ minHeight: 16 }} />
              )}
            </div>
            <div className="pt-1 pb-2 min-w-0">
              <p className={`text-sm font-semibold ${isCurrent && !isRejected ? 'text-royal-600' : reached ? 'text-navy-900' : 'text-gray-400'}`}>
                {STATUS_LABELS[status]}
              </p>
              {historyEntry && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(historyEntry.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {historyEntry?.remarks && (
                <p className="text-xs text-gray-500 mt-1 italic">{historyEntry.remarks}</p>
              )}
            </div>
          </div>
        );
      })}

      {isRejected && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-red-500 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="pt-1">
            <p className="text-sm font-semibold text-red-600">
              {currentStatus === 'recommended_rejection' ? 'Recommended for Rejection' : 'Rejected'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function RenewalCard({ renewal }: { renewal: Renewal }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<RenewalStatusHistory[]>([]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('renewal_status_history')
      .select('*')
      .eq('renewal_id', renewal.id)
      .order('created_at', { ascending: true });
    setHistory(data ?? []);
  };

  const handleToggle = () => {
    if (!expanded) loadHistory();
    setExpanded(!expanded);
  };

  return (
    <div className="card overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors flex items-start justify-between gap-4"
        onClick={handleToggle}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            renewal.status === 'approved' ? 'bg-green-100' :
            renewal.status === 'rejected' ? 'bg-red-100' :
            'bg-blue-100'
          }`}>
            {renewal.status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
             renewal.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-600" /> :
             <FileText className="w-5 h-5 text-royal-500" />}
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-navy-900 font-semibold text-base">{renewal.renewal_type} Renewal</h3>
              <span className={`status-badge ${STATUS_COLORS[renewal.status]}`}>
                {STATUS_LABELS[renewal.status]}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              Cert. No.: <span className="font-mono text-navy-900">{renewal.certification_number}</span>
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              {renewal.submitted_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Submitted {new Date(renewal.submitted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {renewal.batch_number && <span>Batch: {renewal.batch_number}</span>}
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-navy-900 transition-colors shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-cpecb-border p-5 bg-cpecb-bg animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-navy-900 font-semibold text-sm mb-3">Application Progress</h4>
              <StatusTimeline currentStatus={renewal.status} history={history} />
            </div>
            <div>
              <h4 className="text-navy-900 font-semibold text-sm mb-3">Application Details</h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Renewal Type', value: `${renewal.renewal_type} Renewal` },
                  { label: 'Certification No.', value: renewal.certification_number, mono: true },
                  { label: 'Batch Number', value: renewal.batch_number ?? '—' },
                  { label: 'Amount Paid', value: renewal.amount_paid ? `PHP ${renewal.amount_paid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—' },
                  { label: 'Bank', value: renewal.bank_name ?? '—' },
                  { label: 'Reference No.', value: renewal.reference_number ?? '—', mono: true },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-medium text-navy-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
                  </div>
                ))}
              </div>
              {renewal.remarks && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Officer Remarks</p>
                  <p className="text-sm text-yellow-700">{renewal.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationTracking() {
  const { profile } = useAuth();
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('renewals')
      .select('*')
      .eq('member_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRenewals(data ?? []))
      .finally(() => setLoading(false));
  }, [profile?.id]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TopBar title="My Applications" subtitle="Track the status of your renewal applications" />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-royal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : renewals.length === 0 ? (
          <div className="card p-16 text-center max-w-lg mx-auto">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-navy-900 font-semibold text-lg mb-2">No Applications Yet</h3>
            <p className="text-gray-500 text-sm">
              You haven't submitted any renewal applications. Start your renewal process to track your progress here.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">{renewals.length} application{renewals.length !== 1 ? 's' : ''} found</p>
            </div>
            {renewals.map((r) => <RenewalCard key={r.id} renewal={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
