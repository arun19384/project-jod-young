import test from 'node:test';
import assert from 'node:assert/strict';
import { createRefreshController } from './refreshController.js';

function harness() {
  const requests = [], data = [], errors = [], settled = [];
  const controller = createRefreshController({
    fetchData: (signal) => new Promise((resolve, reject) => requests.push({ signal, resolve, reject })),
    onData: (value) => data.push(value),
    onError: (error) => errors.push(error),
    onSettled: () => settled.push(true),
  });
  return { ...controller, requests, data, errors, settled };
}

test('slow background reads do not overlap', async () => {
  const h = harness();
  const pending = h.refresh();
  await h.refresh({ background: true });
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve('current');
  await pending;
  assert.deepEqual(h.data, ['current']);
});

test('post-save refresh wins even if an older response arrives last', async () => {
  const h = harness();
  const old = h.refresh();
  const latest = h.refresh();
  assert.equal(h.requests[0].signal.aborted, true);
  h.requests[1].resolve('after save');
  await latest;
  h.requests[0].resolve('before save');
  await old;
  assert.deepEqual(h.data, ['after save']);
  assert.equal(h.settled.length, 1);
});

test('failed refresh reports an error and the next read can recover', async () => {
  const h = harness();
  const failed = h.refresh();
  h.requests[0].reject(new Error('offline'));
  await failed;
  assert.equal(h.errors.length, 1);
  const retry = h.refresh();
  h.requests[1].resolve('reconnected');
  await retry;
  assert.deepEqual(h.data, ['reconnected']);
});

test('unmount aborts pending work and suppresses late updates', async () => {
  const h = harness();
  const pending = h.refresh();
  h.dispose();
  assert.equal(h.requests[0].signal.aborted, true);
  h.requests[0].resolve('stale');
  await pending;
  await h.refresh();
  assert.deepEqual(h.data, []);
  assert.equal(h.settled.length, 0);
  assert.equal(h.requests.length, 1);
});
