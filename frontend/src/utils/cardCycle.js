function parseISODate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function latestCardCutoff(cutDay, now = new Date()) {
  const requestedDay = Number.parseInt(cutDay, 10);
  if (!Number.isFinite(requestedDay) || requestedDay < 1) return null;

  const makeCutoff = (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return endOfDay(new Date(year, month, Math.min(requestedDay, lastDay)));
  };

  return makeCutoff(now.getFullYear(), now.getMonth());
}

export function isAfterLatestCardCutoff(transaction, cutDay, now = new Date()) {
  const date = parseISODate(transaction?.date);
  const cutoff = latestCardCutoff(cutDay, now);
  return Boolean(
    date && cutoff &&
    now > cutoff &&
    date.getFullYear() === cutoff.getFullYear() &&
    date.getMonth() === cutoff.getMonth() &&
    date > cutoff && date <= endOfDay(now)
  );
}

export function isNextMonthKtcCharge(transaction, card, now = new Date()) {
  return /^KTC/i.test(String(card?.name || '').trim()) &&
    Number.parseInt(card?.cut, 10) === 19 &&
    !transaction?.income &&
    transaction?.c !== 'โอนเงิน' &&
    transaction?.c !== 'ชำระบัตรเครดิต' &&
    matchesCard(transaction, card) &&
    isAfterLatestCardCutoff(transaction, card.cut, now);
}

function matchesCard(transaction, card) {
  const account = String(transaction?.acct || '').trim().toLowerCase();
  return [card?.id, card?.name]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .includes(account);
}

export function splitCardBalance(card, transactions = [], now = new Date()) {
  const totalOutstanding = Math.max(0, Number(card?.amt) || 0);
  const pendingCharges = transactions
    .filter((tx) => isNextMonthKtcCharge(tx, card, now))
    .reduce((sum, tx) => sum + Math.max(0, Number(tx?.a) || 0), 0);
  const pendingAmount = Math.min(totalOutstanding, pendingCharges);

  return {
    ...card,
    amt: Math.max(0, totalOutstanding - pendingAmount),
    pendingAmount,
    totalOutstanding,
  };
}

