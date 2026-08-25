export function formatHour(hour: number): string {
  if (hour === 24) return "12:00 AM";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}
