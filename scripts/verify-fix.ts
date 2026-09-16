import { prisma } from "../lib/db/prisma";
import { verifyPassword } from "../lib/auth/password";
import { createSession } from "../lib/auth/server";

async function run() {
  console.log("==================================================");
  console.log("  ResRec Database & Auth Verification");
  console.log("==================================================");

  const demoEmails = [
    { email: "akshat.agrawal@iitb.ac.in", expectedName: "Akshat Agrawal" },
    { email: "armaan.singh@iisc.ac.in", expectedName: "Armaan Singh" },
    { email: "ayush.roy@iitd.ac.in", expectedName: "Ayush Roy" },
    { email: "abhinav.raturi@iitm.ac.in", expectedName: "Abhinav Raturi" },
  ];

  console.log("\n1. Testing User Lookups and Passwords:");
  for (const { email, expectedName } of demoEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { institution: true },
    });

    if (!user) {
      throw new Error(`User ${email} not found in database!`);
    }

    if (user.name !== expectedName) {
      throw new Error(`User name mismatch: expected ${expectedName}, got ${user.name}`);
    }

    const isValid = verifyPassword("password123", user.passwordHash!, user.salt!);
    if (!isValid) {
      throw new Error(`Password verification failed for ${email}`);
    }

    console.log(`  ✓ ${user.name} (${user.role}) @ ${user.institution?.name || "No Inst"}: OK`);
  }

  console.log("\n2. Testing Session Creation & Deletion (Write Capability):");
  const armaan = await prisma.user.findUnique({
    where: { email: "armaan.singh@iisc.ac.in" },
  });
  const { token, expiresAt } = await createSession(armaan!.id);
  console.log(`  ✓ Created session for Armaan Singh: token=${token.substring(0, 16)}... expires=${expiresAt.toISOString()}`);

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.userId !== armaan!.id) {
    throw new Error("Session retrieval failed!");
  }
  console.log("  ✓ Retrieved created session from database: OK");

  await prisma.session.delete({ where: { token } });
  console.log("  ✓ Cleaned up session: OK");

  console.log("\n3. Testing Experiments & Verification Records:");
  const experiments = await prisma.experiment.findMany({
    include: { user: true, measurements: true, evidenceRecords: true },
  });
  console.log(`  ✓ Loaded ${experiments.length} experiments:`);
  for (const exp of experiments) {
    const ownerName = exp.user?.name ?? "Unknown owner";
    console.log(`    - [${exp.publicId}] ${exp.title.substring(0, 40)}... (Owner: ${ownerName}, Status: ${exp.status})`);
  }

  console.log("\n==================================================");
  console.log("  ALL FIX VERIFICATIONS PASSED SUCCESSFULLY! ✅");
  console.log("==================================================");
}

run()
  .catch((err) => {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
