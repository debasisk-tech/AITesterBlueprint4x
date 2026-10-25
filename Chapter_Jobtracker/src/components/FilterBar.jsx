import React from 'react';
import { Search, X, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedResume,
  onResumeChange,
  availableResumes = [],
  sortOrder,
  onSortChange,
  totalJobs = 0,
  filteredJobsCount = 0,
}) {
  const hasActiveFilters = searchQuery.trim() !== '' || selectedResume !== 'ALL' || sortOrder !== 'newest';

  function handleResetFilters() {
    onSearchChange('');
    onResumeChange('ALL');
    onSortChange('newest');
  }

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Search input */}
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search company or role (e.g. Google, Frontend)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Resume Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedResume}
              onChange={(e) => onResumeChange(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-hidden font-medium text-xs cursor-pointer"
            >
              <option value="ALL">All Resumes</option>
              {availableResumes.map((resume) => (
                <option key={resume} value={resume}>
                  {resume}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-hidden font-medium text-xs cursor-pointer"
            >
              <option value="newest">Sort: Newest Applied</option>
              <option value="oldest">Sort: Oldest Applied</option>
              <option value="company-az">Sort: Company (A-Z)</option>
              <option value="role-az">Sort: Role (A-Z)</option>
            </select>
          </div>

          {/* Reset button if filtered */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Reset all search & filters"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          {/* Filter stats pill */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-md">
            Showing {filteredJobsCount} of {totalJobs}
          </div>
        </div>
      </div>
    </div>
  );
}

