import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ITEM_COUNT,
  RAW_SCORE_MAX,
  countAnswers,
  emptyAnswers,
  emptyClientIntake,
  emptyRawScores,
  mapQuickKey,
  parseRawScore,
  rawScoresComplete,
  recordInputFromIntake,
  validateIntake,
} from '../src/workspace/caseTypes';

test('quick keys map 1/2/0 without inventing other answers', () => {
  assert.equal(mapQuickKey('1'), 'D');
  assert.equal(mapQuickKey('2'), 'Y');
  assert.equal(mapQuickKey('0'), null);
  assert.equal(mapQuickKey('3'), 'ignore');
  assert.equal(mapQuickKey('d'), 'ignore');
});

test('answer map starts unentered, not blank, and counts 566 slots', () => {
  const answers = emptyAnswers();
  assert.equal(answers.length, ITEM_COUNT);
  assert.equal(ITEM_COUNT, 566);
  assert.equal(countAnswers(answers).pending, 566);
  assert.equal(countAnswers(answers).entered, 0);
  answers[0] = null;
  answers[1] = 'D';
  answers[2] = 'Y';
  const counts = countAnswers(answers);
  assert.equal(counts.blank, 1);
  assert.equal(counts.correct, 1);
  assert.equal(counts.wrong, 1);
  assert.equal(counts.entered, 3);
});

test('raw score maxima match the requested validity and clinical caps', () => {
  assert.equal(RAW_SCORE_MAX.L, 15);
  assert.equal(RAW_SCORE_MAX.F, 64);
  assert.equal(RAW_SCORE_MAX.K, 30);
  assert.equal(RAW_SCORE_MAX.Hs, 33);
  assert.equal(RAW_SCORE_MAX.D, 60);
  assert.equal(RAW_SCORE_MAX.Hy, 60);
  assert.equal(RAW_SCORE_MAX.Pd, 50);
  assert.equal(RAW_SCORE_MAX.Mf, 60);
  assert.equal(RAW_SCORE_MAX.Pa, 40);
  assert.equal(RAW_SCORE_MAX.Pt, 48);
  assert.equal(RAW_SCORE_MAX.Sc, 78);
  assert.equal(RAW_SCORE_MAX.Ma, 46);
  assert.equal(RAW_SCORE_MAX.Si, 70);
  assert.equal(parseRawScore('16', 15), null);
  assert.equal(parseRawScore('15', 15), 15);
  assert.equal(rawScoresComplete(emptyRawScores()), false);
});

test('intake requires gender, age and test date; optional fields map to placeholders', () => {
  const client = emptyClientIntake();
  client.firstName = 'Ayşe';
  client.lastName = 'Yılmaz';
  client.gender = 'Kadın';
  client.age = 28;
  client.testDate = '2026-09-17';
  assert.equal(validateIntake(client), null);
  const input = recordInputFromIntake(client);
  assert.equal(input.client.occupation, '—');
  assert.equal(input.client.education, '—');
  assert.equal(input.client.requestedBy, '—');
  assert.equal(input.client.gender, 'Kadın');
  client.age = 0;
  assert.equal(validateIntake(client), 'Yaş 1–120 arasında olmalıdır.');
});
