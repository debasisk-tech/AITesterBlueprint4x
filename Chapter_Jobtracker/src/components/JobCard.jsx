import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Building2, 
  ExternalLink, 
  FileText, 
  Clock, 
  IndianRupee, 
  MoreVertical, 
  Edit3, 
  Trash2,
  GripVertical
} from 'lucide-react';
import { formatDaysAgo, formatReadableDate } from '../utils/dateUtils';
import { COLUMNS } from '../constants/columns';

export default function JobCard({ job, onEdit, onDelete, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job.id,
    data: {
      type: 'Job',
      job,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const columnConfig = COLUMNS.find(c => c.id === job.status) || COLUMNS[0];
  const daysAgoText = formatDaysAgo(job.dateApplied);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full h-36 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 opacity-60"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs hover:shadow-md transition-all duration-150 overflow-hidden border-l-[4px] ${columnConfig.accentBorder} ${
        isOverlay ? 'shadow-2xl ring-2 ring-blue-500/50 cursor-grabbing rotate-1 scale-[1.02]' : ''
      }`}
    >
      <div className="p-4">
        {/* Top Row: Company & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
            <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {job.role}
            </h4>
          </div>

          {/* Quick action buttons & Drag Handle */}
          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(job);
              }}
              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit application"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(job);
              }}
              className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete application"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div
              {...attributes}
              {...listeners}
              className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300"
              title="Drag to reorder or move stage"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Salary tag if available */}
        {job.salary && (
          <div className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 inline-block bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
            {job.salary}
          </div>
        )}

        {/* Notes preview if available */}
        {job.notes && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-950/40 p-2 rounded border border-slate-100 dark:border-slate-800/60">
            "{job.notes}"
          </p>
        )}

        {/* Resume Tag & LinkedIn link */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          {/* Resume pill badge */}
          {job.resumeUsed ? (
            <span 
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full max-w-[150px] truncate"
              title={`Resume: ${job.resumeUsed}`}
            >
              <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{job.resumeUsed}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">No resume tag</span>
          )}

          {/* LinkedIn Icon/Link */}
          {job.linkedInUrl ? (
            <a
              href={job.linkedInUrl.startsWith('http') ? job.linkedInUrl : `https://${job.linkedInUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex-shrink-0"
              title="Open LinkedIn Job"
            >
              <span>LinkedIn</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-600">No link</span>
          )}
        </div>

        {/* Bottom footer: Date applied / Days ago */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-1" title={`Date applied: ${job.dateApplied}`}>
            <Clock className="w-3 h-3" />
            <span>{daysAgoText || formatReadableDate(job.dateApplied)}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatReadableDate(job.dateApplied)}
          </span>
        </div>
      </div>
    </div>
  );
}

