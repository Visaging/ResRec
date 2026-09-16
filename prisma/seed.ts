import { prisma } from "../lib/db/prisma";
import { CooLEvidenceService } from "../lib/cool/evidence-service";
import { sha256Hex, sha256Multihash } from "../lib/cool/hash";
import { hashPassword } from "../lib/auth/password";

async function main() {
  console.log("🌱 Starting ResRec database seed with real CooL cryptographic receipts...");

  // 1. Clean existing records in dependency order
  await prisma.session.deleteMany();
  await prisma.verificationRecord.deleteMany();
  await prisma.report.deleteMany();
  await prisma.correction.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.result.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.processingEvent.deleteMany();
  await prisma.datasetVersion.deleteMany();
  await prisma.dataset.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.evidenceRecord.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.sample.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  // 2. Institutions
  const iitBombay = await prisma.institution.create({
    data: {
      name: "IIT Bombay Energy Materials Institute",
      department: "Materials Science & Electrochemical Engineering",
    },
  });

  const iiscBengaluru = await prisma.institution.create({
    data: {
      name: "Indian Institute of Science Genome Engineering Centre",
      department: "Genome Editing Core",
    },
  });

  const iitDelhi = await prisma.institution.create({
    data: {
      name: "IIT Delhi High Pressure Materials Laboratory",
      department: "High Pressure Condensed Matter Physics",
    },
  });

  // 3. Users
  const defaultAuth = hashPassword("password123");

  const elena = await prisma.user.create({
    data: {
      name: "Akshat Agrawal",
      email: "akshat.agrawal@iitb.ac.in",
      role: "RESEARCHER",
      institutionId: iitBombay.id,
      institutionName: "Indian Institute of Technology Bombay",
      department: "Department of Materials Science and Engineering",
      passwordHash: defaultAuth.hash,
      salt: defaultAuth.salt,
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: "Abhinav Raturi",
      email: "abhinav.raturi@iitm.ac.in",
      role: "REVIEWER",
      institutionId: iitBombay.id,
      institutionName: "Indian Institute of Technology Madras",
      department: "Department of Materials Science and Engineering",
      passwordHash: defaultAuth.hash,
      salt: defaultAuth.salt,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Armaan Singh",
      email: "armaan.singh@iisc.ac.in",
      role: "RESEARCHER",
      institutionId: iiscBengaluru.id,
      institutionName: "Indian Institute of Science, Bengaluru",
      department: "Genomics & CRISPR Therapeutics",
      passwordHash: defaultAuth.hash,
      salt: defaultAuth.salt,
    },
  });

  const alexei = await prisma.user.create({
    data: {
      name: "Ayush Roy",
      email: "ayush.roy@iitd.ac.in",
      role: "RESEARCHER",
      institutionId: iitDelhi.id,
      institutionName: "Indian Institute of Technology Delhi",
      department: "High Pressure Condensed Matter Physics",
      passwordHash: defaultAuth.hash,
      salt: defaultAuth.salt,
    },
  });

  // 4. Instruments
  const potentiostat = await prisma.instrument.create({
    data: {
      name: "Gamry Interface 5000E Potentiostat",
      model: "Interface 5000E",
      serialNumber: "GAM-5000E-8831",
      calibrationStatus: "calibrated",
      lastCalibratedAt: new Date("2026-08-15T09:00:00Z"),
    },
  });

  const ngsSequencer = await prisma.instrument.create({
    data: {
      name: "Illumina NovaSeq X Plus",
      model: "NovaSeq X Plus",
      serialNumber: "NVX-90214-B",
      calibrationStatus: "calibrated",
      lastCalibratedAt: new Date("2026-08-20T10:30:00Z"),
    },
  });

  const dacCryostat = await prisma.instrument.create({
    data: {
      name: "Quantum Design PPMS Dynacool with DAC",
      model: "Dynacool 9T",
      serialNumber: "QD-PPMS-4412",
      calibrationStatus: "calibrated",
      lastCalibratedAt: new Date("2026-07-28T14:15:00Z"),
    },
  });

  // 5. Samples
  const batterySample = await prisma.sample.create({
    data: {
      name: "NMC-811 / Graphite Pouch Cell (3.2Ah)",
      type: "Lithium-Ion Pouch Cell",
      batchId: "BATCH-2026-02-A",
      preparationNotes: "Vacuum dried at 80°C for 24h, 1M LiPF6 in EC/EMC (3:7 wt%) electrolyte with 2% VC additive.",
    },
  });

  const crisprSample = await prisma.sample.create({
    data: {
      name: "HEK293T Human Embryonic Kidney Line",
      type: "Cell Culture",
      batchId: "CELL-HEK-2026-08",
      preparationNotes: "Passage 14, transfected with SpCas9-gRNA ribonucleoprotein complexes targeting EMX1 locus.",
    },
  });

  const hydrideSample = await prisma.sample.create({
    data: {
      name: "Lanthanum Superhydride (LaH10)",
      type: "High-Pressure Hydride",
      batchId: "HYD-LAH10-2026-01",
      preparationNotes: "Laser-heated diamond anvil cell synthesis at 170 GPa and 2200 K.",
    },
  });

  let globalSequence = 1;

  // ──────────────────────────────────────────────────────────────────────────
  // 6. EXP-2026-0042: Lithium-Ion Battery Thermal Cycling
  // ──────────────────────────────────────────────────────────────────────────
  console.log("⚡ Creating EXP-2026-0042 with real CooL evidence records...");
  const exp42 = await prisma.experiment.create({
    data: {
      publicId: "EXP-2026-0042",
      userId: elena.id,
      title: "Lithium-Ion Battery Thermal Cycling Under Rapid Charge Conditions",
      description: "High-rate 4C fast-charging cyclic voltammetry and capacity degradation analysis across 48 thermal cycling intervals.",
      objective: "Evaluate degradation mechanisms and thermal runaway precursors during 4C ultrafast charging cycles under controlled temperature gradients (25°C to 65°C).",
      principalInvestigator: "Dr. Elena Rostova",
      researchGroup: "Advanced Energy Storage Group",
      institutionId: iitBombay.id,
      instrumentId: potentiostat.id,
      instrumentName: potentiostat.name,
      sampleId: batterySample.id,
      sampleName: batterySample.name,
      protocol: "PROT-BATT-4C-CYCLING-V3",
      environment: "Arbin Multi-Chamber Thermal Chamber at 45.0 ± 0.2 °C, ambient RH 22%",
      status: "under_review",
      integrityStatus: "verified",
      recordCount: 48,
      evidenceCount: 52,
    },
  });

  // Record experiment creation
  const exp42Evidence = await CooLEvidenceService.recordExperiment({
    id: exp42.id,
    publicId: exp42.publicId,
    title: exp42.title,
    objective: exp42.objective,
    principalInvestigator: exp42.principalInvestigator,
    researchGroup: exp42.researchGroup,
  });

  await prisma.experiment.update({
    where: { id: exp42.id },
    data: { evidenceRecordId: exp42Evidence.evidenceRecord.id },
  });

  // Create 48 measurements for EXP-2026-0042
  console.log("   Generating 48 measurements and CooL receipts for EXP-2026-0042...");
  const measurements42 = [];
  const baseTime = new Date("2026-08-25T08:00:00Z").getTime();

  for (let trial = 1; trial <= 48; trial++) {
    globalSequence++;
    const publicId = `MEAS-${String(trial).padStart(5, "0")}`;
    const timestamp = new Date(baseTime + (trial - 1) * 3600 * 1000);
    
    // Realistic exponential decay + slight noise for battery capacity retention
    const nominalCapacity = 100 - (trial * 0.28) - (trial > 25 ? (trial - 25) * 0.12 : 0) + (Math.sin(trial) * 0.05);
    const roundedValue = parseFloat(nominalCapacity.toFixed(2));
    
    const internalResistance = parseFloat((12.4 + trial * 0.11 + Math.cos(trial) * 0.03).toFixed(2));
    const cellTemp = parseFloat((44.8 + Math.sin(trial * 0.5) * 1.6).toFixed(1));

    const metadata = {
      cycleNumber: trial,
      chargeRateC: 4.0,
      dischargeRateC: 1.0,
      internalResistance_mOhm: internalResistance,
      peakTemperature_C: cellTemp,
      coulombicEfficiency_pct: parseFloat((99.82 - (trial * 0.015)).toFixed(2)),
    };

    const isTrial14Original = trial === 14;
    const value = isTrial14Original ? 98.42 : roundedValue; // Initial measurement for trial 14 was 98.42%

    // Create CooL evidence receipt for measurement
    const measEvidence = await CooLEvidenceService.recordMeasurement(
      exp42.id,
      {
        publicId,
        trialNumber: trial,
        timestamp,
        value,
        unit: "% Initial Capacity",
        instrumentName: potentiostat.name,
        sampleName: batterySample.name,
        metadata,
      },
      globalSequence
    );

    const createdMeas = await prisma.measurement.create({
      data: {
        publicId,
        experimentId: exp42.id,
        trialNumber: trial,
        timestamp,
        value,
        unit: "% Initial Capacity",
        instrumentName: potentiostat.name,
        instrumentId: potentiostat.id,
        sampleId: batterySample.id,
        metadata: JSON.stringify(metadata),
        status: "verified",
        evidenceRecordId: measEvidence.evidenceRecord.id,
      },
    });

    measurements42.push(createdMeas);
  }

  // Handle Trial 14 Correction
  console.log("   Sealing immutable correction for Trial #14 (MEAS-00014)...");
  const origMeas14 = measurements42.find((m) => m.trialNumber === 14)!;
  globalSequence++;

  const corrMeasPublicId = "MEAS-00014-C1";
  const correctedValue = 97.18;
  const correctionReason = "Thermocouple recalibration after drift detection (+0.85°C offset corrected)";
  const correctionNote = "Sensor channel 3 experienced drift between cycles 12 and 16. Recalibrated against reference RTD probe; capacity retention adjusted for thermal expansion baseline.";

  const corrEvidence = await CooLEvidenceService.recordCorrection(
    exp42.id,
    {
      originalMeasurementPublicId: origMeas14.publicId,
      originalValue: origMeas14.value,
      correctedMeasurementPublicId: corrMeasPublicId,
      correctedValue,
      reason: correctionReason,
      note: correctionNote,
      operator: "Dr. Elena Rostova",
    },
    globalSequence
  );

  const correctedMeas14 = await prisma.measurement.create({
    data: {
      publicId: corrMeasPublicId,
      experimentId: exp42.id,
      trialNumber: 14,
      timestamp: origMeas14.timestamp,
      value: correctedValue,
      unit: origMeas14.unit,
      instrumentName: origMeas14.instrumentName,
      instrumentId: origMeas14.instrumentId,
      sampleId: origMeas14.sampleId,
      metadata: origMeas14.metadata,
      status: "verified",
      evidenceRecordId: corrEvidence.evidenceRecord.id,
      correctionOf: origMeas14.id,
      correctionReason,
      correctionNote,
    },
  });

  await prisma.correction.create({
    data: {
      originalMeasurementId: origMeas14.id,
      correctedMeasurementId: correctedMeas14.id,
      originalValue: origMeas14.value,
      correctedValue,
      reason: correctionReason,
      note: correctionNote,
      operator: "Dr. Elena Rostova",
      evidenceRecordId: corrEvidence.evidenceRecord.id,
    },
  });

  // Datasets for EXP-2026-0042
  console.log("   Creating Dataset DS-2026-0081 with 3 version checkpoints...");
  const rawCsvV1 = `trial,cycle,capacity_pct,resistance_mohm,temp_c\n` + measurements42.map((m) => `${m.trialNumber},${m.trialNumber},${m.value},12.5,45.0`).join("\n");
  const rawCsvV2 = `trial,cycle,capacity_pct,resistance_mohm,temp_c\n` + measurements42.map((m) => `${m.trialNumber},${m.trialNumber},${m.trialNumber === 14 ? 97.18 : m.value},12.5,45.0`).join("\n");
  const rawCsvV3 = `trial,cycle,capacity_pct,normalized_soh,resistance_mohm,temp_c\n` + measurements42.map((m) => `${m.trialNumber},${m.trialNumber},${m.trialNumber === 14 ? 97.18 : m.value},${((m.trialNumber === 14 ? 97.18 : m.value) / 100).toFixed(4)},12.5,45.0`).join("\n");

  const hashV1 = sha256Hex(rawCsvV1);
  const hashV2 = sha256Hex(rawCsvV2);
  const hashV3 = sha256Hex(rawCsvV3);

  globalSequence++;
  const dsEvV1 = await CooLEvidenceService.recordDatasetVersion(
    exp42.id,
    {
      publicId: "DS-2026-0081",
      name: "Thermal Cycling Raw Telemetry",
      version: 1,
      filename: "thermal_cycling_raw_v1.csv",
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV1),
      fileHash: hashV1,
      dataContent: rawCsvV1,
    },
    globalSequence
  );

  globalSequence++;
  const dsEvV2 = await CooLEvidenceService.recordDatasetVersion(
    exp42.id,
    {
      publicId: "DS-2026-0081",
      name: "Thermal Cycling Raw Telemetry",
      version: 2,
      filename: "thermal_cycling_recalibrated_v2.csv",
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV2),
      fileHash: hashV2,
      dataContent: rawCsvV2,
    },
    globalSequence
  );

  globalSequence++;
  const dsEvV3 = await CooLEvidenceService.recordDatasetVersion(
    exp42.id,
    {
      publicId: "DS-2026-0081",
      name: "Thermal Cycling Raw Telemetry",
      version: 3,
      filename: "thermal_cycling_normalized_v3.csv",
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV3),
      fileHash: hashV3,
      dataContent: rawCsvV3,
    },
    globalSequence
  );

  const dataset42 = await prisma.dataset.create({
    data: {
      publicId: "DS-2026-0081",
      experimentId: exp42.id,
      name: "Thermal Cycling Raw Telemetry",
      filename: "thermal_cycling_normalized_v3.csv",
      description: "Complete multichannel electrochemical telemetry containing capacity retention, cell impedance, and surface thermometry across 48 cycles.",
      currentVersion: 3,
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV3),
      sha256: hashV3,
      coolCommitment: dsEvV3.digest,
      evidenceRecordId: dsEvV3.evidenceRecord.id,
      status: "verified",
    },
  });

  const v1 = await prisma.datasetVersion.create({
    data: {
      datasetId: dataset42.id,
      version: 1,
      filename: "thermal_cycling_raw_v1.csv",
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV1),
      fileHash: hashV1,
      commitment: dsEvV1.digest,
      evidenceRecordId: dsEvV1.evidenceRecord.id,
      status: "verified",
      createdBy: "Dr. Elena Rostova",
    },
  });

  const v2 = await prisma.datasetVersion.create({
    data: {
      datasetId: dataset42.id,
      version: 2,
      filename: "thermal_cycling_recalibrated_v2.csv",
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV2),
      fileHash: hashV2,
      commitment: dsEvV2.digest,
      evidenceRecordId: dsEvV2.evidenceRecord.id,
      status: "verified",
      createdBy: "Dr. Elena Rostova",
    },
  });

  const v3 = await prisma.datasetVersion.create({
    data: {
      datasetId: dataset42.id,
      version: 3,
      filename: "thermal_cycling_normalized_v3.csv",
      recordCount: 48,
      fileSize: Buffer.byteLength(rawCsvV3),
      fileHash: hashV3,
      commitment: dsEvV3.digest,
      evidenceRecordId: dsEvV3.evidenceRecord.id,
      status: "verified",
      createdBy: "Dr. Elena Rostova",
    },
  });

  // Processing Events
  console.log("   Creating processing events linking dataset versions...");
  globalSequence++;
  const proc1Ev = await CooLEvidenceService.recordProcessingEvent(
    exp42.id,
    {
      operation: "baseline_drift_correction",
      description: "Recalibrated thermocouple drift (+0.85°C offset) on trial 14 and adjusted capacity baseline.",
      parameters: { channel: 3, tempOffsetDelta: 0.85, algorithm: "linear_spline_correction" },
      inputVersion: 1,
      outputVersion: 2,
    },
    globalSequence
  );

  await prisma.processingEvent.create({
    data: {
      experimentId: exp42.id,
      operation: "baseline_drift_correction",
      description: "Recalibrated thermocouple drift (+0.85°C offset) on trial 14 and adjusted capacity baseline.",
      parameters: JSON.stringify({ channel: 3, tempOffsetDelta: 0.85, algorithm: "linear_spline_correction" }),
      inputDatasetVersionId: v1.id,
      outputDatasetVersionId: v2.id,
      evidenceRecordId: proc1Ev.evidenceRecord.id,
    },
  });

  globalSequence++;
  const proc2Ev = await CooLEvidenceService.recordProcessingEvent(
    exp42.id,
    {
      operation: "state_of_health_normalization",
      description: "Normalized capacity retention to initial discharge reference (C0 = 3.20 Ah) and computed SOH curve.",
      parameters: { referenceCapacityAh: 3.20, smoothingFilter: "Savitzky-Golay (window=5, order=2)" },
      inputVersion: 2,
      outputVersion: 3,
    },
    globalSequence
  );

  await prisma.processingEvent.create({
    data: {
      experimentId: exp42.id,
      operation: "state_of_health_normalization",
      description: "Normalized capacity retention to initial discharge reference (C0 = 3.20 Ah) and computed SOH curve.",
      parameters: JSON.stringify({ referenceCapacityAh: 3.20, smoothingFilter: "Savitzky-Golay (window=5, order=2)" }),
      inputDatasetVersionId: v2.id,
      outputDatasetVersionId: v3.id,
      evidenceRecordId: proc2Ev.evidenceRecord.id,
    },
  });

  // Analysis & Results
  const analysis42 = await prisma.analysis.create({
    data: {
      experimentId: exp42.id,
      inputDatasetVersionId: v3.id,
      analysisType: "thermal_decay_model",
      parameters: JSON.stringify({ model: "Arrhenius Arr(T) = A * exp(-Ea / RT)", fitMethod: "Nonlinear Levenberg-Marquardt" }),
      software: "SciPy Optimize",
      softwareVersion: "1.13.0",
      status: "completed",
      output: JSON.stringify({
        degradationRatePctPerCycle: 0.042,
        rSquared: 0.994,
        thresholdTempC: 47.8,
        projectedCyclesTo80Pct: 532,
      }),
    },
  });

  await prisma.result.createMany({
    data: [
      {
        experimentId: exp42.id,
        analysisId: analysis42.id,
        name: "Degradation Rate (4C Ultra-Fast)",
        value: "0.042% / cycle",
        unit: "%/cycle",
        description: "Linearized capacity fade coefficient under sustained 4C charging protocol.",
      },
      {
        experimentId: exp42.id,
        analysisId: analysis42.id,
        name: "Threshold Temperature for SEI Acceleration",
        value: "47.8 °C",
        unit: "°C",
        description: "Critical cell temperature where solid-electrolyte interphase decomposition accelerates.",
      },
      {
        experimentId: exp42.id,
        analysisId: analysis42.id,
        name: "Projected Cycle Life (80% SOH EOL)",
        value: "532 cycles",
        unit: "cycles",
        description: "Extrapolated cycle threshold before cell reaches 80% remaining nominal capacity.",
      },
    ],
  });

  // Submission for EXP-2026-0042
  await prisma.submission.create({
    data: {
      publicId: "SUB-2026-1042",
      userId: elena.id,
      experimentId: exp42.id,
      title: "Thermal Degradation and Precursor Detection in Ultra-Fast Charged High-Nickel Pouch Cells",
      abstract: "Investigation of solid electrolyte interphase (SEI) transition kinetics in 3.2Ah NMC-811 pouch cells under 4C rapid charge cycling with sealed cryptographically bound receipts.",
      authors: JSON.stringify(["Dr. Elena Rostova", "Dr. Marcus Vance", "A. Chen"]),
      institution: "IIT Bombay Energy Materials Institute",
      status: "under_review",
      totalRecords: 48,
      verifiedRecords: 48,
      integrityStatus: "verified",
      submittedAt: new Date("2026-08-30T16:00:00Z"),
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. EXP-2026-0038: CRISPR-Cas9 Off-Target Cleavage Kinetics
  // ──────────────────────────────────────────────────────────────────────────
  console.log("🧬 Creating EXP-2026-0038 (CRISPR Cleavage Kinetics)...");
  const exp38 = await prisma.experiment.create({
    data: {
      publicId: "EXP-2026-0038",
      userId: sarah.id,
      title: "CRISPR-Cas9 Off-Target Cleavage Kinetics in HEK293T Cells",
      description: "High-throughput sequencing analysis of SpCas9 double-strand break repair kinetics across 12 candidate off-target loci.",
      objective: "Quantify cleavage rates (k_cat/K_M) across mismatched guide RNA targets using continuous targeted NGS sequencing.",
      principalInvestigator: "Dr. Sarah Lin",
      researchGroup: "Genome Editing Core",
      institutionId: iiscBengaluru.id,
      instrumentId: ngsSequencer.id,
      instrumentName: ngsSequencer.name,
      sampleId: crisprSample.id,
      sampleName: crisprSample.name,
      protocol: "PROT-CRISPR-NGS-SEQ-V2",
      environment: "BSL-2 sterile hood, 37.0 °C, 5% CO2",
      status: "completed",
      integrityStatus: "verified",
      recordCount: 32,
      evidenceCount: 35,
    },
  });

  const exp38Evidence = await CooLEvidenceService.recordExperiment({
    id: exp38.id,
    publicId: exp38.publicId,
    title: exp38.title,
    objective: exp38.objective,
    principalInvestigator: exp38.principalInvestigator,
    researchGroup: exp38.researchGroup,
  });

  await prisma.experiment.update({
    where: { id: exp38.id },
    data: { evidenceRecordId: exp38Evidence.evidenceRecord.id },
  });

  for (let trial = 1; trial <= 32; trial++) {
    globalSequence++;
    const publicId = `MEAS-00038-${String(trial).padStart(3, "0")}`;
    const timestamp = new Date(new Date("2026-08-10T09:00:00Z").getTime() + trial * 1800 * 1000);
    const cleavageRate = parseFloat((0.015 + (trial * 0.008) + Math.cos(trial) * 0.002).toFixed(4));
    
    const measEv = await CooLEvidenceService.recordMeasurement(
      exp38.id,
      {
        publicId,
        trialNumber: trial,
        timestamp,
        value: cleavageRate,
        unit: "min⁻¹",
        instrumentName: ngsSequencer.name,
        sampleName: crisprSample.name,
        metadata: { locusId: `OT-Locus-${(trial % 8) + 1}`, readDepth: 125000 + trial * 2500 },
      },
      globalSequence
    );

    await prisma.measurement.create({
      data: {
        publicId,
        experimentId: exp38.id,
        trialNumber: trial,
        timestamp,
        value: cleavageRate,
        unit: "min⁻¹",
        instrumentName: ngsSequencer.name,
        instrumentId: ngsSequencer.id,
        sampleId: crisprSample.id,
        metadata: JSON.stringify({ locusId: `OT-Locus-${(trial % 8) + 1}`, readDepth: 125000 + trial * 2500 }),
        status: "verified",
        evidenceRecordId: measEv.evidenceRecord.id,
      },
    });
  }

  const ds38Csv = `trial,locus,rate_min_inv\n` + Array.from({ length: 32 }, (_, i) => `${i+1},OT-Locus-${(i % 8) + 1},${(0.015 + (i+1) * 0.008).toFixed(4)}`).join("\n");
  const ds38Hash = sha256Hex(ds38Csv);

  globalSequence++;
  const ds38Ev = await CooLEvidenceService.recordDatasetVersion(
    exp38.id,
    {
      publicId: "DS-2026-0054",
      name: "CRISPR Deep-Seq Kinetics Dataset",
      version: 1,
      filename: "crispr_deepseq_kinetics_v1.csv",
      recordCount: 32,
      fileSize: Buffer.byteLength(ds38Csv),
      fileHash: ds38Hash,
      dataContent: ds38Csv,
    },
    globalSequence
  );

  const ds38 = await prisma.dataset.create({
    data: {
      publicId: "DS-2026-0054",
      experimentId: exp38.id,
      name: "CRISPR Deep-Seq Kinetics Dataset",
      filename: "crispr_deepseq_kinetics_v1.csv",
      description: "Targeted amplicon NGS reads and cleavage fraction timecourses.",
      currentVersion: 1,
      recordCount: 32,
      fileSize: Buffer.byteLength(ds38Csv),
      sha256: ds38Hash,
      coolCommitment: ds38Ev.digest,
      evidenceRecordId: ds38Ev.evidenceRecord.id,
      status: "verified",
    },
  });

  await prisma.datasetVersion.create({
    data: {
      datasetId: ds38.id,
      version: 1,
      filename: "crispr_deepseq_kinetics_v1.csv",
      recordCount: 32,
      fileSize: Buffer.byteLength(ds38Csv),
      fileHash: ds38Hash,
      commitment: ds38Ev.digest,
      evidenceRecordId: ds38Ev.evidenceRecord.id,
      status: "verified",
      createdBy: "Dr. Sarah Lin",
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. EXP-2026-0019: Superconducting Transition in LaH10 Hydrides
  // ──────────────────────────────────────────────────────────────────────────
  console.log("⚛️ Creating EXP-2026-0019 (High-Pressure Hydride Superconductivity)...");
  const exp19 = await prisma.experiment.create({
    data: {
      publicId: "EXP-2026-0019",
      userId: alexei.id,
      title: "Superconducting Transition Temperature in Pressurized LaH10 Hydrides",
      description: "Four-point electrical resistance temperature sweeps under 170 GPa confining diamond anvil cell pressure.",
      objective: "Determine critical transition temperature Tc and upper critical magnetic field Hc2(0) in cubic LaH10.",
      principalInvestigator: "Dr. Alexei Petrov",
      researchGroup: "High Pressure Physics Laboratory",
      institutionId: iitDelhi.id,
      instrumentId: dacCryostat.id,
      instrumentName: dacCryostat.name,
      sampleId: hydrideSample.id,
      sampleName: hydrideSample.name,
      protocol: "PROT-DAC-RESISTANCE-CRYOGENIC-V1",
      environment: "Cryostat chamber at 1.8 K to 300 K under high vacuum (10⁻⁶ Torr)",
      status: "completed",
      integrityStatus: "verified",
      recordCount: 24,
      evidenceCount: 26,
    },
  });

  const exp19Evidence = await CooLEvidenceService.recordExperiment({
    id: exp19.id,
    publicId: exp19.publicId,
    title: exp19.title,
    objective: exp19.objective,
    principalInvestigator: exp19.principalInvestigator,
    researchGroup: exp19.researchGroup,
  });

  await prisma.experiment.update({
    where: { id: exp19.id },
    data: { evidenceRecordId: exp19Evidence.evidenceRecord.id },
  });

  for (let trial = 1; trial <= 24; trial++) {
    globalSequence++;
    const publicId = `MEAS-00019-${String(trial).padStart(3, "0")}`;
    const timestamp = new Date(new Date("2026-07-20T11:00:00Z").getTime() + trial * 2400 * 1000);
    const temperatureK = 230 + trial * 1.5;
    const resistanceMilliOhm = temperatureK < 250 ? 0.0001 : parseFloat(((temperatureK - 250) * 1.82).toFixed(3));
    
    const measEv = await CooLEvidenceService.recordMeasurement(
      exp19.id,
      {
        publicId,
        trialNumber: trial,
        timestamp,
        value: resistanceMilliOhm,
        unit: "mΩ",
        instrumentName: dacCryostat.name,
        sampleName: hydrideSample.name,
        metadata: { temperatureK, pressureGpa: 170.5, magneticFieldTesla: 0.0 },
      },
      globalSequence
    );

    await prisma.measurement.create({
      data: {
        publicId,
        experimentId: exp19.id,
        trialNumber: trial,
        timestamp,
        value: resistanceMilliOhm,
        unit: "mΩ",
        instrumentName: dacCryostat.name,
        instrumentId: dacCryostat.id,
        sampleId: hydrideSample.id,
        metadata: JSON.stringify({ temperatureK, pressureGpa: 170.5, magneticFieldTesla: 0.0 }),
        status: "verified",
        evidenceRecordId: measEv.evidenceRecord.id,
      },
    });
  }

  // 9. Audit Reports
  await prisma.report.createMany({
    data: [
      {
        publicId: "REP-2026-0012",
        userId: elena.id,
        title: "Lithium-Ion Battery Integrity & Provenance Audit Report",
        type: "verification",
        experimentId: exp42.id,
        generatedBy: "ResRec Automated Verification Engine",
        generatedAt: new Date("2026-09-01T12:00:00Z"),
        sizeBytes: 245760,
        status: "ready",
        summary: "Full cryptographic audit across 48 measurement receipts, 3 dataset version milestones, 2 processing transformations, and 1 correction event. All ML-DSA-65 signatures, binding hashes, and Merkle tree leaves verified valid.",
      },
      {
        publicId: "REP-2026-0008",
        userId: sarah.id,
        title: "CRISPR Cleavage Kinetic Verification Summary",
        type: "audit",
        experimentId: exp38.id,
        generatedBy: "ResRec Automated Verification Engine",
        generatedAt: new Date("2026-08-22T14:30:00Z"),
        sizeBytes: 184320,
        status: "ready",
        summary: "End-to-end provenance verification confirmed 32 sequencing run receipts and baseline alignment with zero sequence gaps or hash deviations.",
      },
    ],
  });

  console.log("✅ Seed completed successfully! Database ready with live cryptographic proofs.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
