# PDF Merger — Per-page rotation & filename fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-page rotation to the PDF merger and fix the download filename so the user's typed name is honored.

**Architecture:** Single-file static HTML page. Add PDF.js (UMD build v3) for thumbnail rendering, keep pdf-lib for merge + rotation metadata. Replace the flat `File[]` list with file entries that carry rotation state and thumbnails. Loosen the filename sanitizer and add a live preview.

**Tech Stack:** Plain HTML/CSS/JS, pdf-lib 1.17.1 (already loaded), pdf.js 3.11.174 (new, UMD build).

**Target file:** `D:/Github/pmarmaroli.github.io/pdfMerger.html`

**Testing note:** This repo has no automated test framework — `pdfMerger.html` is a static page loaded directly in a browser. Each task's "verify" step is a manual browser check. Keep the browser open (e.g. `start pdfMerger.html` on Windows, or drag the file into a browser) and refresh after each change.

---

## Task 1: Fix filename sanitizer and add live filename preview

This ships the filename bug fix independently of the rotation work, so it's verifiable on its own.

**Files:**
- Modify: `pdfMerger.html` (CSS block, HTML body, script block)

- [ ] **Step 1: Add CSS for the filename preview**

Find the `.filename-input::placeholder` rule (around line 322) and add this rule right after it:

```css
.filename-preview {
    font-size: 12px;
    color: var(--text-secondary);
    margin: -6px 0 10px 4px;
    min-height: 16px;
}

.filename-preview strong {
    color: var(--primary-color);
    font-weight: 600;
}

.filename-input:disabled {
    background: var(--surface);
    color: var(--text-secondary);
    cursor: not-allowed;
}
```

- [ ] **Step 2: Move filename input out of download-section, make it always visible**

Find this block (around lines 460–463):

```html
<div class="download-section" id="downloadSection">
    <input type="text" id="filenameInput" class="filename-input" placeholder="Enter PDF name (optional)" />
    <button class="download-btn" id="downloadBtn">⬇️ Download PDF</button>
</div>
```

Replace with:

```html
<input type="text" id="filenameInput" class="filename-input" placeholder="Enter PDF name (optional)" disabled />
<div class="filename-preview" id="filenamePreview"></div>

<div class="download-section" id="downloadSection">
    <button class="download-btn" id="downloadBtn">⬇️ Download PDF</button>
</div>
```

Note: input moved above `.download-section`, a `filenamePreview` div added, and input starts `disabled` (enabled only after a successful merge).

- [ ] **Step 3: Add the filenamePreview element reference and preview function**

Find the `const filenameInput = document.getElementById('filenameInput');` line (around line 497) and add this line right after it:

```js
const filenamePreview = document.getElementById('filenamePreview');
```

Then, immediately before the `// Convert image to PDF with proper orientation` comment (around line 724), add this helper function:

```js
function computeFinalFilename(rawInput) {
    let filename = (rawInput || '').trim();
    // Strip only characters filesystems reject; keep spaces, parens, accents, etc.
    filename = filename.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
    if (!filename) {
        filename = `document_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    }
    if (!filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
    }
    return filename;
}

function updateFilenamePreview() {
    if (filenameInput.disabled) {
        filenamePreview.innerHTML = '';
        return;
    }
    const final = computeFinalFilename(filenameInput.value);
    filenamePreview.innerHTML = `Will be saved as: <strong>${final}</strong>`;
}

filenameInput.addEventListener('input', updateFilenamePreview);
```

- [ ] **Step 4: Replace the existing sanitizer in the download handler**

Find the download handler (around lines 840–871). Replace this chunk:

```js
// Get custom filename or use default
let filename = filenameInput.value.trim();
if (!filename) {
    filename = `document_${new Date().toISOString().slice(0,10).replace(/-/g, '')}`;
}
// Add .pdf extension if not present
if (!filename.toLowerCase().endsWith('.pdf')) {
    filename += '.pdf';
}

