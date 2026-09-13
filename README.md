# ResRec — Research Rectifier

A research integrity and experimental evidence platform powered by CooL (Cryptographic Operations Language).

## Overview

ResRec is a professional research evidence management system designed for research institutions, granting bodies, academic reviewers, ethics committees, laboratories, and scientific auditors.

The platform enables researchers to:
- Create and manage experiments
- Record experimental measurements with traceability
- Upload and version datasets
- Record corrections instead of silently overwriting data
- Generate cryptographic evidence using CooL
- Verify research record integrity
- Provide independent verification for reviewers
- Trace published results back to experimental evidence

## Core Principle

> **Don't just trust the research record. Verify it.**

ResRec does not claim to prove scientific correctness. It proves the **integrity and history** of recorded evidence.

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with Lucide icons
- **Charts**: Recharts (for scientific visualizations)
- **Date Handling**: date-fns

## Project Structure

```
resrec/
├── app/                          # Next.js app router pages
│   ├── layout.tsx               # Root layout with AppLayout
│   ├── page.tsx                 # Dashboard (home page)
│   ├── experiments/
│   │   ├── page.tsx            # Experiments list
│   │   └── [id]/page.tsx       # Experiment detail with tabs
│   ├── datasets/page.tsx        # Datasets management
│   ├── evidence/page.tsx        # Evidence records
│   ├── verification/page.tsx    # Verification Center (key feature)
│   ├── provenance/page.tsx      # Provenance visualization
│   └── globals.css              # Global styles
├── components/
│   ├── AppLayout.tsx            # Main application shell with sidebar
│   └── ui.tsx                   # Reusable UI components
├── features/                     # Feature-specific components (empty structure)
│   ├── experiments/
│   ├── measurements/
│   ├── datasets/
│   ├── verification/
│   └── provenance/
├── services/
│   ├── api.ts                   # API service layer (currently with mock data)
│   └── mockData.ts              # Realistic mock research data
├── types/
│   └── index.ts                 # TypeScript type definitions
└── lib/
    └── utils.ts                 # Utility functions
```

## Features Implemented

### 1. Dashboard
- Research integrity overview
- Summary metrics (experiments, datasets, evidence records, issues)
- Recent experiments table
- Recent evidence activity
- Integrity alerts

### 2. Experiments Management
- List all experiments with filtering
- Search by experiment ID, title, or researcher
- Filter by status (active, completed, under review, integrity issue)
- Detailed experiment view with tabs:
  - **Overview**: Research objective, experimental setup, integrity status
  - **Measurements**: Tabular measurement records
  - **Datasets**: Dataset versions with commitments
  - **Evidence**: Evidence records for the experiment
  - **Provenance**: Research lineage visualization

### 3. Datasets
- Dataset registry with version tracking
- SHA-256 and CooL commitment display
- Copy-to-clipboard for cryptographic values
- Dataset integrity status
- Link to evidence records

### 4. Evidence Records
- Complete evidence registry
- Cryptographic verification details:
  - Binding verification
  - Signature verification
  - Transparency verification
  - Witness verification
  - Attestation verification (with "not provided" state)
- Commitments display (metadata, input, output)
- Software identity tracking

### 5. Verification Center (Key Feature)
- Upload evidence receipts (file or paste JSON)
- Independent verification interface for reviewers
- Clear verification results:
  - ✓ All checks passed
  - ✗ Integrity failures with detailed explanations
- Dataset commitment mismatch detection
- Professional result reporting

### 6. Provenance Visualization
- Research lineage graph
- Visual flow from raw measurements to results
- Node types: experiment, measurement, dataset, processing, analysis, result
- Verification status per node
- Experiment selector

## Design Principles

The interface follows these principles to ensure credibility:

1. **Professional & Institutional**: Resembles government/university research systems
2. **Restrained Aesthetic**: No excessive animations, gradients, or "AI startup" styling
3. **Information-Dense**: Optimized for data display and evidence presentation
4. **Precise Language**: Technical accuracy over marketing language
5. **Clear Verification States**: Distinguished states (verified, failed, not_provided, not_checked)
6. **Monospace for Cryptographic Values**: Proper typography for hashes and identifiers

## Running the Application

### Development
```bash
npm run dev
```

The application will be available at `http://localhost:20128`

### Build
```bash
npm run build
```

### Production
```bash
npm run start
```

## Mock Data

The application currently uses realistic mock data that simulates:
- Research experiments from a National Institute of Advanced Materials
- Experiments like "Lithium-Ion Battery Thermal Cycling", "Polymer Tensile Strength Analysis"
- Proper scientific terminology and measurement units
- Realistic timestamps and sequencing
- Evidence records with cryptographic commitments

## API Integration

The service layer (`services/api.ts`) provides a clean abstraction for all data operations. To connect to a real backend:

1. Replace mock implementations in `services/api.ts`
2. Update function implementations to call your REST API
3. Ensure proper error handling
4. The TypeScript types in `types/index.ts` define the expected data structures

## Key Components

### Verification Status Display
All verification results properly distinguish between:
- **verified**: Green checkmark
- **failed**: Red X
- **not_provided**: Gray dash (not an error)
- **not_checked**: Gray alert

### Correction Workflow
Measurements support corrections that preserve history rather than silently overwriting values. The UI shows:
- Original measurement with evidence
- Correction with reason and new evidence
- Complete audit trail

### Integrity Alerts
The system displays meaningful integrity issues without being dramatic:
- Clear description of the issue
- Technical details (expected vs observed commitments)
- Recommendation for review

## Color System

- **Primary**: Deep navy/slate for main UI
- **Success**: Green for verified states
- **Warning**: Amber for review-required states
- **Error**: Red for integrity failures
- **Info**: Blue for navigation and links

## Typography

- **Primary Font**: Inter (professional sans-serif)
- **Monospace**: SF Mono, Monaco, Cascadia Code (for code/hashes)
- **Page Title**: 24-28px
- **Section Title**: 18-20px
- **Body**: 14-16px
- **Metadata**: 12-13px

## Next Steps

To complete the platform:

1. **Backend Integration**: Connect to CooL verifier and database
2. **Authentication**: Add user authentication and authorization
3. **Correction Modal**: Implement the measurement correction workflow UI
4. **File Upload**: Add actual dataset upload functionality
5. **Export Features**: Generate verification reports as PDFs
6. **Search**: Implement full-text search across experiments
7. **Reviewer Mode**: Create dedicated reviewer landing page
8. **Submission View**: Build research submission detail page
9. **Real Provenance**: Implement interactive provenance graph with zoom/pan
10. **Tests**: Add comprehensive test coverage

## License

MIT
