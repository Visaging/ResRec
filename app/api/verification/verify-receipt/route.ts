import { NextResponse } from "next/server";
import { CooLVerificationService } from "@/lib/cool/verification-service";
import { formatVerdict, verifyEvidence } from "cool-nwc";

function normalizeReceiptInput(value: unknown): unknown {
  if (value == null) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return value;

    try {
      return normalizeReceiptInput(JSON.parse(trimmed));
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.length === 1 ? normalizeReceiptInput(value[0]) : value;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.schema === "cool.receipt.v2") return value;
    if ("receipt" in obj && obj.receipt != null) return normalizeReceiptInput(obj.receipt);
    if ("evidenceJson" in obj && obj.evidenceJson != null) return normalizeReceiptInput(obj.evidenceJson);
    if ("evidence" in obj && obj.evidence != null) return normalizeReceiptInput(obj.evidence);
    if ("evidenceRecord" in obj && obj.evidenceRecord != null) {
      return normalizeReceiptInput(obj.evidenceRecord);
    }
  }

  return value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const receiptInput = normalizeReceiptInput(body?.receipt ?? body);

    if (!receiptInput) {
      return NextResponse.json(
        { error: "Missing receipt payload to verify" },
        { status: 400 }
      );
    }

    const verificationResult = await CooLVerificationService.verifyReceipt(receiptInput as string | object);

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
