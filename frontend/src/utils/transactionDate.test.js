import test from 'node:test';
import assert from 'node:assert/strict';
import { isSystemTransaction } from './transactionDate.js';
test('generated payments are protected while ordinary spending stays editable', () => {
 for (const c of ['ผ่อนชำระ', 'โอนเงิน', 'ชำระบัตรเครดิต']) assert.equal(isSystemTransaction({c}), true);
 assert.equal(isSystemTransaction({c:'อาหาร'}), false);
});
import { countsAsSpending } from './transactionDate.js';
test('installments still count in spending charts', () => {
 assert.equal(countsAsSpending({c:'ผ่อนชำระ'}), true);
 assert.equal(countsAsSpending({c:'อาหาร'}), true);
 assert.equal(countsAsSpending({c:'โอนเงิน'}), false);
 assert.equal(countsAsSpending({c:'ชำระบัตรเครดิต'}), false);
});
