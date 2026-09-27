import test from 'node:test';
import assert from 'node:assert/strict';
import { latestCardCutoff, splitCardBalance } from './cardCycle.js';

test('uses this month cut day after the card has cut', () => {
  assert.equal(latestCardCutoff('19', new Date(2026, 8, 27, 12)).getDate(), 19);
});

test('uses previous month cut day before this month has cut', () => {
  const cutoff = latestCardCutoff('19', new Date(2026, 8, 10, 12));
  assert.equal(cutoff.getMonth(), 8);
  assert.equal(cutoff.getDate(), 19);
});

test('keeps post-cut charges for the next bill without showing them in current amount', () => {
  const card = { id: 'card-1', name: 'KTC', cut: '19', amt: 1750 };
  const transactions = [
    { id: 'tx-1790476974000000000', acct: 'KTC', date: '2026-09-19', a: 1000, income: false },
    { id: 'tx-1790476975000000000', acct: 'KTC', date: '2026-09-20', a: 250, income: false },
    { id: 'tx-1790476976000000000', acct: 'card-1', date: '2026-09-27', a: 500, income: false },
  ];
  const result = splitCardBalance(card, transactions, new Date(2026, 8, 27, 12));
  assert.equal(result.amt, 1000);
  assert.equal(result.pendingAmount, 750);
  assert.equal(result.totalOutstanding, 1750);
});

test('moves saved charges into the visible bill on the next cut day', () => {
  const card = { id: 'card-1', name: 'KTC', cut: '19', amt: 750 };
  const transactions = [{ id: 'tx-1790476975000000000', acct: 'KTC', date: '2026-09-20', a: 750, income: false }];
  const result = splitCardBalance(card, transactions, new Date(2026, 9, 19, 12));
  assert.equal(result.amt, 750);
  assert.equal(result.pendingAmount, 0);
});

test('does not hide a card that has not reached its own cut day', () => {
  const card = { id: 'card-31', name: 'Krungsri', cut: '31', amt: 154 };
  const transactions = [{ id: 'tx-1790476975000000000', acct: 'Krungsri', date: '2026-09-27', a: 154, income: false }];
  const result = splitCardBalance(card, transactions, new Date(2026, 8, 27, 12));
  assert.equal(result.amt, 154);
  assert.equal(result.pendingAmount, 0);
});

test('keeps balances recorded before cycle tracking visible', () => {
  const card = { id: 'card-1', name: 'KTC', cut: '19', amt: 1748 };
  const transactions = [{ id: 'tx-1790476972000000000', acct: 'KTC', date: '2026-09-27', a: 1748, income: false }];
  const result = splitCardBalance(card, transactions, new Date(2026, 8, 27, 12));
  assert.equal(result.amt, 1748);
  assert.equal(result.pendingAmount, 0);
});
