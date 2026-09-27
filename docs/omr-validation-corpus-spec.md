# OMR Real-World Validation Corpus Specification

**Status:** `VALIDATION INFRASTRUCTURE READY`  
**Result status:** `REAL_WORLD_VALIDATION_PENDING`  
**Important:** This document defines evidence; it is not evidence that physical validation passed.

## 1. Corpus layout

Real images contain sensitive test material and must remain outside Git:

```text
omr-real-corpus/
  manifest.json
  ground-truth/
    <formId>.json
  images/
    <imageId>.<jpg|jpeg|png|heic>
  results/
    <runId>.json
  adjudication/
    <imageId>.json
```

Store the corpus in access-controlled encrypted storage. Repository reports may contain only de-identified aggregate metrics and cryptographic hashes.

## 2. Required coverage

### Devices

- At least one current iPhone and one older iPhone.
- At least one mid-range Android and one lower-camera Android.
- Record model, OS, camera application and native dimensions; do not record device owner identity.

### Print

- Laser and inkjet printers; office copier where available.
- 300 and 600 DPI paths where supported.
- 80 g white, 90 g matte, and a lower-contrast/recycled paper.
- Always record actual scale; include deliberate 98%, 100%, and 102% copies.

### Environment

- Good light, low light, hard/partial shadow, perspective, motion/defocus blur.
- Record approximate lux where available, angle class and whether flash was used.

### Marking

Include adjudicated examples of `blank`, `single`, `double`, `erased`, `weak`, `oversized`, and `edge` marks. Double/ambiguous marks must never silently become D/Y.

### Page integrity

Include correct, wrong-form, duplicate, missing, and reordered pages. The pipeline must reject or require review rather than silently remap.

## 3. Manifest format

`manifest.json`:

```json
{
  "schemaVersion": 1,
  "corpusId": "omr-real-2026-001",
  "createdAt": "2026-09-27T12:00:00Z",
  "status": "REAL_WORLD_VALIDATION_PENDING",
  "images": [
    {
      "imageId": "img-0001",
      "file": "images/img-0001.jpg",
      "sha256": "64 lowercase hex characters",
      "formId": "form-001",
      "device": { "platform": "Android", "model": "model", "os": "version", "camera": "native" },
      "printer": { "type": "laser", "model": "model", "dpi": 600, "paper": "80g-white", "scalePercent": 100 },
      "conditions": { "lighting": "good", "lux": 500, "shadow": "none", "perspectiveDeg": 0, "blur": "none", "flash": false },
      "page": { "expected": 1, "presented": 1, "sequence": 1, "case": "correct" },
      "marking": ["single", "blank"],
      "groundTruthFile": "ground-truth/form-001.json"
    }
  ]
}
```

Permitted page cases: `correct`, `wrong`, `duplicate`, `missing`, `reordered`.

## 4. Ground truth format

Ground truth is created before processing and then independently double-checked:

```json
{
  "schemaVersion": 1,
  "formId": "form-001",
  "page": 1,
  "adjudicators": ["operator-A", "operator-B"],
  "expectedAnswers": [
    { "item": 1, "state": "single", "choice": "D" },
    { "item": 2, "state": "blank", "choice": null },
    { "item": 3, "state": "double", "choice": null }
  ]
}
```

The complete four-page truth must contain each item 1–566 exactly once. `choice` is `D`, `Y`, or `null`; `state` is one of the marking classes above.

## 5. Result format

Every run writes immutable result JSON:

```json
{
  "schemaVersion": 1,
  "runId": "run-2026-09-27-001",
  "softwareCommit": "full git SHA",
  "formFingerprint": "expected fingerprint",
  "startedAt": "ISO-8601",
  "completedAt": "ISO-8601",
  "results": [
    {
      "imageId": "img-0001",
      "page": 1,
      "groundTruth": "ground-truth/form-001.json",
      "expectedAnswers": 144,
      "actualAnswers": 144,
      "unresolved": 0,
      "wrongMappings": 0,
      "falseSingles": 0,
      "safeRejected": false,
      "qualityReasons": []
    }
  ],
  "aggregate": {
    "images": 1,
    "items": 144,
    "wrongMappings": 0,
    "unresolved": 0,
    "medianErrorRate": 0,
    "p95ErrorRate": 0,
    "safeRejectRate": 0
  },
  "status": "REAL_WORLD_VALIDATION_PENDING"
}
```

A result may become `PASS` only after the minimum corpus and acceptance rules in `omr-validation-matrix.md` are met and failures are independently adjudicated.

## 6. Integrity and adjudication

1. Hash every source image and ground-truth file with SHA-256.
2. Ground truth must be frozen before the tested software runs.
3. Two reviewers resolve disagreements; preserve original opinions and final adjudication.
4. Record software commit, form fingerprint and exact runtime.
5. Never overwrite a run; issue a new `runId` after code/threshold changes.
6. Report silent D↔Y or blank↔single errors separately from safe rejections.

## 7. Acceptance and release language

- Minimum: 21 physical forms × 3 captures = 63 scans, with all required coverage represented.
- Median and P95 limits remain those in `omr-validation-matrix.md`.
- A passing aggregate must not hide device/paper/lighting strata that fail.
- Until a compliant corpus is supplied and executed, the only allowed statements are:
  - `OMR algorithm: PASS synthetic`
  - `Validation infrastructure: READY`
  - `Real-world OMR: BLOCKED / REAL_WORLD_VALIDATION_PENDING`
