# PDF Merger — Per-page rotation & filename fix

**Date:** 2026-04-17
**Scope:** `pdfMerger.html` (single-file static page)

## Goals

1. Let the user rotate **any individual page** of any uploaded PDF (and images) before merging.
2. Fix the download filename: the custom name typed by the user is currently not honored in the output file.

## Non-goals

- Page reordering (drag to reorder pages across files)
- Deleting individual pages from a source PDF
- Reordering the file list itself
- Dark mode or broader visual redesign
- Refactoring the debug panel or cleaning up duplicate `<meta>` / `<link>` tags

## Dependencies

Add **PDF.js** via CDN (same pattern already used for pdf-lib) to render page thumbnails in the browser. pdf-lib continues to handle the actual merge and writes rotation into the output PDF metadata.

```html
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="https://unpkg.com/pdfjs-dist@4/build/pdf.min.mjs" type="module"></script>
```

(Exact PDF.js version and worker setup to be pinned during implementation.)

## Data model

Replace the current `selectedFiles: File[]` with an array of file **entries**:

```js
{
  file: File,              // original File object
  type: 'pdf' | 'image',
  pageCount: number,       // 1 for images, N for PDFs
  rotations: number[],     // length === pageCount, values ∈ {0, 90, 180, 270}
  thumbnails: string[],    // data URLs, lazy-rendered on first expand
  expanded: boolean        // is the page strip currently open?
}
```

Rotation state is stored per `(fileIndex, pageIndex)`. Removing a file drops its rotation state cleanly; no global page index to keep in sync.

## UI changes

### File list row

Each row gains a `▸` toggle button. Header shows a compact summary:

```
▸ 📄 report.pdf · 12 pages · 2 rotated       [Remove]
```

### Expanded page strip

When a row is expanded, a horizontal scrollable strip of thumbnails appears below:

- Each thumbnail is ~120px wide, rendered by PDF.js
- Current rotation shown visually via CSS `transform: rotate(...)`
- `↻` rotate button on each thumbnail (always visible on mobile, hover-reveal on desktop) — cycles `0 → 90 → 180 → 270 → 0`
- Small badge (`90°` / `180°` / `270°`) when non-zero

Thumbnails are rendered lazily on first expand (not on upload) to keep initial load fast for large PDFs.

Images get the same treatment — one thumbnail, same rotate control — so the UI is uniform.

### Filename input

Currently lives inside `.download-section` and only appears after a successful merge. Change:

- Move the input **out** of the download section. Render it always, disabled before merge, enabled after.
- Add a live filename preview below the input, updating on every keystroke:
  > Will be saved as: **`My report (v2).pdf`**
- The preview uses the same sanitization / default-fallback logic the download handler uses, so what you see is exactly what you'll get.

## Merge logic

### PDFs

After `mergedPdf.copyPages(...)`, iterate the copied pages. For any page with a non-zero user rotation, call:

```js
page.setRotation(degrees(existingRotation + userRotation))
```

using pdf-lib's `degrees()` helper. This adds the user rotation to whatever rotation the page already had in the source PDF (some scanned PDFs ship with rotation metadata). The rotation is written to the output PDF metadata — no pixel re-rendering, lossless, fast.

### Images

Rotation is applied at canvas draw time in `imageToPdf`:

- Rotate the canvas context before drawing the bitmap
- For 90° / 270°, swap the canvas width/height so the resulting PDF page matches the rotated orientation
- The JPEG re-encode step is unchanged

### Output order

Output page order matches the file list order (unchanged from today).

## Filename sanitization

Replace the current aggressive sanitizer at line 854:

```js
// Old — strips everything except a-z, 0-9, _, -, .
filename = filename.replace(/[^a-z0-9_\-\.]/gi, '_');
```

With one that only strips characters filesystems reject:

```js
filename = filename
  .replace(/[\/\\:*?"<>|]/g, '_')  // characters invalid on Windows/macOS/Linux
  .replace(/\s+/g, ' ')            // collapse whitespace
  .trim();
```

If the result is empty (e.g. user typed only special chars), fall through to the default `document_YYYYMMDD.pdf`.

## Testing (manual)

This repo has no automated tests — it's a static site. Manual checklist for implementation:

- Merge 2 PDFs with no rotation → output matches current behavior
- Rotate page 2 of a 3-page PDF by 90° → only page 2 is rotated in the output
- Rotate an image by 180° → output page shows image upside-down, aspect ratio correct
- Rotate a page of a PDF that's *already* rotated (scanned landscape) → rotations compose correctly
- Type filename `My report (v2)` → downloaded file is `My report (v2).pdf`
- Type filename with only special chars (`///`) → falls back to `document_YYYYMMDD.pdf`, no crash
- Leave filename empty → default `document_YYYYMMDD.pdf`
- Expand a 50-page PDF → thumbnails render without freezing the UI
- Mobile (iOS Safari) → rotation buttons usable on touch
- Existing workflow still works (drag & drop, camera capture, clear all, remove single file)

## Risks

- **PDF.js bundle size** — adds ~1 MB to the page. Acceptable for this use case; static site, loaded on demand.
- **Large PDFs** — rendering 100+ thumbnails could jank. Mitigation: lazy render on expand, render page-by-page with `requestAnimationFrame` yielding.
- **Existing PDF rotation metadata** — must be composed (added), not replaced, or some scanned PDFs will come out sideways.
