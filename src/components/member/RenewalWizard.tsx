import React, { useRef, useState } from 'react';
import { Check, ChevronRight, ChevronLeft, User, FileText, PenLine } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ICPEP_REGIONS } from '../../types';
import FileUpload from '../common/FileUpload';
import TopBar from '../common/TopBar';
import { Page } from '../common/Sidebar';

interface RenewalWizardProps {
  onNavigate: (page: Page) => void;
}

interface Step1Data {
  lastName: string;
  firstName: string;
  middleName: string;
  email: string;
  communicationEmail: string;
  mobileNumber: string;
  placeOfBirth: string;
  unitNumber: string;
  villageSub: string;
  street: string;
  barangay: string;
  cityTown: string;
  zipCode: string;
  icpepRegion: string;
  profilePhoto: File[];
}

interface Step2Data {
  renewalType: 'CCPE' | 'PCPE' | '';
  certificationNumber: string;
  dateIdValidity: string;
  amountPaid: string;
  bankName: string;
  branchLocation: string;
  depositDate: string;
  depositTime: string;
  referenceNumber: string;
  batchNumber: string;
  oldId: File[];
  regionalCerts: File[];
  nationalCerts: File[];
  proofOfPayment: File[];
}

interface Step3Data {
  signature: File[];
  dateSigned: string;
  declared: boolean;
}

