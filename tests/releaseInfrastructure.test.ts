import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildProfileFromRawScoresObject } from '../src/scoring/mmpiScoring';
import { codeRuleEvidence, type CodeInterpretation } from '../src/scoring/mmpiSourceCodes';

const protocol = {
  blank: 0, L: 4, F: 8, K: 12, Hs: 8, D: 18, Hy: 15, Pd: 20,
  Mf: 29, Pa: 10, Pt: 24, Sc: 25, Ma: 18, Si: 24,
};

test('every emitted validity finding carries complete machine-readable rule provenance', () => {
  const profile = buildProfileFromRawScoresObject(protocol, 'Erkek');
  for (const finding of profile.validityAnalysis.findings) {
    const traces = [finding.evidence.raw, finding.evidence.t].filter(Boolean);
    assert.ok(traces.length >= 1);
    for (const trace of traces) {
      assert.ok(trace!.id);
      assert.ok(trace!.source);
      assert.ok(trace!.sourceType);
      assert.ok(trace!.page);
      assert.ok('table' in trace!);
      assert.ok(trace!.evidenceLevel);
      assert.ok(trace!.rule.includes('→'));
    }
  }
});

test('interpretation evidence is not mass-promoted without an explicit page trace', () => {
  const withoutTrace: CodeInterpretation = { code: 'X', text: 'rule' };
  assert.equal(codeRuleEvidence(withoutTrace).evidenceLevel, 'UNVERIFIED');
  const withTrace: CodeInterpretation = {
    code: 'X', text: 'rule', block: 'D',
    conditions: [{ source: 's.88', quote: 'quoted source sentence', manual: true }],
  };
  const evidence = codeRuleEvidence(withTrace);
  assert.equal(evidence.evidenceLevel, 'PRIMARY_VERIFIED');
  assert.equal(evidence.page, 's.88');
});

test('real OMR corpus specification defines required fields while preserving pending status', () => {
  const spec = readFileSync('docs/omr-validation-corpus-spec.md', 'utf8');
  for (const field of ['imageId', 'device', 'printer', 'conditions', 'page', 'groundTruth', 'expectedAnswers', 'actualAnswers', 'unresolved', 'wrongMappings']) {
    assert.match(spec, new RegExp(`\\b${field}\\b`));
  }
  assert.match(spec, /VALIDATION INFRASTRUCTURE READY/);
  assert.match(spec, /REAL_WORLD_VALIDATION_PENDING/);
  assert.doesNotMatch(spec, /Real-world OMR: PASS/);
});

test('live security matrix covers all roles/resources/CRUD and explicit cross-user IDOR row denial', () => {
  const matrix = JSON.parse(readFileSync('docs/live-security-matrix.example.json', 'utf8')) as {
    scenarios: Array<{ role: string; resource: string; operation: string; expectedRows?: number }>;
  };
  for (const role of ['anonymous', 'userA', 'userB', 'admin', 'inactive'])
    assert.ok(matrix.scenarios.some(x => x.role === role), `missing role ${role}`);
  for (const resource of ['profile', 'mmpi_record', 'report', 'report_version', 'template', 'settings', 'audit_log'])
    assert.ok(matrix.scenarios.some(x => x.resource === resource), `missing resource ${resource}`);
  for (const operation of ['SELECT', 'INSERT', 'UPDATE', 'DELETE'])
    assert.ok(matrix.scenarios.some(x => x.operation.startsWith(operation)), `missing operation ${operation}`);
  for (const resource of ['mmpi_record', 'report', 'report_version']) {
    const idor = matrix.scenarios.filter(x => x.resource === resource && x.operation.includes('IDOR'));
    assert.ok(idor.length > 0, `missing IDOR ${resource}`);
    assert.ok(idor.every(x => x.expectedRows === 0), `IDOR ${resource} must expect zero rows`);
  }
});

test('release harnesses never embed credentials or retain live response records', () => {
  const harness = readFileSync('scripts/run-live-security-matrix.mjs', 'utf8');
  assert.match(harness, /process\.env\[scenario\.tokenEnv\]/);
  assert.match(harness, /actualRows/);
  assert.doesNotMatch(harness, /results\.push\([^\n]*raw/);
  const config = readFileSync('scripts/verify-production-config.mjs', 'utf8');
  assert.match(config, /bundle-secret/);
  assert.match(config, /PRODUCTION_URL/);
});