// Sanitize filename (remove invalid characters)
filename = filename.replace(/[^a-z0-9_\-\.]/gi, '_');
```

With:

```js
const filename = computeFinalFilename(filenameInput.value);
```

- [ ] **Step 5: Enable the input after a successful merge**

Find the success branch of the merge handler (around line 827) — the line `showStatus(`✅ Successfully processed ${selectedFiles.length} file(s)!`, 'success');`. Right after the existing `filenameInput.focus();` line, add:

```js
filenameInput.disabled = false;
updateFilenamePreview();
```

Then in the clear-all handler (around line 874), after `filenameInput.value = '';` add:

```js
filenameInput.disabled = true;
updateFilenamePreview();
```

And in the `handleFiles` function (around line 664), after `mergedPdfBytes = null;` add:

```js
filenameInput.disabled = true;
updateFilenamePreview();
```

This keeps the input disabled whenever there's no fresh merged output to download.

- [ ] **Step 6: Manual verification**

Open `pdfMerger.html` in a browser and verify each case:

- Load the page → filename input is visible but disabled, no preview text
- Merge 2 PDFs → input becomes enabled, preview shows `Will be saved as: document_YYYYMMDD.pdf`
- Type `My report (v2)` → preview updates live to `Will be saved as: My report (v2).pdf`
- Click Download → downloaded file is literally `My report (v2).pdf`
- Clear filename input, click Download → file is `document_YYYYMMDD.pdf`
- Type `///`, click Download → file is `document_YYYYMMDD.pdf` (falls back to default)
- Type `bilan: 2026/04` → preview shows `bilan_ 2026_04.pdf` (only `:` and `/` stripped)
- Click "Clear All" → input disables again, preview clears

- [ ] **Step 7: Commit**

```bash
cd D:/Github/pmarmaroli.github.io
git add pdfMerger.html
git commit -m "Fix PDF merger custom filename being ignored; add live filename preview"
```

---

## Task 2: Add PDF.js (UMD build) via CDN

**Files:**
- Modify: `pdfMerger.html` (one new `<script>` tag + one initialization line)

- [ ] **Step 1: Add the PDF.js script tag**

Find the existing pdf-lib script tag near the bottom (around line 472):

```html
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
```

Add this line immediately after it:

```html
<script src="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
```

- [ ] **Step 2: Configure the PDF.js worker**

Inside the `DOMContentLoaded` handler (around line 475), as the very first line after the opening `function()`, add:

```js
// Configure PDF.js worker (required for rendering)
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
```

- [ ] **Step 3: Manual verification**

Open `pdfMerger.html` in a browser, open DevTools console, and check:

- No `pdfjsLib is not defined` errors
- Typing `pdfjsLib.version` in the console returns `"3.11.174"`
- Existing functionality (drag & drop, file selection, merge, download) still works exactly as before

- [ ] **Step 4: Commit**

```bash
git add pdfMerger.html
git commit -m "Add PDF.js 3.11.174 for upcoming thumbnail rendering"
```

---

## Task 3: Refactor selectedFiles from File[] to file entries

This is a pure data-model refactor. Behavior should be identical after this task — it sets up the structure later tasks will hang rotation state on.

**Files:**
- Modify: `pdfMerger.html` (script block)

- [ ] **Step 1: Add a helper to build a file entry**

Immediately after the `let mergedPdfBytes = null;` line (around line 504), add:

```js
async function buildEntry(file) {
    const isPdf = file.type === 'application/pdf';
    let pageCount = 1;
    if (isPdf) {
        try {
            const { PDFDocument } = PDFLib;
            const bytes = await file.arrayBuffer();
            const doc = await PDFDocument.load(bytes);
            pageCount = doc.getPageCount();
        } catch (e) {
            console.warn('Could not read PDF page count for', file.name, e);
            pageCount = 1;
        }
    }
    return {
        file,
        type: isPdf ? 'pdf' : 'image',
        pageCount,
        rotations: new Array(pageCount).fill(0),
        thumbnails: new Array(pageCount).fill(null),
        expanded: false,
    };
}
```

