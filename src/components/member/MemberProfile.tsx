import React, { useEffect, useState } from 'react';
import { Save, Camera, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ICPEP_REGIONS } from '../../types';
import TopBar from '../common/TopBar';

export default function MemberProfile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: '', middle_name: '', last_name: '',
    communication_email: '', mobile_number: '',
    place_of_birth: '', unit_number: '', village_subdivision: '',
    street: '', barangay: '', city_town: '', zip_code: '',
    icpep_region: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? '',
        middle_name: profile.middle_name ?? '',
        last_name: profile.last_name ?? '',
        communication_email: profile.communication_email ?? '',
        mobile_number: profile.mobile_number ?? '',
        place_of_birth: profile.place_of_birth ?? '',
        unit_number: profile.unit_number ?? '',
        village_subdivision: profile.village_subdivision ?? '',
        street: profile.street ?? '',
        barangay: profile.barangay ?? '',
        city_town: profile.city_town ?? '',
        zip_code: profile.zip_code ?? '',
        icpep_region: profile.icpep_region ?? '',
      });
    }
  }, [profile?.id]);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('id', profile!.id);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      await refreshProfile();
      setMsg({ type: 'success', text: 'Profile updated successfully.' });
    }
    setSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TopBar title="My Profile" subtitle="Manage your personal information and contact details" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {msg && (
            <div className={`flex items-center gap-3 rounded-xl p-4 text-sm ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {msg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {msg.text}
            </div>
          )}

          {/* Cert info (read-only) */}
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-royal-500 flex items-center justify-center text-white text-2xl font-bold">
                  {[profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('') || 'U'}
                </div>
              </div>
              <div>
                <h2 className="text-navy-900 font-bold text-xl">
                  {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Member'}
                </h2>
                <p className="text-gray-500 text-sm">{profile?.email}</p>
                <p className="text-gray-400 text-xs mt-0.5">{profile?.icpep_region} &mdash; {profile?.certification_type ?? 'No Certification'}</p>
              </div>
            </div>

            <div className="bg-cpecb-bg rounded-xl p-4">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">Certification Details (Read-Only)</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Certification No.', value: profile?.certification_number ?? '—' },
                  { label: 'Type', value: profile?.certification_type ?? '—' },
                  { label: 'Date Issued', value: profile?.date_issued ? new Date(profile.date_issued).toLocaleDateString('en-PH') : '—' },
                  { label: 'Expires', value: profile?.expiration_date ? new Date(profile.expiration_date).toLocaleDateString('en-PH') : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-gray-400 text-xs">{label}</p>
                    <p className="text-navy-900 font-semibold text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            {/* Personal info */}
            <div className="card p-6 mb-6">
              <h3 className="text-navy-900 font-semibold text-base mb-5 pb-3 border-b border-cpecb-border">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className="input-field" placeholder="First name" />
                </div>
                <div>
                  <label className="label">Middle Name</label>
                  <input value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} className="input-field" placeholder="Middle name" />
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className="input-field" placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="label">Communication Email</label>
                  <input type="email" value={form.communication_email} onChange={(e) => update('communication_email', e.target.value)} className="input-field" placeholder="For renewal updates" />
                </div>
                <div>
                  <label className="label">Mobile Number</label>
                  <input value={form.mobile_number} onChange={(e) => update('mobile_number', e.target.value)} className="input-field" placeholder="+63 9XX XXX XXXX" />
                </div>
                <div>
                  <label className="label">Place of Birth</label>
                  <input value={form.place_of_birth} onChange={(e) => update('place_of_birth', e.target.value)} className="input-field" placeholder="City, Province" />
                </div>
                <div>
                  <label className="label">ICPEP Region</label>
                  <select value={form.icpep_region} onChange={(e) => update('icpep_region', e.target.value)} className="input-field appearance-none">
                    <option value="">Select Region</option>
                    {ICPEP_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="card p-6 mb-6">
              <h3 className="text-navy-900 font-semibold text-base mb-5 pb-3 border-b border-cpecb-border">Address Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { field: 'unit_number', label: 'Unit Number', placeholder: 'Unit / Room No.' },
                  { field: 'village_subdivision', label: 'Village / Subdivision', placeholder: 'Subdivision' },
                  { field: 'street', label: 'Street', placeholder: 'Street name' },
                  { field: 'barangay', label: 'Barangay', placeholder: 'Barangay' },
                  { field: 'city_town', label: 'City / Town', placeholder: 'City or Municipality' },
                  { field: 'zip_code', label: 'Zip Code', placeholder: '1234', maxLength: 4 },
                ].map(({ field, label, placeholder, maxLength }) => (
                  <div key={field}>
                    <label className="label">{label}</label>
                    <input
                      value={(form as Record<string, string>)[field]}
                      onChange={(e) => update(field, e.target.value)}
                      className="input-field"
                      placeholder={placeholder}
                      maxLength={maxLength}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4" />Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
