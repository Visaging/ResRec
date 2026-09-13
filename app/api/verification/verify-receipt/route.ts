import { NextResponse } from "next/server";
import { CooLVerificationService } from "@/lib/cool/verification-service";
import { formatVerdict, verifyEvidence } from "cool-nwc";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const receiptInput = body.receipt || body;

    if (!receiptInput) {
      return NextResponse.json(
        { error: "Missing receipt payload to verify" },
        { status: 400 }
      );
    }

    const verificationResult = await CooLVerificationService.verifyReceipt(receiptInput);

    let asciiReport = "";
    if (verificationResult.verdictRaw) {
      try {
        asciiReport = formatVerdict(verificationResult.verdictRaw);
      } catch {
        asciiReport = "";
      }
    }

    return NextResponse.json({
      ...verificationResult,
      report: asciiReport,
    });
  } catch (error: unknown) {
    console.error("POST /api/verification/verify-receipt Error:", error);
    return NextResponse.json(
      { error: "Failed to verify receipt", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
