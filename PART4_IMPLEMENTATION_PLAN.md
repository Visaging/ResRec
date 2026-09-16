# Part 4 Mobile Optimization - Implementation Plan

## Scope Confirmation

### Pages to Optimize:
1. **Provenance** (`app/provenance/page.tsx`)
2. **Datasets** (`app/datasets/page.tsx`)
3. **Analysis** - NOT FOUND as separate page (may be integrated in experiments or doesn't exist)

### Pages NOT to Touch (Already optimized or out of scope):
- Dashboard (Part 2)
- Experiments (Part 2)
- Experiment Detail (Part 2)
- Evidence Registry (Part 3)
- Verification Center (Part 3)
- Submissions, Reports, Login

---

## Part 4.1: Provenance Page Mobile Optimization

### Current Desktop Layout:
```
┌─────────────────────────────────────────────────────┐
│ Page Header + Experiment Selector                   │
├─────────────────────────────────────────────────────┤
│ Filter Pills + Search Box                           │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│  SVG Graph Canvas (lg:col-2) │ Node Inspector       │
│  1040px height fixed         │ (lg:col-1)           │
│  Pan/Zoom controls           │                      │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│ Statistics Cards (4 cols on md+, 2 on mobile)       │
└─────────────────────────────────────────────────────┘
```

### Mobile Issues:
1. Graph height 1040px - exceeds mobile viewport
2. SVG viewBox not responsive
3. Pan/zoom only works with mouse (needs touch)
4. Right column (Node Inspector) needs to stack below
5. Filter pills may wrap awkwardly
6. Search box fixed width

### Mobile Solution:

#### 1. Graph Container Responsive Sizing
- Desktop: Fixed 1040px height
- Tablet (md+): 700px or calc(100vh - 300px)
- Mobile (sm:): 400px or 50vh whichever fits
- Use CSS max-height to prevent overflow
- Expanded mode: fullscreen on mobile

#### 2. Touch Support for Pan/Zoom
- Existing mouse events already work
- Touch events: implement touch-drag for pan
- Touch-pinch for zoom (if supported)
- Preserve existing mouse behavior

#### 3. Layout Stacking
- Mobile: `grid-cols-1` (graph full width, inspector below)
- `lg:grid-cols-3`: keep existing for desktop
- Ensure no awkward spacing

#### 4. Filter/Search Bar
- Responsive layout already exists: flex-wrap
- Search box: `w-64` → `w-full sm:w-64`
- Filter pills: wrap naturally (already working)

#### 5. Statistics Cards
- Already responsive: `grid-cols-2 md:grid-cols-4`
- Good as-is

### Implementation Changes:

**File:** `app/provenance/page.tsx`

1. Update SVG container height (line 797):
   - Current: `h-[1040px]`
   - New: `h-[400px] sm:h-[500px] md:h-[650px] lg:h-[1040px]`

2. Update search box width (line 702):
   - Current: `w-64`
   - New: `w-full sm:w-64`

3. Add touch support for pan/zoom (lines 475-497):
   - Add touch event handlers
   - Detect touch drag for pan
   - Preserve mouse behavior

4. Main grid already responsive (line 729)
   - Current: `grid-cols-1 lg:grid-cols-3`
   - Keep as-is

---

## Part 4.2: Datasets Page Mobile Optimization

### Current Desktop Layout:
```
┌────────────────────────────────────────────┐
│ Page Header + Actions                      │
├────────────────────────────────────────────┤
│ Filter Bar (12-col grid)                   │
├────────────────────────────────────────────┤
│ Results Summary                            │
├────────────────────────────────────────────┤
│ Table (8 columns)                          │
│ Overflow: auto, horizontal scroll          │
└────────────────────────────────────────────┘
```

### Mobile Issues:
1. Filter grid uses `grid-cols-12` - doesn't stack well on mobile
2. Table has 8 columns - unreadable at 320px
3. Needs card layout for mobile
4. Actions buttons in page header may wrap

### Mobile Solution:

#### 1. Filter Bar Responsive
- Mobile: Full width, stack each filter
  - Search: full width
  - Status: full width
  - Experiment: full width
  - Sort: full width
- `sm:`: 2-column layout
- `md:`: responsive grid
- `lg:`: existing 12-column grid

#### 2. Dataset List - Dual Layout
- Desktop (hidden sm:block): Existing table
- Mobile (sm:hidden): Card layout
  - Card shows: filename, experiment, version, status
  - Expandable for more details (record count, size, timestamp)
  - Actions accessible via card

#### 3. Card Layout Design
```
┌─────────────────────────┐
│ filename              │
│ experiment ID         │
├─────────────────────────┤
│ Version: v2           │
│ Status: Verified ✓    │
├─────────────────────────┤
│ Records: 48           │
│ Size: 15.4 KB         │
│ Updated: 2d ago       │
├─────────────────────────┤
│ [Download Metadata]   │
└─────────────────────────┘
```

#### 4. Empty State & Results Summary
- Results summary: responsive text sizing
- Empty state: centered, fits viewport

### Implementation Changes:

**File:** `app/datasets/page.tsx`

1. Update Filter Bar (lines 239-296):
   - Change `grid-cols-12` to responsive
   - Mobile: `flex flex-col gap-3`
   - `sm:`: `grid grid-cols-2 gap-3`
   - `lg:`: existing `grid grid-cols-12 gap-4`

2. Add Mobile Card Layout (after line 381):
   - Desktop table: wrap in `hidden sm:block`
   - Mobile cards: add `sm:hidden` section
   - Use motion for animations

3. Card Component Structure:
   - Header: filename + experiment
   - Status badge
   - Metadata grid
   - Download button

4. Page Header Actions:
   - May need to wrap on mobile
   - Buttons already have responsive sizing

---

## Part 4.3: Analysis Page

### Status: NOT FOUND

Analysis functionality may be:
1. Integrated into Experiment Detail (already optimized in Part 2)
2. Not yet implemented
3. Part of a different module

**Action:** Skip for now, can be addressed in Part 5 if it exists.

---

## Mobile Testing Strategy

### Viewport Widths to Test:
- 320px (iPhone SE)
- 360px (Android common)
- 375px (iPhone 12 mini)
- 390px (iPhone 15 Pro)
- 412px (Samsung S24)
- 430px (iPhone 15 Pro Max)
- 640px (sm: breakpoint)
- 768px (md: breakpoint)
- 1024px (lg: breakpoint)
- 1280px+ (xl: desktop)

### Key Test Cases:

**Provenance:**
- [ ] Graph fits viewport at 320px
- [ ] Graph height responsive (400px → 1040px)
- [ ] Pan/zoom works on mobile
- [ ] Touch drag works
- [ ] Node selection works
- [ ] Node inspector details readable
- [ ] No page-level horizontal scroll
- [ ] Statistics cards responsive
- [ ] Filters & search responsive

**Datasets:**
- [ ] Filter bar stacks on mobile
- [ ] Card layout visible on mobile
- [ ] Card expandable (if implemented)
- [ ] Table preserved on desktop
- [ ] Download action works
- [ ] Results summary responsive
- [ ] Empty state centered
- [ ] No page-level horizontal scroll
- [ ] Modals work on mobile

### Desktop Regression:
- [ ] Provenance graph height 1040px
- [ ] Graph interaction unchanged
- [ ] Dataset table layout unchanged
- [ ] All functionality preserved

---

## Implementation Order

1. **Provenance Page:**
   - Add responsive graph height
   - Add touch support
   - Update search box width
   - Test responsiveness

2. **Datasets Page:**
   - Update filter bar layout
   - Add mobile card layout
   - Update table wrapper
   - Test responsiveness

3. **Build & Verify:**
   - `npm run build`
   - `npm run lint`
   - Test across viewports
   - Verify desktop regression

---

## Notes

- Provenance graph is SVG - inherently responsive if container is
- Touch support can reuse existing pan/zoom logic
- Datasets table will use hidden/visible strategy like other pages
- No new components needed (reuse existing Card, etc.)
- Preserve all functionality
- Desktop-first in CSS (media queries for mobile only)
