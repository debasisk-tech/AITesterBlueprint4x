import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { COLUMNS } from '../constants/columns';
import KanbanColumn from './KanbanColumn';
import JobCard from './JobCard';

export default function KanbanBoard({
  jobs = [],
  onUpdateJobStatus,
  onAddJob,
  onEditJob,
  onDeleteJob,
}) {
  const [activeJob, setActiveJob] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px movement before initiating drag to allow clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event) {
    const { active } = event;
    const currentJob = jobs.find((j) => j.id === active.id);
    if (currentJob) {
      setActiveJob(currentJob);
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeJobItem = jobs.find((j) => j.id === activeId);
    if (!activeJobItem) return;

    // Is 'over' a Column directly or another Job?
    const isOverColumn = COLUMNS.some((col) => col.id === overId);
    let targetStatus = null;

    if (isOverColumn) {
      targetStatus = overId;
    } else {
      const overJob = jobs.find((j) => j.id === overId);
      if (overJob) {
        targetStatus = overJob.status;
      }
    }

    if (targetStatus && activeJobItem.status !== targetStatus) {
      // Optimistic column switch during drag
      onUpdateJobStatus(activeId, targetStatus, 0, false);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveJob(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeJobItem = jobs.find((j) => j.id === activeId);
    if (!activeJobItem) return;

    const isOverColumn = COLUMNS.some((col) => col.id === overId);

    if (isOverColumn) {
      const newStatus = overId;
      onUpdateJobStatus(activeId, newStatus, 0, true);
    } else {
      const overJob = jobs.find((j) => j.id === overId);
      if (overJob) {
        const newStatus = overJob.status;
        const columnJobs = jobs.filter((j) => j.status === newStatus);
        const overIndex = columnJobs.findIndex((j) => j.id === overId);
        onUpdateJobStatus(activeId, newStatus, Math.max(0, overIndex), true);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto custom-scrollbar pb-6 pt-2">
        <div className="flex gap-4 px-4 sm:px-6 min-w-max">
          {COLUMNS.map((col) => {
            const columnJobs = jobs.filter((j) => j.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                jobs={columnJobs}
                onAddJob={onAddJob}
                onEditJob={onEditJob}
                onDeleteJob={onDeleteJob}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeJob ? (
          <JobCard
            job={activeJob}
            isOverlay={true}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

