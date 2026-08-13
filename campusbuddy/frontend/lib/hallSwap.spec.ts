import assert from 'node:assert/strict';
import test from 'node:test';
import { airconPreferenceLabel, hallSwapAlertKey, preferenceAcceptsRoom, roomLabel } from './hallSwap.ts';

test('matches room type and an exact air-con preference', () => {
  assert.equal(preferenceAcceptsRoom(['SINGLE'], 'AIRCON', 'SINGLE', true), true);
  assert.equal(preferenceAcceptsRoom(['SINGLE'], 'AIRCON', 'SINGLE', false), false);
});

test('allows either air-con state without ignoring room type', () => {
  assert.equal(preferenceAcceptsRoom(['SINGLE', 'DOUBLE'], 'ANY', 'DOUBLE', false), true);
  assert.equal(preferenceAcceptsRoom(['SINGLE'], 'ANY', 'DOUBLE', true), false);
});

test('produces concise reader-facing labels', () => {
  assert.equal(roomLabel('DOUBLE', false), 'Double · Non-air-con');
  assert.equal(airconPreferenceLabel('ANY'), 'Either is fine');
});

test('uses the same alert key regardless of which student saves last', () => {
  assert.equal(hallSwapAlertKey('profile-b', 'profile-a'), 'profile-a:profile-b');
  assert.equal(hallSwapAlertKey('profile-a', 'profile-b'), 'profile-a:profile-b');
});
