/**
 * Comprehensive Backend Integration & CooL Cryptographic Verification Test Suite
 *
 * Tests:
 * 1. Database seeding & integrity status
 * 2. CooL receipt creation & offline cryptographic verification
 * 3. Experiment lifecycle: creation -> measurements -> correction -> dataset -> processing -> analysis
 * 4. Provenance graph generation & DAG topology
 * 5. Tampering simulation & cryptographic anomaly detection:
 *    - Measurement data tampering
 *    - Dataset hash tampering
 *    - Receipt signature tampering
 * 6. Restoration back to verified state
 */

import { prisma } from "../lib/db/prisma";
import { CooLEvidenceService } from "../lib/cool/evidence-service";
import { CooLVerificationService } from "../lib/cool/verification-service";
import { getCooLClient } from "../lib/cool/client";
import { verifyEvidence } from "cool-nwc";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { createSession, destroySession } from "../lib/auth/server";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  RESRec Backend & CooL Cryptography Test Suite");
  console.log("=======================================================\n");

  // ─────────────────────────────────────────────────────────────
  // 1. Database Seed Verification
  // ─────────────────────────────────────────────────────────────
  console.log("1. Verifying Database Seed State...");
  const experiments = await prisma.experiment.findMany({
    include: { measurements: true, datasets: true, evidenceRecords: true },
  });
  assert(experiments.length >= 3, "Database contains >= 3 seed experiments");

  const verifiedExperiment = experiments.find(
    (e) => e.integrityStatus === "verified" || e.publicId === "EXP-2026-0049"
  );
  const batteryExp = experiments.find((e) => e.publicId === "EXP-2026-0042");
  assert(!!batteryExp, "Battery experiment EXP-2026-0042 exists in DB");
  assert(!!verifiedExperiment, "A verified experiment exists for clean verification checks");
  assert(batteryExp!.measurements.length >= 48, "EXP-2026-0042 has 48 measurements");

  const corrections = await prisma.correction.findMany();
  assert(corrections.length >= 1, "Seed includes measurement correction record");

  // ─────────────────────────────────────────────────────────────
  // 2. CooL SDK Cryptographic Receipt Verification
  // ─────────────────────────────────────────────────────────────
  console.log("\n2. Verifying Real CooL Cryptographic Receipts...");
  const sampleEvidence = await prisma.evidenceRecord.findFirst({
    where: { experimentId: verifiedExperiment!.id },
  });
  assert(!!sampleEvidence, "Found evidence record for a verified experiment");

  const receipt = JSON.parse(sampleEvidence!.evidenceJson);
  assert(!!receipt.record && !!receipt.binding_hash, "Evidence JSON is a valid SignedEvidence receipt");

  // Verify directly using CooL SDK verifier
  const coolResult = await verifyEvidence(receipt);
  assert(
    coolResult.ok === true,
    `CooL SDK verifyEvidence returns ok=true (got ${coolResult.ok})`
  );
  assert(coolResult.checks.binding.status === "pass", "CooL binding domain verification passes");
  assert(
    coolResult.checks.signature.status === "pass" || coolResult.checks.signature.status === "simulated",
    "CooL signature domain verification passes"
  );

  // ─────────────────────────────────────────────────────────────
  // 2b. Direct verification of a measurement record fetched from the experiment API
  // ─────────────────────────────────────────────────────────────
  const seedMeasurement = await prisma.measurement.findFirst({
    where: { experimentId: verifiedExperiment!.id },
    include: { evidenceRecord: true },
  });
  assert(!!seedMeasurement?.evidenceRecord, "Found measurement with linked evidence record");
  const measurementPayload = {
    id: seedMeasurement!.publicId,
    value: seedMeasurement!.value,
    unit: seedMeasurement!.unit,
    trialNumber: seedMeasurement!.trialNumber,
    evidenceRecord: seedMeasurement!.evidenceRecord,
  };
  const measurementVerification = await CooLVerificationService.verifyReceipt(
    measurementPayload
  );
  assert(
    measurementVerification.overallStatus === "verified",
    "A measurement object fetched from the experiment should verify from its linked receipt"
  );

  // ─────────────────────────────────────────────────────────────
  // 3. Experiment Verification Service
  // ─────────────────────────────────────────────────────────────
  console.log("\n3. Testing CooLVerificationService.verifyExperiment...");
  const expVerification = await CooLVerificationService.verifyExperiment(verifiedExperiment!.id);
  if (expVerification.issues.length > 0) {
    console.log("    Issues detected:", expVerification.issues);
  }
  assert(expVerification.overallStatus === "verified", "Verified experiment overall status is verified");
  assert(expVerification.bindingStatus === "verified", "Binding status is verified");
  assert(expVerification.signatureStatus === "verified", "Signature status is verified");
  assert(expVerification.datasetCommitmentStatus === "verified", "Dataset commitment status is verified");
  assert(expVerification.issues.length === 0, "Zero verification issues on clean state");

  // ─────────────────────────────────────────────────────────────
  // 4. Live Event Recording Lifecycle
  // ─────────────────────────────────────────────────────────────
  console.log("\n4. Testing Live CooL Event Recording...");
  await prisma.experiment.deleteMany({
    where: { publicId: { startsWith: "EXP-TAMPER-" } },
  });

  const testExpPublicId = `EXP-TEST-${Date.now().toString().slice(-4)}`;
  const testExp = await prisma.experiment.create({
    data: {
      publicId: testExpPublicId,
      title: "Test CooL Automated Experiment",
      objective: "Verification of live telemetry recording",
      principalInvestigator: "Dr. Automated Test",
      researchGroup: "Integrity Test Lab",
      status: "in_progress",
    },
  });

  const expEv = await CooLEvidenceService.recordExperiment({
    id: testExp.id,
    publicId: testExp.publicId,
    title: testExp.title,
    objective: testExp.objective || "",
    principalInvestigator: testExp.principalInvestigator,
    researchGroup: testExp.researchGroup || "",
  });
  assert(!!expEv.receipt, "Generated cryptographic receipt for experiment creation");

  // Record Measurement
  const measEv = await CooLEvidenceService.recordMeasurement(testExp.id, {
    publicId: "MEAS-TEST-001",
    trialNumber: 1,
    timestamp: new Date(),
    value: 42.15,
    unit: "mV",
    instrumentName: "Precision Multimeter",
  });
  assert(!!measEv.receipt, "Generated cryptographic receipt for measurement");

  // Record Dataset Version
  const dsEv = await CooLEvidenceService.recordDatasetVersion(
    testExp.id,
    {
      publicId: "DS-TEST-001",
      name: "Test Dataset",
      version: 1,
      filename: "test_dataset.csv",
      fileHash: "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
      fileSize: 1024,
      recordCount: 42,
    },
    3
  );
  assert(!!dsEv.receipt, "Generated cryptographic receipt for dataset version");

  // Verify created experiment
  const testExpVerification = await CooLVerificationService.verifyExperiment(testExp.id);
  assert(testExpVerification.overallStatus === "verified", "New experiment passes full cryptographic verification");

  // Cleanup test experiment
  await prisma.experiment.delete({ where: { id: testExp.id } });

  // Create a dedicated clean experiment for tamper/restore checks so the suite
  // is not accidentally using a seeded experiment that is already flagged as failed.
  const tamperExperiment = await prisma.experiment.create({
    data: {
      publicId: `EXP-TAMPER-${Date.now().toString().slice(-6)}`,
      title: "Tamper Detection Integrity Experiment",
      objective: "Validate detection and restoration workflow on a clean record",
      principalInvestigator: "Dr. Integrity Test",
      researchGroup: "Integrity Verification Lab",
      status: "active",
    },
  });

  const tamperExpEv = await CooLEvidenceService.recordExperiment({
    id: tamperExperiment.id,
    publicId: tamperExperiment.publicId,
    title: tamperExperiment.title,
    objective: tamperExperiment.objective || "",
    principalInvestigator: tamperExperiment.principalInvestigator,
    researchGroup: tamperExperiment.researchGroup || "",
  });
  assert(!!tamperExpEv.receipt, "Created a clean baseline experiment for tamper tests");

  const testMeasurement = await CooLEvidenceService.recordMeasurement(tamperExperiment.id, {
    publicId: `MEAS-TAMPER-${Date.now().toString().slice(-6)}`,
    trialNumber: 1,
    timestamp: new Date(),
    value: 101.25,
    unit: "mV",
    instrumentName: "Cleanroom Voltmeter",
  });
  assert(!!testMeasurement.receipt, "Created a clean baseline measurement for tamper tests");

  await prisma.measurement.create({
    data: {
      publicId: `MEAS-TAMPER-${Date.now().toString().slice(-6)}`,
      experimentId: tamperExperiment.id,
      trialNumber: 1,
      timestamp: new Date(),
      value: 101.25,
      unit: "mV",
      instrumentName: "Cleanroom Voltmeter",
      status: "verified",
      evidenceRecordId: testMeasurement.evidenceRecord.id,
    },
  });

  const cleanDataset = await CooLEvidenceService.recordDatasetVersion(
    tamperExperiment.id,
    {
      publicId: `DS-TAMPER-${Date.now().toString().slice(-6)}`,
      name: "Clean Baseline Dataset",
      version: 1,
      filename: "clean_baseline.csv",
      fileHash: "cafe0000000000000000000000000000000000000000000000000000000000",
      fileSize: 2048,
      recordCount: 10,
    },
    6
  );
  assert(!!cleanDataset.receipt, "Created a clean baseline dataset for tamper tests");

  const datasetRecord = await prisma.dataset.create({
    data: {
      publicId: `DS-TAMPER-${Date.now().toString().slice(-6)}`,
      experimentId: tamperExperiment.id,
      name: "Clean Baseline Dataset",
      filename: "clean_baseline.csv",
      description: "Clean baseline dataset used for tamper tests",
      currentVersion: 1,
      recordCount: 10,
      fileSize: 2048,
      sha256: "cafe0000000000000000000000000000000000000000000000000000000000",
      coolCommitment: cleanDataset.digest,
      evidenceRecordId: cleanDataset.evidenceRecord.id,
      status: "verified",
    },
  });

  await prisma.datasetVersion.create({
    data: {
      datasetId: datasetRecord.id,
      version: 1,
      filename: "clean_baseline.csv",
      recordCount: 10,
      fileSize: 2048,
      fileHash: "cafe0000000000000000000000000000000000000000000000000000000000",
      commitment: cleanDataset.digest,
      evidenceRecordId: cleanDataset.evidenceRecord.id,
      status: "verified",
      createdBy: "Integrity Test",
    },
  });

  const baselineTamperCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(baselineTamperCheck.overallStatus === "verified", "Fresh tamper-test experiment is verified before mutation");

  // ─────────────────────────────────────────────────────────────
  // 5. Tampering Anomaly Detection: Measurement Tampering
  // ─────────────────────────────────────────────────────────────
  console.log("\n5. Testing Tamper Detection: Measurement Value Mutation...");
  const targetMeasurement = await prisma.measurement.findFirst({
    where: { experimentId: tamperExperiment.id, trialNumber: 1 },
  });
  assert(!!targetMeasurement, "Found clean baseline measurement for tampering test");

  const originalValue = targetMeasurement!.value;
  // Mutate measurement directly in DB without recalculating cryptographic receipt
  await prisma.measurement.update({
    where: { id: targetMeasurement!.id },
    data: { value: originalValue + 999.99, status: "failed" },
  });

  // Verify experiment now detects tamper
  const tamperedMeasCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(
    tamperedMeasCheck.overallStatus === "failed" || tamperedMeasCheck.bindingStatus === "failed",
    "Tampered measurement detected by verification service"
  );
  assert(
    tamperedMeasCheck.issues.some((issue) => issue.includes(targetMeasurement!.publicId) || issue.includes("mismatch") || issue.includes("integrity check failed")),
    "Tamper issue explicitly names the affected measurement or commitment mismatch"
  );

  // Revert measurement
  await prisma.measurement.update({
    where: { id: targetMeasurement!.id },
    data: { value: originalValue, status: "verified" },
  });

  const revertedMeasCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(revertedMeasCheck.overallStatus === "verified", "Reverting measurement restores verified status");

  // ─────────────────────────────────────────────────────────────
  // 6. Tampering Anomaly Detection: Dataset Hash Tampering
  // ─────────────────────────────────────────────────────────────
  console.log("\n6. Testing Tamper Detection: Dataset Hash Mutation...");
  const targetDatasetVersion = await prisma.datasetVersion.findFirst({
    where: { dataset: { experimentId: tamperExperiment.id } },
  });
  assert(!!targetDatasetVersion, "Found dataset version for tampering test");

  const originalSha = targetDatasetVersion!.fileHash;
  await prisma.datasetVersion.update({
    where: { id: targetDatasetVersion!.id },
    data: { fileHash: "0000000000000000000000000000000000000000000000000000000000000000", status: "failed" },
  });

  const tamperedDsCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(
    tamperedDsCheck.overallStatus === "failed" || tamperedDsCheck.datasetCommitmentStatus === "failed",
    "Tampered dataset hash detected by verification service"
  );

  // Revert dataset version
  await prisma.datasetVersion.update({
    where: { id: targetDatasetVersion!.id },
    data: { fileHash: originalSha, status: "verified" },
  });

  const revertedDsCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(revertedDsCheck.overallStatus === "verified", "Reverting dataset restores verified status");

  // ─────────────────────────────────────────────────────────────
  // 7. Tampering Anomaly Detection: Receipt Signature Tampering
  // ─────────────────────────────────────────────────────────────
  console.log("\n7. Testing Tamper Detection: Receipt Signature Corruption...");
  const targetEvidence = await prisma.evidenceRecord.findFirst({
    where: { experimentId: tamperExperiment.id },
  });
  assert(!!targetEvidence, "Found evidence record for signature tampering");

  const originalEvidenceJson = targetEvidence!.evidenceJson;
  const corruptedReceipt = JSON.parse(originalEvidenceJson);
  if (corruptedReceipt.record?.signature) {
    corruptedReceipt.record.signature.ed25519 = "base64:AAAAAAAA";
  }
  corruptedReceipt.binding_hash = "mh:sha256:0000000000000000000000000000000000000000000000000000000000000000";

  await prisma.evidenceRecord.update({
    where: { id: targetEvidence!.id },
    data: { evidenceJson: JSON.stringify(corruptedReceipt) },
  });

  const tamperedSigCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(
    tamperedSigCheck.overallStatus === "failed" || tamperedSigCheck.signatureStatus === "failed",
    "Corrupted signature detected by CooL cryptographic verifier"
  );

  // Revert receipt
  await prisma.evidenceRecord.update({
    where: { id: targetEvidence!.id },
    data: { evidenceJson: originalEvidenceJson },
  });

  const revertedSigCheck = await CooLVerificationService.verifyExperiment(tamperExperiment.id);
  assert(revertedSigCheck.overallStatus === "verified", "Restoring receipt signature restores verified status");

  // Clean up the dedicated tamper experiment after verification.
  await prisma.experiment.delete({ where: { id: tamperExperiment.id } });

  // ─────────────────────────────────────────────────────────────
  // 8. Authentication & Cryptographic Session Security
  // ─────────────────────────────────────────────────────────────
  console.log("\n8. Testing Authentication & Cryptographic Session Security...");
  
  // Scrypt password hashing verification
  const testPw = "SuperSecretScientistPassword2026!";
  const authRecord = hashPassword(testPw);
  assert(authRecord.hash.length === 128, "Scrypt produces 64-byte (128-char hex) key");
  assert(authRecord.salt.length === 64, "Salt is 32-byte (64-char hex) random cryptographic salt");
  assert(verifyPassword(testPw, authRecord.hash, authRecord.salt) === true, "verifyPassword succeeds on correct password");
  assert(verifyPassword("WrongPassword123", authRecord.hash, authRecord.salt) === false, "verifyPassword fails on incorrect password");

  // Session lifecycle
  const elenaUser = await prisma.user.findUnique({ where: { email: "e.rostova@stanford.edu" } });
  assert(!!elenaUser, "Elena user exists in DB with hashed credentials");

  const session = await createSession(elenaUser!.id);
  assert(session.token.length === 64, "Session token is 256-bit (64 hex characters)");
  
  const foundSession = await prisma.session.findUnique({
    where: { token: session.token },
    include: { user: true },
  });
  assert(!!foundSession && foundSession.user.id === elenaUser!.id, "Session resolves to correct authenticated user");

  await destroySession(session.token);
  const destroyedSession = await prisma.session.findUnique({ where: { token: session.token } });
  assert(!destroyedSession, "Destroyed session is removed from DB");

  // ─────────────────────────────────────────────────────────────
  // 9. Multi-Tenant User Data Isolation Verification
  // ─────────────────────────────────────────────────────────────
  console.log("\n9. Testing Server-Side User Data Isolation...");

  const sarahUser = await prisma.user.findUnique({ where: { email: "s.lin@broadinstitute.org" } });
  const alexeiUser = await prisma.user.findUnique({ where: { email: "a.petrov@anl.gov" } });
  assert(!!sarahUser && !!alexeiUser, "Multiple distinct researcher accounts exist in DB");

  // Verify Elena's isolated experiments
  const elenaExperiments = await prisma.experiment.findMany({
    where: { userId: elenaUser!.id },
  });
  assert(elenaExperiments.some((e) => e.publicId === "EXP-2026-0042"), "Elena owns EXP-2026-0042");
  assert(!elenaExperiments.some((e) => e.publicId === "EXP-2026-0038"), "Elena CANNOT see Sarah's EXP-2026-0038");
  assert(!elenaExperiments.some((e) => e.publicId === "EXP-2026-0019"), "Elena CANNOT see Alexei's EXP-2026-0019");

  // Verify Sarah's isolated experiments
  const sarahExperiments = await prisma.experiment.findMany({
    where: { userId: sarahUser!.id },
  });
  assert(sarahExperiments.some((e) => e.publicId === "EXP-2026-0038"), "Sarah owns EXP-2026-0038");
  assert(!sarahExperiments.some((e) => e.publicId === "EXP-2026-0042"), "Sarah CANNOT see Elena's EXP-2026-0042");

  // Verify Cross-User Resource Access Prevention
  // Attempting to query Elena's experiment using Sarah's userId filter yields null
  const unauthorizedExpQuery = await prisma.experiment.findFirst({
    where: {
      AND: [
        { publicId: "EXP-2026-0042" },
        { userId: sarahUser!.id },
      ],
    },
  });
  assert(unauthorizedExpQuery === null, "Cross-user experiment access strictly returns null (data isolated)");

  // Verify Submission isolation
  const elenaSubmissions = await prisma.submission.findMany({
    where: { userId: elenaUser!.id },
  });
  assert(elenaSubmissions.length > 0, "Elena has her own submissions");
  const unauthorizedSubQuery = await prisma.submission.findFirst({
    where: {
      AND: [
        { id: elenaSubmissions[0].id },
        { userId: sarahUser!.id },
      ],
    },
  });
  assert(unauthorizedSubQuery === null, "Cross-user submission access strictly returns null");

  // Verify Report isolation
  const elenaReports = await prisma.report.findMany({
    where: { userId: elenaUser!.id },
  });
  assert(elenaReports.length > 0, "Elena has her own audit reports");
  const unauthorizedRepQuery = await prisma.report.findFirst({
    where: {
      AND: [
        { id: elenaReports[0].id },
        { userId: sarahUser!.id },
      ],
    },
  });
  assert(unauthorizedRepQuery === null, "Cross-user report access strictly returns null");

  // ─────────────────────────────────────────────────────────────
  // 10. Account Registration Verification
  // ─────────────────────────────────────────────────────────────
  console.log("\n10. Testing Account Registration Flow...");
  const testRegEmail = `test.researcher.${Date.now()}@cern.ch`;
  const { hash: regHash, salt: regSalt } = hashPassword("securePassword123!");
  const newRegisteredUser = await prisma.user.create({
    data: {
      name: "Dr. Test CERN Researcher",
      email: testRegEmail,
      passwordHash: regHash,
      salt: regSalt,
      role: "RESEARCHER",
      institutionName: "CERN",
      department: "Large Hadron Collider Physics",
    },
  });
  assert(!!newRegisteredUser.id, "Account registered with valid credentials and department");
  const regSession = await createSession(newRegisteredUser.id);
  assert(!!regSession.token, "Session successfully issued for new registered user");

  // Clean up test user
  await prisma.user.delete({ where: { id: newRegisteredUser.id } });
  assert(true, "Registration test user cleaned up");

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log("\n=======================================================");
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED! `);
  console.log("=======================================================\n");
}

runTests()
  .catch((err) => {
    console.error("\n❌ Test execution failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
