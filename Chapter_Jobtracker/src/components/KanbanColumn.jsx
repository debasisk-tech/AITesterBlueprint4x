import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Briefcase } from 'lucide-react';
import JobCard from './JobCard';

export default function KanbanColumn({ column, jobs = [], onAddJob, onEditJob, onDeleteJob }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const jobIds = jobs.map((j) => j.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[320px] min-w-[320px] max-w-[320px] h-[calc(100vh-210px)] min-h-[500px] rounded-2xl bg-slate-100/70 dark:bg-slate-900/40 border transition-colors duration-200 overflow-hidden ${
        isOver
          ? 'border-blue-400 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-lg'
          : 'border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 pb-2 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 select-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">
            {column.title}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${column.badge}`}>
            {jobs.length}
          </span>
        </div>

        {/* Quick add button */}
        <button
          type="button"
          onClick={() => onAddJob(column.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title={`Add job to ${column.title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Description subtitle */}
      <div className="px-3.5 py-1 text-[11px] text-slate-400 dark:text-slate-500 truncate">
        {column.description}
      </div>

      {/* Droppable & Scrollable Card Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          {jobs.length === 0 ? (
            <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
              <Briefcase className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1.5" />
              <p className="text-xs text-slate-400 dark:text-slate-500">
                No jobs in this stage
              </p>
              <button
                type="button"
                onClick={() => onAddJob(column.id)}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add card
              </button>
            </div>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onEdit={onEditJob}
                onDelete={onDeleteJob}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

