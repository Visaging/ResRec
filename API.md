# ResRec Cryptographic Ledger API Reference

The **ResRec** (Research Record & Integrity Ledger) backend provides an end-to-end cryptographic provenance and offline-verifiable integrity system for scientific data, laboratory telemetry, and published findings.

Powered by **Prisma ORM**, **SQLite**, and the **CooL SDK (Cryptographic Observability & On-chain Ledger)**, every experiment creation, instrument measurement, correction, dataset finalization, and processing pipeline step is sealed into a tamper-evident, post-quantum signed cryptographic receipt (`cool.receipt.v2`).

---

## Architecture Overview

```
 ┌─────────────────┐       ┌────────────────────────┐       ┌───────────────────────┐
 │ Laboratory UI   │ ◄───► │ Next.js 16 API Routes  │ ◄───► │ CooL SDK v3.0 Engine  │
 │ (React 19 / TS) │       │ (Route Handlers)       │       │ (ML-DSA-65 + Ed25519) │
 └─────────────────┘       └───────────┬────────────┘       └───────────┬───────────┘
                                       │                                │
                                       ▼                                ▼
                           ┌────────────────────────┐       ┌───────────────────────┐
                           │ SQLite Database via    │       │ Immutable RFC 6962    │
                           │ Prisma ORM (dev.db)    │       │ Merkle Tree Log       │
                           └────────────────────────┘       └───────────────────────┘
```

---

## 1. Dashboard & System Metrics

### `GET /api/dashboard`
Returns high-level research integrity metrics across all repositories and institutions.

#### Response `200 OK`
```json
{
  "metrics": {
    "totalExperiments": 3,
    "verifiedRecords": 104,
    "totalDatasets": 3,
    "totalEvidenceRecords": 104,
    "pendingSubmissions": 1,
    "activeAlerts": 0
  },
  "recentActivity": [
    {
      "id": "REC-7F3A91BD",
      "eventType": "dataset.finalized",
      "experimentId": "EXP-2026-0042",
      "issuedAt": "2026-08-27T16:30:00.000Z",
      "bindingVerification": "verified"
    }
  ]
}
```

---

## 2. Experiments API

### `GET /api/experiments`
Query all experiments with optional status, search, and pagination filters.

#### Query Parameters
- `status`: Filter by status (`in_progress`, `completed`, `submitted`, `verified`, `integrity_issue`).
- `search`: Case-insensitive search on title, objective, researcher, or public ID.
- `limit`: Number of records to return (default: `50`).
- `offset`: Number of records to skip (default: `0`).

### `POST /api/experiments`
Creates a new research experiment and seals an `experiment.created` cryptographic receipt.

#### Request Body
```json
{
  "title": "Room-Temperature Superconductivity in Nitrogen-Doped Lutetium Hydride",
  "objective": "Evaluate electrical resistance under megabar pressures in a diamond anvil cell.",
  "principalInvestigator": "Dr. Elena Rostova",
  "researchGroup": "Condensed Matter Physics Group",
  "institutionName": "National Institute for Materials Science (NIMS)",
  "protocol": "NIMS-HIGH-PRESS-2026-04",
  "environment": "DAC Cryostat Cell (0 - 250 GPa, 4K - 300K)",
  "instrumentName": "Quantum Design PPMS Dynacool",
  "sampleName": "Lu-N-H Synthesis Batch #04"
}
```

### `GET /api/experiments/:id`
Fetch complete experiment details including measurements, dataset versions, processing DAG, and cryptographic evidence receipts.

### `PATCH /api/experiments/:id`
Update experiment metadata or lifecycle status (`status`, `title`, `objective`, `protocol`).

### `DELETE /api/experiments/:id`
Deletes an experiment and cascades associated non-verified draft data.

---

## 3. Measurements & Corrections API

### `GET /api/experiments/:id/measurements`
Retrieve all raw and corrected measurements for an experiment.

#### Query Parameters
- `limit`: Number of records (default: `100`).
- `offset`: Pagination offset (default: `0`).

### `POST /api/experiments/:id/measurements`
Records a new measurement point, automatically incrementing trial sequence and generating a signed CooL evidence receipt.

#### Request Body
```json
{
  "value": 98.42,
  "unit": "% Initial Capacity",
  "trialNumber": 14,
  "instrumentName": "BioLogic VSP-300 Potentiostat",
  "metadata": {
    "cycleNumber": 14,
    "chargeRateC": 4.0,
    "cellTemperature_C": 46.2
  }
}
```

### `POST /api/measurements/:id/correct`
Creates an immutable correction event for an anomalous or recalibrated measurement without overwriting the historical telemetry.

#### Request Body
```json
{
  "correctedValue": 97.18,
  "reason": "Thermocouple T-04 reference drift during cycle interval; recalibrated against primary reference cell.",
  "note": "Correction validated by Lab Supervisor Dr. M. Vance.",
  "operator": "Dr. Sarah Chen"
}
```

#### Response `201 Created`
```json
{
  "success": true,
  "originalMeasurement": {
    "publicId": "MEAS-00014",
    "value": 98.42,
    "status": "corrected"
  },
  "correctedMeasurement": {
    "publicId": "MEAS-00014-C1",
    "value": 97.18,
    "status": "verified",
    "correctionOf": "MEAS-00014",
    "correctionReason": "Thermocouple T-04 reference drift during cycle interval..."
  },
  "evidenceRecord": {
    "publicId": "REC-A4E81C02",
    "eventType": "measurement.corrected",
    "bindingVerification": "verified"
  }
}
```

---