- [ ] **Step 2: Convert handleFiles to build entries**

Replace the `handleFiles` function (around lines 654–666):

```js
function handleFiles(files) {
    if (files.length === 0) {
        showStatus('Please select PDF or image files.', 'error');
        return;
    }

    selectedFiles.push(...files);
    updateFileList();
    updateMergeButton();
    hideStatus();
    downloadSection.classList.remove('show');
    mergedPdfBytes = null;
}
```

With:

```js
async function handleFiles(files) {
    if (files.length === 0) {
        showStatus('Please select PDF or image files.', 'error');
        return;
    }

    for (const file of files) {
        const entry = await buildEntry(file);
        selectedFiles.push(entry);
    }
    updateFileList();
    updateMergeButton();
    hideStatus();
    downloadSection.classList.remove('show');
    mergedPdfBytes = null;
    filenameInput.disabled = true;
    updateFilenamePreview();
}
```

- [ ] **Step 3: Update updateFileList to read entries**

Replace the `updateFileList` function (around lines 668–698) with:

```js
function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((entry, index) => {
        const { file, type, pageCount, rotations } = entry;
        const rotatedCount = rotations.filter(r => r !== 0).length;
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        const icon = type === 'image' ? '🖼️' : '📄';
        const rotatedSuffix = rotatedCount > 0 ? ` · ${rotatedCount} rotated` : '';
        fileItem.innerHTML = `
            <div class="file-info">
                <span class="file-icon">${icon}</span>
                <span class="file-name" title="${file.name}">${file.name}</span>
                <span class="file-size">${pageCount} page${pageCount === 1 ? '' : 's'} · ${formatFileSize(file.size)}${rotatedSuffix}</span>
            </div>
            <button class="remove-btn" data-index="${index}">Remove</button>
        `;
        fileList.appendChild(fileItem);
    });

    const removeButtons = fileList.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const index = parseInt(this.getAttribute('data-index'));
            selectedFiles.splice(index, 1);
            updateFileList();
            updateMergeButton();
            downloadSection.classList.remove('show');
            mergedPdfBytes = null;
            filenameInput.disabled = true;
            updateFilenamePreview();
        });
    });
}
```

- [ ] **Step 4: Update the merge handler to read entries**

Find the merge loop inside the mergeBtn click handler (around lines 807–823). Replace:

```js
for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    showStatus(`Processing ${i + 1} of ${selectedFiles.length}: ${file.name}...`, 'loading');

    if (file.type === 'application/pdf') {
        // Handle PDF files
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    } else if (file.type.startsWith('image/')) {
        // Handle image files
        const imagePdf = await imageToPdf(file);
        const copiedPages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }
}
```

With:

```js
for (let i = 0; i < selectedFiles.length; i++) {
    const entry = selectedFiles[i];
    const file = entry.file;
    showStatus(`Processing ${i + 1} of ${selectedFiles.length}: ${file.name}...`, 'loading');

    if (entry.type === 'pdf') {
        const fileBytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    } else {
        const imagePdf = await imageToPdf(file);
        const copiedPages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
    }
}
```

(Rotation wiring comes in Task 7/8; this task just reads from the new entry shape.)

- [ ] **Step 5: Manual verification**

Reload `pdfMerger.html` and verify behavior is unchanged:

- Select 2 PDFs → file list shows both with `N pages · size` (no `rotated` suffix yet)
- Select an image → file list shows `1 page · size`
- Drag & drop works
- Remove button removes the row
- Merge works end-to-end, downloaded PDF has the right pages in the right order

- [ ] **Step 6: Commit**

```bash
git add pdfMerger.html
git commit -m "Refactor selectedFiles to carry per-page rotation state"
```

---

## Task 4: Add expand/collapse toggle on each file row

**Files:**
- Modify: `pdfMerger.html` (CSS + HTML markup inside updateFileList)

- [ ] **Step 1: Add CSS for the toggle and the page strip container**

