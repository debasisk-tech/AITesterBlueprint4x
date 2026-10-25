import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Briefcase, 
  Linkedin, 
  FileText, 
  Calendar, 
  DollarSign, 
  FileEdit, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { COLUMNS } from '../constants/columns';
import { getTodayDateString } from '../utils/dateUtils';

export default function JobModal({
  isOpen,
  onClose,
  onSave,
  jobToEdit = null,
  initialStatus = 'wishlist',
  availableResumes = [],
}) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('wishlist');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [resumeUsed, setResumeUsed] = useState('');
  const [dateApplied, setDateApplied] = useState(getTodayDateString());
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (jobToEdit) {
      setCompany(jobToEdit.company || '');
      setRole(jobToEdit.role || '');
      setStatus(jobToEdit.status || 'wishlist');
      setLinkedInUrl(jobToEdit.linkedInUrl || '');
      setResumeUsed(jobToEdit.resumeUsed || '');
      setDateApplied(jobToEdit.dateApplied || getTodayDateString());
      setSalary(jobToEdit.salary || '');
      setNotes(jobToEdit.notes || '');
    } else {
      setCompany('');
      setRole('');
      setStatus(initialStatus || 'wishlist');
      setLinkedInUrl('');
      setResumeUsed(availableResumes[0] || 'SDE_Resume_v3');
      setDateApplied(getTodayDateString());
      setSalary('');
      setNotes('');
    }
    setErrors({});
  }, [jobToEdit, initialStatus, isOpen]);

  if (!isOpen) return null;

  function validate() {
    const errs = {};
    if (!company.trim()) {
      errs.company = 'Company name is required';
    }
    if (!role.trim()) {
      errs.role = 'Job title / role is required';
    }
    if (linkedInUrl.trim()) {
      try {
        const testUrl = linkedInUrl.startsWith('http') ? linkedInUrl : `https://${linkedInUrl}`;
        new URL(testUrl);
      } catch {
        errs.linkedInUrl = 'Please enter a valid URL';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    let cleanUrl = linkedInUrl.trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    onSave({
      id: jobToEdit ? jobToEdit.id : undefined,
      company: company.trim(),
      role: role.trim(),
      status,
      linkedInUrl: cleanUrl,
      resumeUsed: resumeUsed.trim(),
      dateApplied,
      salary: salary.trim(),
      notes: notes.trim(),
      order: jobToEdit ? jobToEdit.order : 0,
      createdAt: jobToEdit ? jobToEdit.createdAt : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {jobToEdit ? 'Edit Application' : 'Add New Job Application'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {jobToEdit ? 'Update details for this role' : 'Track a new opportunity in your pipeline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Google, Microsoft, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.company ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.company && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.company}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.role ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.role}
                </p>
              )}
            </div>
          </div>

          {/* Status Column & Date Applied */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kanban Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title} ({col.description})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Applied
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={dateApplied}
                  onChange={(e) => setDateApplied(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* LinkedIn Job URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              LinkedIn Job URL
            </label>
            <div className="relative">
              <Linkedin className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors.linkedInUrl ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {errors.linkedInUrl && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.linkedInUrl}
              </p>
            )}
          </div>

          {/* Resume Used & Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resume Used
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  list="resumes-list"
                  placeholder="e.g. SDE_Resume_v3"
                  value={resumeUsed}
                  onChange={(e) => setResumeUsed(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="resumes-list">
                  {availableResumes.map((r, i) => (
                    <option key={i} value={r} />
                  ))}
                </datalist>
              </div>
              {/* Quick Resume selection pills */}
              {availableResumes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {availableResumes.slice(0, 3).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResumeUsed(r)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        resumeUsed === r 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salary Range (Optional)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. ₹25-30 LPA or $150-180K"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes / Recruiter Info
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Referral by Alex, next round is System Design on Friday, tech stack: React + Go..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 custom-scrollbar"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              {jobToEdit ? 'Save Changes' : 'Create Job Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

