import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import KanbanBoard from './components/KanbanBoard';
import JobModal from './components/JobModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import BackupModal from './components/BackupModal';
import { 
  initSeedDataIfEmpty, 
  getAllJobs, 
  saveJob, 
  deleteJob, 
  updateJobStatus, 
  getAllResumes 
} from './db/indexedDB';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Theme state
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('jobtracker_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResume, setSelectedResume] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');

  // Modal states
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [modalInitialStatus, setModalInitialStatus] = useState('wishlist');
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, job: null });
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Sync theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('jobtracker_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  // Load initial data from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        await initSeedDataIfEmpty();
        const [loadedJobs, loadedResumes] = await Promise.all([
          getAllJobs(),
          getAllResumes(),
        ]);
        setJobs(loadedJobs);
        setResumes(loadedResumes);
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Refresh resume list helper
  async function refreshResumes() {
    try {
      const updatedResumes = await getAllResumes();
      setResumes(updatedResumes);
    } catch (e) {
      console.error(e);
    }
  }

  // Save / Edit Job Handler
  async function handleSaveJob(jobData) {
    try {
      const saved = await saveJob(jobData);
      setJobs((prev) => {
        const existingIdx = prev.findIndex((j) => j.id === saved.id);
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      await refreshResumes();
    } catch (err) {
      console.error('Error saving job application to IndexedDB:', err);
    }
  }

  // Delete Job Handler
  async function handleConfirmDelete() {
    if (!deleteModalState.job) return;
    const jobId = deleteModalState.job.id;
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setDeleteModalState({ isOpen: false, job: null });
      await refreshResumes();
    } catch (err) {
      console.error('Error deleting job from IndexedDB:', err);
    }
  }

  // Status & Drag Update Handler
  async function handleUpdateJobStatus(jobId, newStatus, newOrder = 0, persistToDB = true) {
    // Optimistic UI state update
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: newStatus, order: newOrder } : j
      )
    );

    if (persistToDB) {
      try {
        await updateJobStatus(jobId, newStatus, newOrder);
      } catch (err) {
        console.error('Error persisting job status update:', err);
      }
    }
  }

  // Modal openers
  function handleOpenNewJobModal(columnId = 'wishlist') {
    setJobToEdit(null);
    setModalInitialStatus(columnId);
    setIsJobModalOpen(true);
  }

  function handleOpenEditJobModal(job) {
    setJobToEdit(job);
    setModalInitialStatus(job.status);
    setIsJobModalOpen(true);
  }

  function handleOpenDeleteModal(job) {
    setDeleteModalState({ isOpen: true, job });
  }

  function handleDataRestored(restoredJobs) {
    setJobs(restoredJobs);
    refreshResumes();
  }

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Search query filter (company or role)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchCompany = job.company?.toLowerCase().includes(query);
          const matchRole = job.role?.toLowerCase().includes(query);
          const matchNotes = job.notes?.toLowerCase().includes(query);
          if (!matchCompany && !matchRole && !matchNotes) return false;
        }

        // Resume filter
        if (selectedResume !== 'ALL') {
          if (job.resumeUsed !== selectedResume) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') {
          return new Date(b.dateApplied || 0) - new Date(a.dateApplied || 0);
        }
        if (sortOrder === 'oldest') {
          return new Date(a.dateApplied || 0) - new Date(b.dateApplied || 0);
        }
        if (sortOrder === 'company-az') {
          return (a.company || '').localeCompare(b.company || '');
        }
        if (sortOrder === 'role-az') {
          return (a.role || '').localeCompare(b.role || '');
        }
        return 0;
      });
  }, [jobs, searchQuery, selectedResume, sortOrder]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenNewJobModal={() => handleOpenNewJobModal('wishlist')}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        totalJobs={jobs.length}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedResume={selectedResume}
        onResumeChange={setSelectedResume}
        availableResumes={resumes}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        totalJobs={jobs.length}
        filteredJobsCount={filteredJobs.length}
      />

      {/* Main Kanban Content Area */}
      <main className="flex-1 flex flex-col pt-3">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Loading your IndexedDB job applications...
            </p>
          </div>
        ) : (
          <KanbanBoard
            jobs={filteredJobs}
            onUpdateJobStatus={handleUpdateJobStatus}
            onAddJob={handleOpenNewJobModal}
            onEditJob={handleOpenEditJobModal}
            onDeleteJob={handleOpenDeleteModal}
          />
        )}
      </main>

      {/* Add / Edit Job Modal */}
      <JobModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        onSave={handleSaveJob}
        jobToEdit={jobToEdit}
        initialStatus={modalInitialStatus}
        availableResumes={resumes}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, job: null })}
        onConfirm={handleConfirmDelete}
        jobTitle={deleteModalState.job?.role}
        company={deleteModalState.job?.company}
      />

      {/* Backup and Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={handleDataRestored}
        jobsCount={jobs.length}
      />
    </div>
  );
}

