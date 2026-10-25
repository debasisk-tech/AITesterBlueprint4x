export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDaysAgo(dateString) {
  if (!dateString) return '';
  const applied = new Date(dateString);
  if (isNaN(applied.getTime())) return '';

  const now = new Date();
  // reset hours to compare purely by calendar day
  const d1 = new Date(applied.getFullYear(), applied.getMonth(), applied.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Applied today';
  if (diffDays === 1) return 'Applied 1d ago';
  if (diffDays > 1) return `Applied ${diffDays}d ago`;
  if (diffDays === -1) return 'Tomorrow';
  return `In ${Math.abs(diffDays)}d`;
}

export function formatReadableDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

