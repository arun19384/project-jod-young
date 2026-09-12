const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function parseTransactionDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  match = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})/);
  if (match && MONTHS[match[2].toLowerCase()] !== undefined) {
    return new Date(new Date().getFullYear(), MONTHS[match[2].toLowerCase()], Number(match[1]));
  }
  return null;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isTransactionToday(transaction) {
  const date = parseTransactionDate(transaction?.date);
  return date ? sameDay(date, new Date()) : transaction?.today === true;
}

export function isTransactionInCurrentMonth(transaction) {
  const date = parseTransactionDate(transaction?.date);
  const now = new Date();
  return date ? date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() : true;
}

export function toDateInputValue(value) {
  const date = parseTransactionDate(value);
  if (!date) return new Date().toISOString().slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function displayTransactionWhen(transaction) {
  const date = parseTransactionDate(transaction?.date);
  const rawWhen = String(transaction?.when || '').trim();
  if (!date) return rawWhen || 'ไม่ระบุวันที่';
  if (sameDay(date, new Date())) return rawWhen || 'วันนี้';
  const time = rawWhen.match(/(\d{1,2}:\d{2}(?:\s*น\.)?)/)?.[1];
  const dateLabel = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  return time ? `${dateLabel} · ${time}` : dateLabel;
}

export function isSystemTransaction(transaction) {
  return transaction?.c === 'โอนเงิน' || transaction?.c === 'ชำระบัตรเครดิต';
}