Find the `.file-item` rule (around line 140) and add these rules after its `:hover` rule (around line 156):

```css
.file-item-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
}

.toggle-btn {
    background: transparent;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    font-size: 14px;
    padding: 0 8px;
    margin-right: 4px;
    transition: transform 0.2s ease;
    user-select: none;
}

.toggle-btn.expanded {
    transform: rotate(90deg);
}

.page-strip {
    display: none;
    margin-top: 12px;
    padding: 12px;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow-x: auto;
    white-space: nowrap;
}

.page-strip.show {
    display: block;
}

.page-strip-empty {
    color: var(--text-secondary);
    font-size: 13px;
    padding: 20px;
    text-align: center;
}
```

Also update the `.file-item` rule itself to be column-oriented so the strip sits below the header:

Replace:

```css
.file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 15px;
    background: var(--surface);
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
    border: 1px solid var(--border);
}
```

With:

```css
.file-item {
    display: flex;
    flex-direction: column;
    padding: 12px 15px;
    background: var(--surface);
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
    border: 1px solid var(--border);
}
```

- [ ] **Step 2: Update updateFileList to render the toggle and strip**

Replace the `updateFileList` function body (the full function from Task 3 step 3) with:

```js
function updateFileList() {
    fileList.innerHTML = '';
    selectedFiles.forEach((entry, index) => {
        const { file, type, pageCount, rotations, expanded } = entry;
        const rotatedCount = rotations.filter(r => r !== 0).length;
        const icon = type === 'image' ? '🖼️' : '📄';
        const rotatedSuffix = rotatedCount > 0 ? ` · ${rotatedCount} rotated` : '';

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-item-row">
                <div class="file-info">
                    <button class="toggle-btn ${expanded ? 'expanded' : ''}" data-toggle-index="${index}" aria-label="Toggle pages">▸</button>
                    <span class="file-icon">${icon}</span>
                    <span class="file-name" title="${file.name}">${file.name}</span>
                    <span class="file-size">${pageCount} page${pageCount === 1 ? '' : 's'} · ${formatFileSize(file.size)}${rotatedSuffix}</span>
                </div>
                <button class="remove-btn" data-index="${index}">Remove</button>
            </div>
            <div class="page-strip ${expanded ? 'show' : ''}" data-strip-index="${index}">
                <div class="page-strip-empty">Loading thumbnails…</div>
            </div>
        `;
        fileList.appendChild(fileItem);
    });

    fileList.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const index = parseInt(this.getAttribute('data-index'));
            selectedFiles.splice(index, 1);
            updateFileList();
            updateMergeButton();
            downloadSection.classList.remove('show');
            mergedPdfBytes = null;
            filenameInput.disabled = true;
            updateFilenamePreview();
        });
    });

    fileList.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const index = parseInt(this.getAttribute('data-toggle-index'));
            selectedFiles[index].expanded = !selectedFiles[index].expanded;
            updateFileList();
            if (selectedFiles[index].expanded) {
                renderStrip(index);
            }
        });
    });
}

function renderStrip(index) {
    // Placeholder — real rendering comes in Task 5.
    const strip = fileList.querySelector(`.page-strip[data-strip-index="${index}"]`);
    if (!strip) return;
    strip.innerHTML = `<div class="page-strip-empty">Thumbnails coming in next task (${selectedFiles[index].pageCount} pages).</div>`;
}
```

- [ ] **Step 3: Manual verification**

Reload `pdfMerger.html`:

- Add a PDF → each row now shows a `▸` toggle before the icon
- Click the toggle → row expands, the arrow rotates, and a placeholder strip appears below showing `Thumbnails coming in next task (N pages).`
- Click again → collapses
- Expand state persists when you add more files (other rows keep their state on re-render)
- Remove button still works

- [ ] **Step 4: Commit**

```bash
git add pdfMerger.html
git commit -m "Add expand/collapse toggle and page-strip container to file list"
```

---

## Task 5: Render page thumbnails via PDF.js on expand

**Files:**
- Modify: `pdfMerger.html` (CSS + JS `renderStrip` and helpers)

- [ ] **Step 1: Add CSS for thumbnails**

Add these rules after the `.page-strip-empty` rule from Task 4:

```css
.thumb {
    display: inline-block;
    position: relative;
    width: 120px;
    margin-right: 10px;
    vertical-align: top;
    text-align: center;
}