## 4. Datasets & Versioning API

### `GET /api/experiments/:id/datasets`
Lists all dataset entities and version history for an experiment.

### `GET /api/datasets/:id`
Retrieves dataset metadata, SHA-256 file hashes, and CooL Merkle commitments.

### `POST /api/datasets/:id/versions`
Appends a new version to an existing dataset entity, calculating SHA-256 checksums and sealing a `dataset.finalized` receipt.

#### Request Body
```json
{
  "version": 2,
  "filename": "thermal_cycling_recalibrated_v2.csv",
  "fileHash": "4747a4fbc8c15f9f29d4628cf07d89397255f04ccefd3c659370222b91f3ab6c",
  "fileSize": 384000,
  "recordCount": 48,
  "createdBy": "Dr. Sarah Chen"
}
```

### `GET /api/datasets/:id/download`
Downloads the deterministic dataset CSV / raw payload data with verification headers.

---

## 5. Provenance & Lineage API

### `GET /api/experiments/:id/provenance`
Generates a complete Directed Acyclic Graph (DAG) representing the end-to-end scientific lineage from instrument calibration, raw measurements, versioned datasets, processing transforms, analyses, and publication submissions.

#### Response `200 OK`
```json
{
  "experimentId": "EXP-2026-0042",
  "nodes": [
    { "id": "exp-root", "type": "experiment", "label": "EXP-2026-0042", "status": "verified" },
    { "id": "meas-14", "type": "measurement", "label": "MEAS-00014 (Trial 14)", "status": "corrected" },
    { "id": "corr-14", "type": "correction", "label": "MEAS-00014-C1 (Corrected)", "status": "verified" },
    { "id": "ds-v1", "type": "dataset_version", "label": "v1 Raw", "status": "verified" },
    { "id": "proc-1", "type": "processing", "label": "Recalibration Transform", "status": "verified" },
    { "id": "ds-v2", "type": "dataset_version", "label": "v2 Recalibrated", "status": "verified" }
  ],
  "edges": [
    { "source": "meas-14", "target": "corr-14", "label": "corrected_by" },
    { "source": "corr-14", "target": "ds-v2", "label": "included_in" },
    { "source": "ds-v1", "target": "proc-1", "label": "transformed_by" },
    { "source": "proc-1", "target": "ds-v2", "label": "produced" }
  ]
}
```

---

## 6. Cryptographic Evidence & Verification API

### `GET /api/evidence`
Queries all cryptographic evidence records with filtering by `experimentId` or `eventType`.

### `GET /api/evidence/:id`
Returns raw CooL receipt JSON, Merkle inclusion audit paths, signing keys, and attestation parameters.

### `POST /api/verification/verify-receipt`
Independently verifies any uploaded or pasted `cool.receipt.v2` offline against its post-quantum signatures and transparency log inclusion proofs.

#### Request Body
```json
{
  "receipt": "{ ... signed CooL receipt JSON ... }"
}
```

#### Response `200 OK`
```json
{
  "overallStatus": "verified",
  "bindingStatus": "verified",
  "signatureStatus": "verified",
  "transparencyStatus": "verified",
  "witnessStatus": "not_provided",
  "attestationStatus": "verified",
  "datasetCommitmentStatus": "verified",
  "recordSequenceStatus": "verified",
  "issues": []
}
```

### `POST /api/verification/verify-experiment`
Executes deep cryptographic lineage audit across an entire experiment, re-verifying every evidence receipt, monotonic sequence ordering, dataset commitments, and measurement values.

#### Request Body
```json
{
  "experimentId": "EXP-2026-0042"
}
```

---

## 7. Tampering Simulation & Recovery API (Dev / Demo)

These endpoints allow reviewers, auditors, and demonstrators to simulate real-world data tampering and observe instantaneous anomaly detection by the CooL verifier.

### `POST /api/dev/tamper/measurement`
Mutates a measurement's value directly in the database without an attested cryptographic correction envelope.

```bash
curl -X POST http://localhost:3000/api/dev/tamper/measurement \
  -H "Content-Type: application/json" \
  -d '{"measurementId": "MEAS-00014", "tamperedValue": 99.99}'
```

### `POST /api/dev/tamper/dataset`
Mutates a dataset version's stored SHA-256 hash or data payload.

```bash
curl -X POST http://localhost:3000/api/dev/tamper/dataset \
  -H "Content-Type: application/json" \
  -d '{"filename": "thermal_cycling_raw_v1.csv"}'
```

### `POST /api/dev/tamper/receipt`
Corrupts the cryptographic signature or Merkle binding hash of an evidence receipt.

```bash
curl -X POST http://localhost:3000/api/dev/tamper/receipt \
  -H "Content-Type: application/json" \
  -d '{"experimentId": "EXP-2026-0042"}'
```

### `POST /api/dev/restore`
Resets the repository back to clean, fully verified baseline state.

```bash
curl -X POST http://localhost:3000/api/dev/restore
```

---

## Cryptographic Guarantees

1. **Post-Quantum Hybrid Signatures**: Every record is signed using `ML-DSA-65` (NIST FIPS 204 post-quantum standard) combined with `Ed25519`.
2. **Deterministic Record Binding**: Hashes are computed over canonical CBOR-encoded event cores using SHA-256 multihashes (`mh:sha256:<hex>`).
3. **Append-Only Merkle Transparency Log**: Receipts include RFC 6962 inclusion proofs verifiable offline against Signed Tree Heads (STH).
4. **Zero-Trust Verification**: The verifier operates fully offline without database dependencies or remote server trust.