const steps = [
  { number: 1, label: 'Personal Information', icon: User },
  { number: 2, label: 'Renewal Requirements', icon: FileText },
  { number: 3, label: 'Declaration', icon: PenLine },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, idx) => {
        const done = current > step.number;
        const active = current === step.number;
        return (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-royal-500 text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}
              >
                {done ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${active ? 'text-navy-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-14px] sm:mt-[-8px] ${done ? 'bg-green-500' : 'bg-gray-200'}`} style={{ minWidth: 32, maxWidth: 80 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const emptyStep1: Step1Data = {
  lastName: '', firstName: '', middleName: '', email: '', communicationEmail: '',
  mobileNumber: '', placeOfBirth: '', unitNumber: '', villageSub: '', street: '',
  barangay: '', cityTown: '', zipCode: '', icpepRegion: '', profilePhoto: [],
};

const emptyStep2: Step2Data = {
  renewalType: '', certificationNumber: '', dateIdValidity: '', amountPaid: '',
  bankName: '', branchLocation: '', depositDate: '', depositTime: '', referenceNumber: '',
  batchNumber: '', oldId: [], regionalCerts: [], nationalCerts: [], proofOfPayment: [],
};

const emptyStep3: Step3Data = { signature: [], dateSigned: '', declared: false };

export default function RenewalWizard({ onNavigate }: RenewalWizardProps) {
  const { profile } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>({
    ...emptyStep1,
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    middleName: profile?.middle_name ?? '',
    email: profile?.email ?? '',
    communicationEmail: profile?.communication_email ?? '',
    mobileNumber: profile?.mobile_number ?? '',
    placeOfBirth: profile?.place_of_birth ?? '',
    unitNumber: profile?.unit_number ?? '',
    villageSub: profile?.village_subdivision ?? '',
    street: profile?.street ?? '',
    barangay: profile?.barangay ?? '',
    cityTown: profile?.city_town ?? '',
    zipCode: profile?.zip_code ?? '',
    icpepRegion: profile?.icpep_region ?? '',
  });
  const [step2, setStep2] = useState<Step2Data>({
    ...emptyStep2,
    certificationNumber: profile?.certification_number ?? '',
    renewalType: (profile?.certification_type as 'CCPE' | 'PCPE') ?? '',
  });
  const [step3, setStep3] = useState<Step3Data>(emptyStep3);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update1 = (k: keyof Step1Data, v: unknown) => setStep1((p) => ({ ...p, [k]: v }));
  const update2 = (k: keyof Step2Data, v: unknown) => setStep2((p) => ({ ...p, [k]: v }));
  const update3 = (k: keyof Step3Data, v: unknown) => setStep3((p) => ({ ...p, [k]: v }));

  const validateStep1 = () => {
    const errs: string[] = [];
    if (!step1.firstName.trim()) errs.push('First name is required.');
    if (!step1.lastName.trim()) errs.push('Last name is required.');
    if (!step1.communicationEmail.trim()) errs.push('Communication email is required.');
    if (!step1.mobileNumber.trim()) errs.push('Mobile number is required.');
    if (!step1.placeOfBirth.trim()) errs.push('Place of birth is required.');
    if (!step1.unitNumber.trim()) errs.push('Unit number is required.');
    if (!step1.villageSub.trim()) errs.push('Village / Subdivision is required.');
    if (!step1.street.trim()) errs.push('Street is required.');
    if (!step1.barangay.trim()) errs.push('Barangay is required.');
    if (!step1.cityTown.trim()) errs.push('City / Town is required.');
    if (!step1.zipCode.trim()) errs.push('Zip code is required.');
    if (!step1.icpepRegion) errs.push('ICPEP Region is required.');
    if (step1.profilePhoto.length === 0) errs.push('2x2 picture is required.');
    return errs;
  };

  const validateStep2 = () => {
    const errs: string[] = [];
    if (!step2.renewalType) errs.push('Renewal type is required.');
    if (!step2.certificationNumber.trim()) errs.push('Certification number is required.');
    if (!step2.dateIdValidity) errs.push('Date of ID validity is required.');
    if (!step2.amountPaid) errs.push('Amount paid is required.');
    if (!step2.bankName.trim()) errs.push('Bank name is required.');
    if (!step2.branchLocation.trim()) errs.push('Branch / Location is required.');
    if (!step2.depositDate) errs.push('Date of deposit is required.');
    if (!step2.depositTime) errs.push('Time of deposit is required.');
    if (!step2.referenceNumber.trim()) errs.push('Reference number is required.');
    if (step2.oldId.length === 0) errs.push('Old certification ID is required.');
    if (step2.regionalCerts.length < 2) errs.push('At least 2 regional activity certificates are required.');
    if (step2.nationalCerts.length < 1) errs.push('At least 1 national activity certificate is required.');
    if (step2.proofOfPayment.length === 0) errs.push('Proof of payment is required.');
    if (!step2.batchNumber.trim()) errs.push('Batch number is required.');
    return errs;
  };

  const validateStep3 = () => {
    const errs: string[] = [];
    if (step3.signature.length === 0) errs.push('Signature upload is required.');
    if (!step3.dateSigned) errs.push('Date signed is required.');
    if (!step3.declared) errs.push('You must certify that the information provided is true and correct.');
    return errs;
  };

  const handleNext = () => {
    const errs = step === 1 ? validateStep1() : step === 2 ? validateStep2() : validateStep3();
    setErrors(errs);
    if (errs.length === 0) {
      setStep((s) => s + 1);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('renewal-documents')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('renewal-documents').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    const errs = validateStep3();
    setErrors(errs);
    if (errs.length > 0) return;

    setSubmitting(true);
    setErrors([]);

    const folder = `${profile!.id}/${Date.now()}`;

    // ── Step 1: Upload all files to storage before touching the DB ──
    const uploadTasks: Array<{ file: File; type: string; label: string }> = [
      ...step1.profilePhoto.map((f) => ({ file: f, type: 'profile_photo', label: '2x2 Photo' })),
      ...step2.oldId.map((f) => ({ file: f, type: 'old_id', label: 'Old Certificate ID' })),
      ...step2.regionalCerts.map((f) => ({ file: f, type: 'regional_certificate', label: 'Regional Activity Certificate' })),
      ...step2.nationalCerts.map((f) => ({ file: f, type: 'national_certificate', label: 'National Activity Certificate' })),
      ...step2.proofOfPayment.map((f) => ({ file: f, type: 'proof_of_payment', label: 'Proof of Payment' })),
      ...step3.signature.map((f) => ({ file: f, type: 'signature', label: 'Signature' })),
    ];

    type UploadedDoc = { type: string; file: File; url: string };
    const uploaded: UploadedDoc[] = [];
    const uploadFailures: string[] = [];

    for (const { file, type, label } of uploadTasks) {
      try {
        const url = await uploadFile(file, `${folder}/${type}/${file.name}`);
        uploaded.push({ type, file, url });
      } catch (err: unknown) {
        uploadFailures.push(`${label} — ${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`);
      }
    }

    if (uploadFailures.length > 0) {
      setErrors([
        'Some files could not be uploaded. Please check the files below and try again:',
        ...uploadFailures,
      ]);
      setSubmitting(false);
      return;
    }

    // ── Step 2: All uploads succeeded — commit to DB ──
    try {
      const { data: renewal, error: renewalError } = await supabase
        .from('renewals')
        .insert({
          member_id: profile!.id,
          renewal_type: step2.renewalType,
          certification_number: step2.certificationNumber,
          date_id_validity: step2.dateIdValidity || null,
          amount_paid: step2.amountPaid ? parseFloat(step2.amountPaid) : null,
          bank_name: step2.bankName,
          branch_location: step2.branchLocation,
          deposit_date: step2.depositDate || null,
          deposit_time: step2.depositTime || null,
          reference_number: step2.referenceNumber,
          batch_number: step2.batchNumber,
          date_signed: step3.dateSigned || null,
          declaration_agreed: step3.declared,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (renewalError) throw renewalError;

      for (const { type, file, url } of uploaded) {
        const { error: docErr } = await supabase.from('documents').insert({
          renewal_id: renewal.id,
          document_type: type,
          file_name: file.name,
          file_url: url,
          file_size: file.size,
        });
        if (docErr) throw new Error(`Failed to save document record for ${file.name}: ${docErr.message}`);
      }

      await supabase.from('renewal_status_history').insert({
        renewal_id: renewal.id,
        status: 'submitted',
        changed_by: profile!.id,
        remarks: 'Application submitted by member',
      });

      await supabase.from('notifications').insert({
        user_id: profile!.id,
        title: 'Renewal Application Submitted',
        message: 'Your renewal application has been successfully submitted and is awaiting verification by CPECB.',
        type: 'success',
      });

      setSubmitted(true);
    } catch (err: unknown) {
      setErrors([err instanceof Error ? err.message : 'Submission failed. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TopBar title="Renewal Application" subtitle="CCPE / PCPE Certification Renewal" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="card p-10 max-w-lg w-full text-center animate-fadeInUp">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-navy-900 text-2xl font-bold mb-3">
              Renewal Application Successfully Submitted
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              Your renewal application has been successfully submitted and is awaiting verification by the Computer Engineering Certification Board (CPECB).
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              An acknowledgment notification has been sent to your account.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Please monitor your registered communication email address for future communications.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => onNavigate('history')} className="btn-primary">
                Track Application
              </button>
              <button onClick={() => onNavigate('dashboard')} className="btn-secondary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TopBar title="Renewal Application" subtitle="CCPE / PCPE Certification Renewal" />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <StepIndicator current={step} />

          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-semibold text-sm mb-2">Please correct the following:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((e, i) => (
                  <li key={i} className="text-red-600 text-sm">{e}</li>
                ))}
              </ul>
            </div>
          )}

          {step === 1 && <Step1 data={step1} update={update1} />}
          {step === 2 && <Step2 data={step2} update={update2} />}
          {step === 3 && <Step3 data={step3} update={update3} />}

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => {
                setErrors([]);
                setStep((s) => s - 1);
                scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={step === 1}
              className="btn-secondary flex items-center gap-2 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-primary flex items-center gap-2">
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                ) : (
                  <><Check className="w-4 h-4" />Submit Renewal Application</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-navy-900 font-semibold text-base mb-5 pb-3 border-b border-cpecb-border">{title}</h3>
      {children}
    </div>
  );
}

function Step1({ data, update }: { data: Step1Data; update: (k: keyof Step1Data, v: unknown) => void }) {
  return (
    <div className="animate-fadeInUp">
      <FieldGroup title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Last Name <span className="text-red-500">*</span></label>
            <input value={data.lastName} onChange={(e) => update('lastName', e.target.value)} className="input-field" placeholder="Dela Cruz" />
          </div>
          <div>
            <label className="label">First Name <span className="text-red-500">*</span></label>
            <input value={data.firstName} onChange={(e) => update('firstName', e.target.value)} className="input-field" placeholder="Juan" />
          </div>
          <div>
            <label className="label">Middle Name</label>
            <input value={data.middleName} onChange={(e) => update('middleName', e.target.value)} className="input-field" placeholder="Santos" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={data.email} onChange={(e) => update('email', e.target.value)} className="input-field" placeholder="your@email.com" />
          </div>
          <div>
            <label className="label">
              Communication Email <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1 text-xs">— for renewal updates</span>
            </label>
            <input type="email" value={data.communicationEmail} onChange={(e) => update('communicationEmail', e.target.value)} className="input-field" placeholder="comms@email.com" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="label">Philippine Cell Phone Number <span className="text-red-500">*</span></label>
            <input value={data.mobileNumber} onChange={(e) => update('mobileNumber', e.target.value)} className="input-field" placeholder="+63 9XX XXX XXXX" />
          </div>
          <div>
            <label className="label">Place of Birth <span className="text-red-500">*</span></label>
            <input value={data.placeOfBirth} onChange={(e) => update('placeOfBirth', e.target.value)} className="input-field" placeholder="City, Province" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Address Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Unit Number <span className="text-red-500">*</span></label>
            <input value={data.unitNumber} onChange={(e) => update('unitNumber', e.target.value)} className="input-field" placeholder="Unit / Room No." />
          </div>
          <div>
            <label className="label">Village / Subdivision <span className="text-red-500">*</span></label>
            <input value={data.villageSub} onChange={(e) => update('villageSub', e.target.value)} className="input-field" placeholder="Subdivision name" />
          </div>
          <div>
            <label className="label">Street <span className="text-red-500">*</span></label>
            <input value={data.street} onChange={(e) => update('street', e.target.value)} className="input-field" placeholder="Street name" />
          </div>
          <div>
            <label className="label">Barangay <span className="text-red-500">*</span></label>
            <input value={data.barangay} onChange={(e) => update('barangay', e.target.value)} className="input-field" placeholder="Barangay" />
          </div>
          <div>
            <label className="label">City / Town <span className="text-red-500">*</span></label>
            <input value={data.cityTown} onChange={(e) => update('cityTown', e.target.value)} className="input-field" placeholder="City or Municipality" />
          </div>
          <div>
            <label className="label">Zip Code <span className="text-red-500">*</span></label>
            <input value={data.zipCode} onChange={(e) => update('zipCode', e.target.value)} className="input-field" placeholder="1234" maxLength={4} />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Membership Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">ICPEP Region <span className="text-red-500">*</span></label>
            <select value={data.icpepRegion} onChange={(e) => update('icpepRegion', e.target.value)} className="input-field appearance-none">
              <option value="">Select Region</option>
              {ICPEP_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="2x2 Picture">
        <FileUpload
          label="Upload 2x2 Picture"
          accept=".jpg,.jpeg,.png"
          files={data.profilePhoto}
          onChange={(f) => update('profilePhoto', f)}
          hint="JPG or PNG format, white background preferred"
          maxSize={5 * 1024 * 1024}
          required
        />
      </FieldGroup>
    </div>
  );
}

function Step2({ data, update }: { data: Step2Data; update: (k: keyof Step2Data, v: unknown) => void }) {
  return (
    <div className="animate-fadeInUp">
      <FieldGroup title="Renewal Type">
        <div className="flex gap-6">
          {(['CCPE', 'PCPE'] as const).map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${data.renewalType === type ? 'border-royal-500 bg-royal-500' : 'border-gray-300 group-hover:border-royal-400'}`}>
                {data.renewalType === type && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <input type="radio" className="sr-only" value={type} checked={data.renewalType === type} onChange={() => update('renewalType', type)} />
              <span className={`font-semibold ${data.renewalType === type ? 'text-royal-500' : 'text-gray-600'}`}>{type} Renewal</span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Certification Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Certification Number <span className="text-red-500">*</span></label>
            <input value={data.certificationNumber} onChange={(e) => update('certificationNumber', e.target.value)} className="input-field font-mono" placeholder="CPECB-XXXX-XXXX" />
          </div>
          <div>
            <label className="label">Date of ID Validity <span className="text-red-500">*</span></label>
            <input type="date" value={data.dateIdValidity} onChange={(e) => update('dateIdValidity', e.target.value)} className="input-field" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Payment Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Amount Paid (PHP) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="0.01" value={data.amountPaid} onChange={(e) => update('amountPaid', e.target.value)} className="input-field" placeholder="0.00" />
          </div>
          <div>
            <label className="label">Batch Number <span className="text-red-500">*</span></label>
            <input value={data.batchNumber} onChange={(e) => update('batchNumber', e.target.value)} className="input-field" placeholder="BATCH-XXXX" />
          </div>
          <div>
            <label className="label">Bank Name <span className="text-red-500">*</span></label>
            <input value={data.bankName} onChange={(e) => update('bankName', e.target.value)} className="input-field" placeholder="BPI, BDO, Metrobank..." />
          </div>
          <div>
            <label className="label">Branch / Location <span className="text-red-500">*</span></label>
            <input value={data.branchLocation} onChange={(e) => update('branchLocation', e.target.value)} className="input-field" placeholder="Branch name and location" />
          </div>
          <div>
            <label className="label">Date of Deposit / Transfer <span className="text-red-500">*</span></label>
            <input type="date" value={data.depositDate} onChange={(e) => update('depositDate', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Time of Deposit / Transfer <span className="text-red-500">*</span></label>
            <input type="time" value={data.depositTime} onChange={(e) => update('depositTime', e.target.value)} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Reference Number <span className="text-red-500">*</span></label>
            <input value={data.referenceNumber} onChange={(e) => update('referenceNumber', e.target.value)} className="input-field font-mono" placeholder="Transaction reference number" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Document Uploads">
        <div className="space-y-6">
          <FileUpload
            label="Old Certification ID"
            accept=".jpg,.jpeg,.png,.pdf"
            files={data.oldId}
            onChange={(f) => update('oldId', f)}
            hint="Upload picture of your old certification ID"
            required
          />

          <div className="border-t border-cpecb-border pt-5">
            <FileUpload
              label="Regional Activities Attended (min. 2)"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              maxFiles={5}
              files={data.regionalCerts}
              onChange={(f) => update('regionalCerts', f)}
              hint="At least 2 regional activities within the last 3 years"
              required
            />
            {data.regionalCerts.length > 0 && data.regionalCerts.length < 2 && (
              <p className="text-yellow-600 text-xs mt-2">
                {2 - data.regionalCerts.length} more file(s) required.
              </p>
            )}
            {data.regionalCerts.length >= 2 && (
              <p className="text-green-600 text-xs mt-2">
                {data.regionalCerts.length} file(s) uploaded. Requirement met.
              </p>
            )}
          </div>

          <div className="border-t border-cpecb-border pt-5">
            <FileUpload
              label="National Activities Attended (min. 1)"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              maxFiles={5}
              files={data.nationalCerts}
              onChange={(f) => update('nationalCerts', f)}
              hint="At least 1 national activity within the last 3 years"
              required
            />
          </div>

          <div className="border-t border-cpecb-border pt-5">
            <FileUpload
              label="Proof of Payment"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              maxFiles={3}
              files={data.proofOfPayment}
              onChange={(f) => update('proofOfPayment', f)}
              hint="Official receipt, deposit slip, or proof of transfer"
              required
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}

function Step3({ data, update }: { data: Step3Data; update: (k: keyof Step3Data, v: unknown) => void }) {
  return (
    <div className="animate-fadeInUp">
      <div className="card p-6 mb-6 border-l-4 border-navy-900">
        <h3 className="text-navy-900 font-bold text-lg mb-3">Renewal Application Declaration</h3>
        <p className="text-gray-700 text-sm leading-relaxed italic">
          I certify that the foregoing information and the attached documents are true and correct.
          I am fully aware that any false or misleading statements on this form or on the attachments
          will be grounds for the disqualification of Certification Application/Renewal.
        </p>
      </div>

      <FieldGroup title="Signature & Date">
        <div className="space-y-5">
          <FileUpload
            label="Upload Signature"
            accept=".jpg,.jpeg,.png"
            files={data.signature}
            onChange={(f) => update('signature', f)}
            hint="Clear signature on white background, JPG or PNG"
            required
          />
          <div>
            <label className="label">Date Signed <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={data.dateSigned}
              onChange={(e) => update('dateSigned', e.target.value)}
              className="input-field max-w-xs"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </FieldGroup>

      <div className="card p-6">
        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <input
            type="checkbox"
            className="sr-only"
            checked={data.declared}
            onChange={(e) => update('declared', e.target.checked)}
          />
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${data.declared ? 'border-royal-500 bg-royal-500' : 'border-gray-300 group-hover:border-royal-400'}`}
          >
            {data.declared && <Check className="w-3 h-3 text-white pointer-events-none" />}
          </div>
          <span className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-navy-900">I certify that</span> all information provided is true and correct.
            I understand that any false declarations may result in the disqualification of my renewal application.
          </span>
        </label>
      </div>
    </div>
  );
}