.thumb-frame {
    width: 120px;
    height: 150px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.thumb-frame img {
    max-width: 100%;
    max-height: 100%;
    transition: transform 0.2s ease;
}

.thumb-label {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
}

.thumb-rotate {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(30, 58, 138, 0.85);
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    font-size: 14px;
    line-height: 28px;
    padding: 0;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.thumb:hover .thumb-rotate {
    opacity: 1;
}

@media (pointer: coarse) {
    .thumb-rotate { opacity: 1; }
}

.thumb-badge {
    position: absolute;
    top: 4px;
    left: 4px;
    background: var(--accent-warm);
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    display: none;
}

.thumb-badge.show { display: inline-block; }
```

- [ ] **Step 2: Add thumbnail rendering helpers**

Immediately before the existing `function renderStrip(index)` from Task 4, add:

```js
async function renderPdfThumbnail(file, pageIndex) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(pageIndex + 1); // pdf.js is 1-indexed
    const viewport = page.getViewport({ scale: 1 });
    const targetWidth = 200;
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.7);
}

async function renderImageThumbnail(file) {
    const bitmap = await createImageBitmap(file);
    const targetWidth = 200;
    const scale = Math.min(1, targetWidth / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
}

async function ensureThumbnails(entry) {
    if (entry.type === 'image') {
        if (!entry.thumbnails[0]) {
            entry.thumbnails[0] = await renderImageThumbnail(entry.file);
        }
        return;
    }
    // PDF — render any missing thumbnails sequentially, yielding to the UI between pages.
    for (let i = 0; i < entry.pageCount; i++) {
        if (entry.thumbnails[i]) continue;
        entry.thumbnails[i] = await renderPdfThumbnail(entry.file, i);
        await new Promise(r => requestAnimationFrame(r));
    }
}
```

- [ ] **Step 3: Replace the placeholder renderStrip**

Replace the `renderStrip` function body (from Task 4 step 2):

```js
function renderStrip(index) {
    // Placeholder — real rendering comes in Task 5.
    const strip = fileList.querySelector(`.page-strip[data-strip-index="${index}"]`);
    if (!strip) return;
    strip.innerHTML = `<div class="page-strip-empty">Thumbnails coming in next task (${selectedFiles[index].pageCount} pages).</div>`;
}
```

With:

```js
async function renderStrip(index) {
    const strip = fileList.querySelector(`.page-strip[data-strip-index="${index}"]`);
    if (!strip) return;
    const entry = selectedFiles[index];

    // Render existing thumbnails (possibly all placeholders on first call)
    drawStripContents(strip, entry, index);

    try {
        await ensureThumbnails(entry);
        drawStripContents(strip, entry, index);
    } catch (err) {
        console.error('Thumbnail render failed:', err);
        strip.innerHTML = `<div class="page-strip-empty">Could not render thumbnails: ${err.message}</div>`;
    }
}

function drawStripContents(strip, entry, fileIndex) {
    const thumbs = entry.thumbnails.map((src, pageIndex) => {
        const rot = entry.rotations[pageIndex] || 0;
        const imgHtml = src
            ? `<img src="${src}" style="transform: rotate(${rot}deg);">`
            : `<span style="font-size:11px;color:var(--text-secondary);">Loading…</span>`;
        const badgeClass = rot !== 0 ? 'thumb-badge show' : 'thumb-badge';
        return `
            <div class="thumb" data-file="${fileIndex}" data-page="${pageIndex}">
                <div class="thumb-frame">${imgHtml}</div>
                <div class="thumb-label">Page ${pageIndex + 1}</div>
                <span class="${badgeClass}">${rot}°</span>
                <button class="thumb-rotate" data-rotate-file="${fileIndex}" data-rotate-page="${pageIndex}" title="Rotate 90°">↻</button>
            </div>
        `;
    }).join('');
    strip.innerHTML = thumbs || '<div class="page-strip-empty">No pages.</div>';

    // Rotate buttons get wired up in Task 6.
}
```

- [ ] **Step 4: Manual verification**

Reload `pdfMerger.html`:

- Add a PDF, expand its row → thumbnails render for every page (may take a moment for large PDFs), each with a "Page N" label
- While rendering, in-flight pages show "Loading…"
- Add an image, expand its row → single thumbnail renders
- Console shows no errors
- Collapse and re-expand → thumbnails display instantly (cached in `entry.thumbnails`)
- Hover over a thumbnail (desktop) → `↻` button appears in top-right corner (no action yet — Task 6)

- [ ] **Step 5: Commit**

```bash
git add pdfMerger.html
git commit -m "Render per-page thumbnails via PDF.js in the expanded strip"
```

---

## Task 6: Wire up the per-page rotate button

**Files:**
- Modify: `pdfMerger.html` (extend `drawStripContents` with click handler)

- [ ] **Step 1: Add the rotate click handler**

In the `drawStripContents` function (from Task 5 step 3), replace the last line:

```js
// Rotate buttons get wired up in Task 6.
```

With:

```js
strip.querySelectorAll('.thumb-rotate').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const f = parseInt(this.getAttribute('data-rotate-file'));
        const p = parseInt(this.getAttribute('data-rotate-page'));
        const entry = selectedFiles[f];
        entry.rotations[p] = (entry.rotations[p] + 90) % 360;

        // Update only the affected thumb's transform + badge, without re-rendering thumbnails
        const thumbEl = strip.querySelector(`.thumb[data-file="${f}"][data-page="${p}"]`);
        const img = thumbEl && thumbEl.querySelector('img');
        const badge = thumbEl && thumbEl.querySelector('.thumb-badge');
        if (img) img.style.transform = `rotate(${entry.rotations[p]}deg)`;
        if (badge) {
            badge.textContent = `${entry.rotations[p]}°`;
            badge.classList.toggle('show', entry.rotations[p] !== 0);
        }

        // Refresh the file row header to update "N rotated" count
        updateFileRowHeader(f);
    });
});
```

- [ ] **Step 2: Add updateFileRowHeader helper**

Immediately after the `drawStripContents` function, add:

```js
function updateFileRowHeader(index) {
    const entry = selectedFiles[index];
    const rotatedCount = entry.rotations.filter(r => r !== 0).length;
    const rotatedSuffix = rotatedCount > 0 ? ` · ${rotatedCount} rotated` : '';
    const sizeEl = fileList.querySelector(
        `.file-item:nth-child(${index + 1}) .file-size`
    );
    if (sizeEl) {
        sizeEl.textContent = `${entry.pageCount} page${entry.pageCount === 1 ? '' : 's'} · ${formatFileSize(entry.file.size)}${rotatedSuffix}`;
    }
}
```

- [ ] **Step 3: Manual verification**

Reload `pdfMerger.html`:

- Add a PDF, expand → click the `↻` button on page 2
- Thumbnail for page 2 rotates 90° visually; a `90°` badge appears in the top-left
- Row header now reads `N pages · size · 1 rotated`
- Click again → 180°, badge updates, count stays at 1
- Click twice more → back to 0°, badge disappears, header drops the `· rotated` suffix
- Rotate multiple pages → row header shows the correct count
- Rotate a page, collapse, re-expand → rotation is preserved (both visually and in badge)
- Click Remove on that file → rotation state disappears with it

- [ ] **Step 4: Commit**

```bash
git add pdfMerger.html
git commit -m "Wire per-page rotate button to update rotation state and UI"
```

---

## Task 7: Apply PDF page rotations during merge

**Files:**
- Modify: `pdfMerger.html` (merge handler inside mergeBtn click)

- [ ] **Step 1: Rotate copied pages using pdf-lib**

In the merge handler (modified in Task 3 step 4), update the PDF branch. Replace:

```js
if (entry.type === 'pdf') {
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
}
```

With:

```js
if (entry.type === 'pdf') {
    const fileBytes = await file.arrayBuffer();
    const pdf = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page, pageIndex) => {
        const userRotation = entry.rotations[pageIndex] || 0;
        if (userRotation !== 0) {
            const existing = page.getRotation().angle || 0;
            const composed = (existing + userRotation) % 360;
            page.setRotation(PDFLib.degrees(composed));
        }
        mergedPdf.addPage(page);
    });
}
```

- [ ] **Step 2: Manual verification (PDF rotation)**

Reload `pdfMerger.html` and verify:

- Merge a 3-page PDF with no rotations → output matches source page-for-page
- Rotate page 2 by 90°, merge → in the downloaded PDF, only page 2 is rotated 90°; pages 1 and 3 untouched
- Rotate page 2 by 180° (click twice), merge → page 2 upside-down in output
- Rotate page 2 by 270° (click three times), merge → page 2 rotated -90° in output
- Take a PDF that already has rotated pages (e.g. a landscape scan saved with rotation metadata), apply an additional 90°, merge → page appears at (existing + 90°) mod 360
- Merge two PDFs, rotate one page in each → both show correct rotation in the merged output

- [ ] **Step 3: Commit**

```bash
git add pdfMerger.html
git commit -m "Apply per-page rotation to copied PDF pages during merge"
```

---

## Task 8: Apply rotations to images during merge

**Files:**
- Modify: `pdfMerger.html` (`imageToPdf` function signature + body)

- [ ] **Step 1: Change imageToPdf to accept a rotation argument**

Replace the existing `imageToPdf` function (around lines 725–790):

```js
async function imageToPdf(imageFile) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    // Try with 'from-image' first (respects EXIF)
    let bitmap;
    try {
        bitmap = await createImageBitmap(imageFile, {
            imageOrientation: 'from-image'
        });
        debugLog(`✓ EXIF orientation supported`);
    } catch (e) {
        // Fallback without options if not supported
        debugLog(`⚠ EXIF not supported, using default`);
        bitmap = await createImageBitmap(imageFile);
    }

    debugLog(`📷 ${imageFile.name}`);
    debugLog(`   Bitmap: ${bitmap.width}x${bitmap.height}`);

    // Create canvas with the bitmap's dimensions
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);

    // Convert canvas to JPEG
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    const convertedBytes = await blob.arrayBuffer();
    const image = await pdfDoc.embedJpg(convertedBytes);

    debugLog(`   Embedded: ${image.width}x${image.height}`);

    // Determine page size based on actual image dimensions
    let pageWidth = image.width;
    let pageHeight = image.height;

    // A4 dimensions in points: 595 x 842 (portrait)
    const A4_PORTRAIT_WIDTH = 595;
    const A4_PORTRAIT_HEIGHT = 842;
    const MAX_DIMENSION = 2000; // Reasonable max for PDF

    // Scale down if image is too large, maintaining aspect ratio
    if (image.width > MAX_DIMENSION || image.height > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / image.width, MAX_DIMENSION / image.height);
        pageWidth = image.width * scale;
        pageHeight = image.height * scale;
    }

    const orientation = pageHeight > pageWidth ? 'PORTRAIT' : 'LANDSCAPE';
    debugLog(`   PDF page: ${Math.round(pageWidth)}x${Math.round(pageHeight)} (${orientation})`);
    debugLog('');

    // Create page and draw image
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
    });

    return pdfDoc;
}
```

With:

```js
async function imageToPdf(imageFile, rotation = 0) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();

    let bitmap;
    try {
        bitmap = await createImageBitmap(imageFile, { imageOrientation: 'from-image' });
        debugLog(`✓ EXIF orientation supported`);
    } catch (e) {
        debugLog(`⚠ EXIF not supported, using default`);
        bitmap = await createImageBitmap(imageFile);
    }

    debugLog(`📷 ${imageFile.name} (rotation ${rotation}°)`);
    debugLog(`   Bitmap: ${bitmap.width}x${bitmap.height}`);

    // Draw the bitmap onto a canvas rotated by `rotation` degrees.
    // For 90/270 we swap canvas dimensions so the visible output matches.
    const swap = rotation === 90 || rotation === 270;
    const canvasWidth = swap ? bitmap.height : bitmap.width;
    const canvasHeight = swap ? bitmap.width : bitmap.height;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    const convertedBytes = await blob.arrayBuffer();
    const image = await pdfDoc.embedJpg(convertedBytes);

    debugLog(`   Embedded: ${image.width}x${image.height}`);

    let pageWidth = image.width;
    let pageHeight = image.height;
    const MAX_DIMENSION = 2000;
    if (image.width > MAX_DIMENSION || image.height > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / image.width, MAX_DIMENSION / image.height);
        pageWidth = image.width * scale;
        pageHeight = image.height * scale;
    }

    const orientation = pageHeight > pageWidth ? 'PORTRAIT' : 'LANDSCAPE';
    debugLog(`   PDF page: ${Math.round(pageWidth)}x${Math.round(pageHeight)} (${orientation})`);
    debugLog('');

    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });

    return pdfDoc;
}
```

- [ ] **Step 2: Pass the rotation from the merge handler**

In the merge handler, update the image branch:

Replace:

```js
} else {
    const imagePdf = await imageToPdf(file);
    const copiedPages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
}
```

With:

```js
} else {
    const rotation = entry.rotations[0] || 0;
    const imagePdf = await imageToPdf(file, rotation);
    const copiedPages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
}
```

- [ ] **Step 3: Manual verification (image rotation)**

Reload `pdfMerger.html` and verify:

- Add a landscape JPG with no rotation → merges as today (no regression)
- Rotate the image 90°, merge → output page is portrait, image shown rotated 90° clockwise
- Rotate 180°, merge → output image upside-down, orientation unchanged
- Rotate 270°, merge → output page is portrait, image rotated 90° counter-clockwise
- Mix: one image (rotated 90°) + one 3-page PDF (page 2 rotated 180°) → both rotations applied correctly in the single merged PDF

- [ ] **Step 4: Commit**

```bash
git add pdfMerger.html
git commit -m "Apply rotation to images during merge via canvas transform"
```

---

## Task 9: Final end-to-end QA + fixes

No code in this task by default — it's the manual sweep of the full checklist from the spec. If any item fails, fix inline and re-commit before closing the plan.

- [ ] **Step 1: Run the full QA checklist**

Open `pdfMerger.html` fresh (hard reload to bypass cache) and go through each case:

- Merge 2 PDFs, no rotation → output matches current behavior
- Rotate page 2 of a 3-page PDF by 90° → only page 2 is rotated in the output
- Rotate an image by 180° → output page shows image upside-down, correct aspect ratio
- Rotate a page of a PDF that's already rotated (scanned landscape) → rotations compose
- Type filename `My report (v2)` → downloaded file is `My report (v2).pdf`
- Type filename with only special chars (`///`) → falls back to default, no crash
- Leave filename empty → default `document_YYYYMMDD.pdf`
- Expand a PDF with ~50 pages → thumbnails render without freezing the UI for more than a beat
- Mobile (iOS Safari, if available) → rotate buttons visible & tappable; merge & download work
- Existing workflow unregressed: drag & drop, camera capture, clear all, remove single file

- [ ] **Step 2: Fix any failures**

For each failing case, fix the underlying issue in `pdfMerger.html`, re-run the affected case to confirm, then commit with a targeted message such as `Fix thumbnail freeze on PDFs over N pages`.

- [ ] **Step 3: Final commit if no fixes were needed**

```bash
git status   # expect clean
```

If clean, nothing to commit. Otherwise commit any stragglers with a descriptive message.
