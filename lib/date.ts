export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return startOfLocalDay(left).getTime() === startOfLocalDay(right).getTime();
}

export function isBeforeToday(date: Date, today = new Date()): boolean {
  return startOfLocalDay(date).getTime() < startOfLocalDay(today).getTime();
}

export function dateInputValue(date = new Date()): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
