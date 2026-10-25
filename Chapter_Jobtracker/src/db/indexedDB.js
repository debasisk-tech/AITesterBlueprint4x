import { openDB } from 'idb';
import { INITIAL_RESUMES } from '../constants/columns';
import { getTodayDateString } from '../utils/dateUtils';

const DB_NAME = 'JobTrackerDB';
const DB_VERSION = 1;
const JOBS_STORE = 'jobs';
const RESUMES_STORE = 'resumes';

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(JOBS_STORE)) {
          const store = db.createObjectStore(JOBS_STORE, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('dateApplied', 'dateApplied', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(RESUMES_STORE)) {
          db.createObjectStore(RESUMES_STORE, { keyPath: 'name' });
        }
      },
    });
  }
  return dbPromise;
}

const DEFAULT_SAMPLE_JOBS = [
  {
    id: 'job-seed-1',
    company: 'Stripe',
    role: 'Staff Frontend Engineer',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Stripe+Frontend',
    resumeUsed: 'Frontend_React_Resume',
    dateApplied: getTodayDateString(),
    salary: '$190,000 - $220,000',
    notes: 'Referral from Alex (ex-colleague). Focused on payment UI performance and design system.',
    status: 'wishlist',
    order: 0,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'job-seed-2',
    company: 'Google',
    role: 'Senior Software Engineer',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Google+Senior+Software+Engineer',
    resumeUsed: 'SDE_Resume_v3',
    dateApplied: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    salary: '₹48 - 55 LPA',
    notes: 'Submitted via careers portal with referral. Waiting for recruiter screening call.',
    status: 'applied',
    order: 0,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'job-seed-3',
    company: 'Razorpay',
    role: 'Lead SDET & Automation Architect',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Razorpay+SDET',
    resumeUsed: 'QA_Lead_Resume',
    dateApplied: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    salary: '₹38 - 45 LPA',
    notes: 'Messaged Talent Partner on LinkedIn on Wednesday. Followed up on progress.',
    status: 'followup',
    order: 0,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'job-seed-4',
    company: 'Microsoft',
    role: 'Principal QA Engineer',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Microsoft+Principal+QA',
    resumeUsed: 'QA_Lead_Resume',
    dateApplied: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
    salary: '₹42 - 50 LPA',
    notes: 'Round 1 (Hiring Manager) completed. Technical Architecture round scheduled for Friday 2 PM.',
    status: 'interview',
    order: 0,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'job-seed-5',
    company: 'Atlassian',
    role: 'Senior Fullstack Engineer (Jira Core)',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Atlassian+Senior+Engineer',
    resumeUsed: 'FullStack_Resume_2026',
    dateApplied: new Date(Date.now() - 86400000 * 20).toISOString().split('T')[0],
    salary: '₹52 LPA + $40K Equity',
    notes: 'Offer letter received! Reviewing team matching and benefits by coming Tuesday.',
    status: 'offer',
    order: 0,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'job-seed-6',
    company: 'Meta',
    role: 'Enterprise Systems QA Engineer',
    linkedInUrl: 'https://www.linkedin.com/jobs/search/?keywords=Meta+QA',
    resumeUsed: 'QA_Lead_Resume',
    dateApplied: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
    salary: '$180K',
    notes: 'Position closed due to internal re-allocation. Reapply in 6 months.',
    status: 'rejected',
    order: 0,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 15,
  },
];

export async function initSeedDataIfEmpty() {
  const db = await getDB();
  const count = await db.count(JOBS_STORE);
  if (count === 0) {
    const tx = db.transaction([JOBS_STORE, RESUMES_STORE], 'readwrite');
    for (const job of DEFAULT_SAMPLE_JOBS) {
      await tx.objectStore(JOBS_STORE).put(job);
    }
    for (const resume of INITIAL_RESUMES) {
      await tx.objectStore(RESUMES_STORE).put({ name: resume, createdAt: Date.now() });
    }
    await tx.done;
  }
}

export async function getAllJobs() {
  const db = await getDB();
  return await db.getAll(JOBS_STORE);
}

export async function saveJob(job) {
  const db = await getDB();
  const jobToSave = {
    ...job,
    id: job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    updatedAt: Date.now(),
    createdAt: job.createdAt || Date.now(),
  };
  await db.put(JOBS_STORE, jobToSave);

  // If a new resume is used, save it to resumes store
  if (jobToSave.resumeUsed && jobToSave.resumeUsed.trim()) {
    await saveResume(jobToSave.resumeUsed.trim());
  }

  return jobToSave;
}

export async function deleteJob(id) {
  const db = await getDB();
  await db.delete(JOBS_STORE, id);
  return id;
}

export async function updateJobStatus(id, newStatus, newOrder = 0) {
  const db = await getDB();
  const existing = await db.get(JOBS_STORE, id);
  if (!existing) return null;
  const updated = {
    ...existing,
    status: newStatus,
    order: newOrder,
    updatedAt: Date.now(),
  };
  await db.put(JOBS_STORE, updated);
  return updated;
}

export async function getAllResumes() {
  const db = await getDB();
  const storedResumes = await db.getAll(RESUMES_STORE);
  const names = new Set(storedResumes.map(r => r.name));
  INITIAL_RESUMES.forEach(r => names.add(r));

  // Also collect any resumes currently on jobs
  const jobs = await db.getAll(JOBS_STORE);
  jobs.forEach(j => {
    if (j.resumeUsed && j.resumeUsed.trim()) {
      names.add(j.resumeUsed.trim());
    }
  });

  return Array.from(names);
}

export async function saveResume(name) {
  if (!name || !name.trim()) return;
  const db = await getDB();
  await db.put(RESUMES_STORE, { name: name.trim(), createdAt: Date.now() });
}

export async function exportAllData() {
  const db = await getDB();
  const jobs = await db.getAll(JOBS_STORE);
  const resumes = await db.getAll(RESUMES_STORE);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    jobs,
    resumes,
  };
}

export async function importAllData(data) {
  if (!data || !Array.isArray(data.jobs)) {
    throw new Error('Invalid backup file format: missing jobs array');
  }
  const db = await getDB();
  const tx = db.transaction([JOBS_STORE, RESUMES_STORE], 'readwrite');
  
  // Clear existing
  await tx.objectStore(JOBS_STORE).clear();
  await tx.objectStore(RESUMES_STORE).clear();

  for (const job of data.jobs) {
    await tx.objectStore(JOBS_STORE).put(job);
  }

  if (Array.isArray(data.resumes)) {
    for (const r of data.resumes) {
      await tx.objectStore(RESUMES_STORE).put(r);
    }
  } else {
    for (const resume of INITIAL_RESUMES) {
      await tx.objectStore(RESUMES_STORE).put({ name: resume, createdAt: Date.now() });
    }
  }

  await tx.done;
  return await getAllJobs();
}

