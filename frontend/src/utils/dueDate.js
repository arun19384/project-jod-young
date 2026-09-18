export function getDaysUntilDue(dayString) {
  if (!dayString) return null;
  const match = String(dayString).match(/\d+/);
  if (!match) return null;
  const targetDay = parseInt(match[0], 10);
  if (isNaN(targetDay) || targetDay < 1 || targetDay > 31) return null;

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let targetDate = new Date(currentYear, currentMonth, targetDay);
  if (targetDay < currentDay) {
    targetDate = new Date(currentYear, currentMonth + 1, targetDay);
  }

  const diffTime = targetDate.getTime() - new Date(currentYear, currentMonth, currentDay).getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}
