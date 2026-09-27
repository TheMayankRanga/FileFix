"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { acceptedImages, formatLabel, imagePresets } from "@/constants/presets";
import { downloadBlob, formatBytes, inspectImage, processImage } from "@/lib/image-processing";
import type { FitMode, ImageFormat, ProcessedImage, ToolMode } from "@/types/filefix";

const modes: { id: ToolMode; label: string }[] = [
  { id: "fit", label: "Make it fit" },
  { id: "compress", label: "Compress" },
  { id: "resize", label: "Resize" },
  { id: "image-to-pdf", label: "Images to PDF" },
  { id: "pdf-to-image", label: "PDF to images" },
];

const extensions: Record<ImageFormat, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getError(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong while processing this file. Please try again.";
}

export function ToolWorkspace({ initialMode, fitFirst = false }: { initialMode: ToolMode; fitFirst?: boolean }) {
  const [mode, setMode] = useState(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [result, setResult] = useState<ProcessedImage | null>(null);
  const [resultUrl, setResultUrl] = useState("");
  const [targetSize, setTargetSize] = useState(initialMode === "resize" || fitFirst ? "" : "50");
  const [sizeUnit, setSizeUnit] = useState<"KB" | "MB">("KB");
  const [width, setWidth] = useState(fitFirst ? "" : "200");
  const [height, setHeight] = useState(fitFirst ? "" : "230");
  const [keepRatio, setKeepRatio] = useState(false);
  const [format, setFormat] = useState<ImageFormat | "">(fitFirst ? "" : "image/jpeg");
  const [fitMode, setFitMode] = useState<FitMode>("stretch");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pageSize, setPageSize] = useState<"a4" | "image">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margin, setMargin] = useState("12");
  const [pageSelection, setPageSelection] = useState("all");
  const [pageRange, setPageRange] = useState("");
  const [pdfFormat, setPdfFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [pdfImages, setPdfImages] = useState<{ blob: Blob; name: string }[]>([]);
  const [pdfImageUrls, setPdfImageUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const cancelRequested = useRef(false);
  const draggedFileIndex = useRef<number | null>(null);

  function wasCancelled(error: unknown) {
    return cancelRequested.current || (error instanceof Error && error.message === "PROCESSING_CANCELLED");
  }

  useEffect(() => {
    if (!file || mode === "pdf-to-image") { setPreviewUrl(""); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, mode]);

  useEffect(() => {
    if (!result) { setResultUrl(""); return; }
    const url = URL.createObjectURL(result.blob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  useEffect(() => {
    const urls = pdfImages.map((image) => URL.createObjectURL(image.blob));
    setPdfImageUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [pdfImages]);

  const isPdf = mode === "pdf-to-image";
  const isPdfBuilder = mode === "image-to-pdf";
  const isImageMode = !isPdf && !isPdfBuilder;

  function resetResult() {
    setResult(null);
    setPdfImages([]);
    setNotice("");
    setError("");
  }

  async function addImage(nextFile: File) {
    resetResult();
    setError("");
    try {
      const measured = await inspectImage(nextFile);
      if (isPdfBuilder) {
        setFiles((current) => [...current, nextFile]);
      } else {
        setFile(nextFile);
        setDimensions(measured);
        setWidth(String(measured.width));
        setHeight(String(measured.height));
      }
    } catch (caught) {
      setError(getError(caught));
    }
  }

  async function addImages(imageFiles: File[]) {
    if (files.length + imageFiles.length > 20) {
      setError("Add up to 20 images to one PDF.");
      return;
    }
    if (files.reduce((total, item) => total + item.size, 0) + imageFiles.reduce((total, item) => total + item.size, 0) > 100 * 1024 * 1024) {
      setError("These images are too large to combine in one browser session. Keep the total under 100 MB.");
      return;
    }
    for (const item of imageFiles) await addImage(item);
  }

  async function handleImageInput(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (isPdfBuilder) {
      await addImages(selected);
    } else if (selected[0]) await addImage(selected[0]);
    event.target.value = "";
  }

  async function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files);
    if (!dropped.length) return;
    if (isPdf) {
      setError("Choose a PDF using the browse button.");
      return;
    }
    if (isPdfBuilder) {
      await addImages(dropped);
    }
    else await addImage(dropped[0]);
  }

  function changeMode(nextMode: ToolMode) {
    setMode(nextMode);
    setFile(null);
    setFiles([]);
    setDimensions(null);
    setTargetSize(nextMode === "resize" || (fitFirst && nextMode === "fit") ? "" : "50");
    setWidth(fitFirst && nextMode === "fit" ? "" : "200");
    setHeight(fitFirst && nextMode === "fit" ? "" : "230");
    setFormat(fitFirst && nextMode === "fit" ? "" : "image/jpeg");
    resetResult();
  }

  function applyPreset(name: string) {
    const preset = imagePresets.find((item) => item.name === name);
    if (!preset) return;
    setWidth(String(preset.width));
    setHeight(String(preset.height));
    setTargetSize(String(preset.maxSizeKB));
    setSizeUnit("KB");
    setFormat(preset.format);
  }

  function changeWidth(value: string) {
    setWidth(value);
    if (keepRatio && dimensions && Number(value) > 0) {
      setHeight(String(Math.max(1, Math.round(Number(value) * dimensions.height / dimensions.width))));
    }
  }

  function changeHeight(value: string) {
    setHeight(value);
    if (keepRatio && dimensions && Number(value) > 0) {
      setWidth(String(Math.max(1, Math.round(Number(value) * dimensions.width / dimensions.height))));
    }
  }

  async function runImageProcessing() {
    if (!file) return;
    setBusy(true);
    cancelRequested.current = false;
    setProgress(0);
    setError("");
    setNotice("");
    setResult(null);
    try {
      const maxBytes = targetSize.trim()
        ? Number(targetSize) * (sizeUnit === "MB" ? 1024 * 1024 : 1024)
        : undefined;
      if (targetSize.trim()) {
        if (!Number.isFinite(maxBytes) || (maxBytes ?? 0) < 1) throw new Error("Enter a valid maximum file size.");
      }
      const outputWidth = mode === "compress" ? dimensions?.width : width.trim() ? Number(width) : undefined;
      const outputHeight = mode === "compress" ? dimensions?.height : height.trim() ? Number(height) : undefined;
      const outputFormat = format || (file.type as ImageFormat) || "image/jpeg";
      const processed = await processImage(file, {
        width: outputWidth,
        height: outputHeight,
        format: outputFormat,
        maxBytes,
        fitMode,
      }, (value) => {
        setProgress(value);
        if (cancelRequested.current) throw new Error("PROCESSING_CANCELLED");
      });
      setResult(processed.result);
      if (processed.meetsSizeLimit) {
        setNotice("Every requested requirement has been checked and met.");
      } else {
        setNotice(`The closest result is ${formatBytes(processed.result.blob.size)}. The requested size limit could not be reached at these dimensions.`);
      }
    } catch (caught) {
      setError(wasCancelled(caught) ? "Processing cancelled. Your original file is unchanged." : getError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function createPdf() {
    if (!files.length) return;
    setBusy(true);
    cancelRequested.current = false;
    setError("");
    setNotice("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const document = await PDFDocument.create();
      const padding = Math.max(0, Math.min(100, Number(margin) || 0));
      for (const imageFile of files) {
        if (cancelRequested.current) throw new Error("PROCESSING_CANCELLED");
        const bytes = await imageFile.arrayBuffer();
        let embedded;
        if (imageFile.type === "image/png") embedded = await document.embedPng(bytes);
        else if (imageFile.type === "image/jpeg") embedded = await document.embedJpg(bytes);
        else {
          const converted = await processImage(imageFile, { format: "image/jpeg" });
          embedded = await document.embedJpg(await converted.result.blob.arrayBuffer());
        }
        const pageWidth = pageSize === "a4"
          ? (orientation === "portrait" ? 595.28 : 841.89)
          : embedded.width + padding * 2;
        const pageHeight = pageSize === "a4"
          ? (orientation === "portrait" ? 841.89 : 595.28)
          : embedded.height + padding * 2;
        const page = document.addPage([pageWidth, pageHeight]);
        const scale = Math.min((pageWidth - padding * 2) / embedded.width, (pageHeight - padding * 2) / embedded.height);
        const drawWidth = embedded.width * scale;
        const drawHeight = embedded.height * scale;
        page.drawImage(embedded, {
          x: (pageWidth - drawWidth) / 2,
          y: (pageHeight - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });
      }
      const pdfBytes = await document.save();
      downloadBlob(new Blob([new Uint8Array(pdfBytes).buffer], { type: "application/pdf" }), "filefix-images.pdf");
      setNotice(`PDF created with ${files.length} ${files.length === 1 ? "page" : "pages"}.`);
    } catch (caught) {
      setError(wasCancelled(caught) ? "PDF creation cancelled. Your original images are unchanged." : getError(caught).includes("memory") ? "Your browser ran low on memory. Try fewer or smaller images." : `Could not create this PDF. ${getError(caught)}`);
    } finally {
      setBusy(false);
    }
  }

  function parsePageNumbers(value: string, total: number): number[] {
    const pages = new Set<number>();
    for (const part of value.split(",")) {
      const range = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        if (end < start || end - start > 499) throw new Error("Check your page range. Use ranges such as 1, 3-5.");
        for (let number = start; number <= end; number += 1) pages.add(number);
      } else if (/^\d+$/.test(part.trim())) pages.add(Number(part.trim()));
      else if (part.trim()) throw new Error("Enter page numbers like 1, 3-5, or choose all pages.");
    }
    const selected = [...pages].sort((a, b) => a - b);
    if (!selected.length || selected.some((page) => page < 1 || page > total)) {
      throw new Error(`Choose page numbers from 1 to ${total}.`);
    }
    return selected;
  }

  async function convertPdf() {
    const pdf = files[0];
    if (!pdf) return;
    setBusy(true);
    cancelRequested.current = false;
    setError("");
    setNotice("");
    setPdfImages([]);
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();
      const pdfDocument = await pdfjs.getDocument({ data: await pdf.arrayBuffer() }).promise;
      const pages = pageSelection === "all" ? Array.from({ length: pdfDocument.numPages }, (_, index) => index + 1) : parsePageNumbers(pageRange, pdfDocument.numPages);
      const output: { blob: Blob; name: string }[] = [];
      for (const pageNumber of pages) {
        if (cancelRequested.current) throw new Error("PROCESSING_CANCELLED");
        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: Math.min(2, 1600 / Math.max(page.view[2], page.view[3])) });
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not render a PDF page.");
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not export a PDF page.")), pdfFormat, 0.92));
        output.push({ blob, name: `page-${String(pageNumber).padStart(2, "0")}.${extensions[pdfFormat]}` });
        page.cleanup();
      }
      setPdfImages(output);
      setNotice(`${output.length} ${output.length === 1 ? "page is" : "pages are"} ready to download.`);
    } catch (caught) {
      setError(wasCancelled(caught) ? "PDF conversion cancelled. Your original PDF is unchanged." : `Could not convert this PDF. It may be damaged or password-protected. ${getError(caught)}`);
    } finally {
      setBusy(false);
    }
  }

  async function downloadAllPages() {
    if (pdfImages.length === 1) {
      downloadBlob(pdfImages[0].blob, pdfImages[0].name);
      return;
    }
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (const image of pdfImages) zip.file(image.name, image.blob);
      downloadBlob(await zip.generateAsync({ type: "blob" }), "filefix-pages.zip");
    } catch (caught) {
      setError(`Could not create the ZIP download. ${getError(caught)}`);
    } finally {
      setBusy(false);
    }
  }

  function moveFile(index: number, direction: -1 | 1) {
    setFiles((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function dropFile(index: number) {
    const from = draggedFileIndex.current;
    draggedFileIndex.current = null;
    if (from === null || from === index) return;
    setFiles((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  }

  const heading = isPdf ? "PDF to images" : isPdfBuilder ? "Images to PDF" : mode === "compress" ? "Compress image" : mode === "resize" ? "Resize image" : "Make it fit";
  const accept = isPdf ? "application/pdf" : acceptedImages;
  const selectedFile = isPdf ? files[0] : file;

  return (
    <section className={fitFirst ? "workspace-card fit-first-workspace" : "workspace-card"} aria-label={heading}>
      <div className="workspace-top">
        <div><span className="eyebrow">QUICK FILE FIX</span><h2>{heading}</h2></div>
        <span className="local-badge"><span /> Runs in your browser</span>
      </div>
      <div className="mode-tabs" role="tablist" aria-label="Choose a file tool">
        {modes.map((item) => <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} className={mode === item.id ? "mode-tab active" : "mode-tab"} disabled={busy} onClick={() => changeMode(item.id)}>{item.label}</button>)}
      </div>

      {isPdf && <input ref={pdfInputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={(event) => {
        const selected = event.target.files?.[0];
        setError("");
        resetResult();
        if (selected && selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) setError("Choose a PDF file.");
        else if (selected && selected.size > 100 * 1024 * 1024) setError("This PDF is too large for browser processing. Try a PDF under 100 MB.");
        else if (selected) setFiles([selected]);
        event.target.value = "";
      }} />}

      {!selectedFile && !(isPdfBuilder && files.length > 0) && (
        <div className={dragging ? "upload-zone dragging" : "upload-zone"} role="button" tabIndex={0}
          onClick={() => (isPdf ? pdfInputRef : inputRef).current?.click()}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); (isPdf ? pdfInputRef : inputRef).current?.click(); } }}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={(event) => void onDrop(event)}>
          <input ref={inputRef} className="visually-hidden" type="file" accept={accept} multiple={isPdfBuilder} onChange={handleImageInput} />
          <span className="upload-icon" aria-hidden="true">{isPdf ? "↥" : "＋"}</span>
          <strong>Drop your {isPdf ? "PDF" : isPdfBuilder ? "images" : "image"} here</strong>
          <span className="upload-browse">or <span>click to browse</span></span>
          <span className="upload-formats">{isPdf ? "PDF • Up to 100 MB" : isPdfBuilder ? "JPG • PNG • WebP • Multiple files" : "JPG • PNG • WebP • Up to 20 MB"}</span>
        </div>
      )}

      {isPdfBuilder && files.length > 0 && (
        <div className="file-list">
          <p className="reorder-hint">Drag to reorder, or use the arrows.</p>
          {files.map((item, index) => <div className="file-row" key={`${item.name}-${item.lastModified}-${index}`} draggable={!busy}
            onDragStart={() => { draggedFileIndex.current = index; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); dropFile(index); }}
            onDragEnd={() => { draggedFileIndex.current = null; }}>
            <span className="file-icon">IMG</span><span className="file-details"><strong>{item.name}</strong><small>{formatBytes(item.size)}</small></span>
            <button className="icon-button" type="button" aria-label={`Move ${item.name} up`} disabled={busy || index === 0} onClick={() => moveFile(index, -1)}>↑</button>
            <button className="icon-button" type="button" aria-label={`Move ${item.name} down`} disabled={busy || index === files.length - 1} onClick={() => moveFile(index, 1)}>↓</button>
            <button className="icon-button remove-button" type="button" aria-label={`Remove ${item.name}`} disabled={busy} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
          </div>)}
          <button className="text-button add-files-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>+ Add images</button>
          <input ref={inputRef} className="visually-hidden" type="file" accept={acceptedImages} multiple onChange={handleImageInput} />
        </div>
      )}

      {selectedFile && !isPdfBuilder && (
        <div className="selected-file">
          {isPdf ? <div className="pdf-file-icon">PDF</div> : <img src={previewUrl} alt={`Preview of ${file?.name ?? "selected image"}`} className="selected-preview" />}
          <div className="selected-info"><strong>{selectedFile.name}</strong><span>{formatBytes(selectedFile.size)}{dimensions && isImageMode ? ` · ${dimensions.width} × ${dimensions.height} px` : ""}</span></div>
          <button className="icon-button remove-button" type="button" aria-label="Remove selected file" disabled={busy} onClick={() => { setFile(null); setFiles([]); setDimensions(null); resetResult(); }}>×</button>
        </div>
      )}

      {isImageMode && (file || (fitFirst && mode === "fit")) && !result && (
        <div className="controls">
          {mode !== "compress" && <div className="preset-wrap"><label className="field-label" htmlFor="preset">Start with a preset <span>optional</span></label>
            <select id="preset" defaultValue="" disabled={busy} onChange={(event) => applyPreset(event.target.value)}><option value="">Choose a starting point</option>{imagePresets.map((preset) => <option key={preset.name} value={preset.name}>{preset.name}</option>)}</select>
          </div>}
          {mode !== "resize" && <div className="field-group"><label className="field-label" htmlFor="max-size">Maximum file size <span>optional</span></label><div className="size-input-row"><input id="max-size" type="number" min="1" placeholder="No limit" value={targetSize} disabled={busy} onChange={(event) => setTargetSize(event.target.value)} /><select aria-label="Size unit" value={sizeUnit} disabled={busy} onChange={(event) => setSizeUnit(event.target.value as "KB" | "MB")}><option>KB</option><option>MB</option></select></div></div>}
          {mode === "resize" && <div className="field-group"><label className="field-label" htmlFor="max-size">Maximum file size <span>optional</span></label><div className="size-input-row"><input id="max-size" type="number" min="1" placeholder="No limit" value={targetSize} disabled={busy} onChange={(event) => setTargetSize(event.target.value)} /><select aria-label="Size unit" value={sizeUnit} disabled={busy} onChange={(event) => setSizeUnit(event.target.value as "KB" | "MB")}><option>KB</option><option>MB</option></select></div></div>}
          {mode !== "compress" && <div className="dimensions-fields">
            <div className="field-group"><label className="field-label" htmlFor="width">Width <span>px</span></label><input id="width" type="number" min="1" max="12000" value={width} disabled={busy} onChange={(event) => changeWidth(event.target.value)} /></div>
            <span className="dimension-x">×</span>
            <div className="field-group"><label className="field-label" htmlFor="height">Height <span>px</span></label><input id="height" type="number" min="1" max="12000" value={height} disabled={busy} onChange={(event) => changeHeight(event.target.value)} /></div>
          </div>}
          {mode !== "compress" && <label className="checkbox-label"><input type="checkbox" checked={keepRatio} disabled={busy} onChange={(event) => setKeepRatio(event.target.checked)} /> Keep aspect ratio</label>}
          <div className="field-group"><label className="field-label" htmlFor="fit-mode">Fit mode</label><select id="fit-mode" value={fitMode} disabled={busy} onChange={(event) => setFitMode(event.target.value as FitMode)}><option value="stretch">Stretch to exact size</option><option value="crop">Crop to fill</option><option value="pad">Pad to fit</option></select></div>
          <div className="field-group format-field"><label className="field-label" htmlFor="image-format">Output format <span>optional</span></label><select id="image-format" value={format} disabled={busy} onChange={(event) => setFormat(event.target.value as ImageFormat | "")}><option value="">Keep original</option><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></div>
          <button className="button process-button" type="button" onClick={() => void runImageProcessing()} disabled={busy || !file}>
            {busy ? <><span className="spinner" /> Fitting your image…</> : <>{mode === "compress" ? "Compress image" : mode === "resize" ? "Resize image" : "Make it fit"} <span aria-hidden="true">→</span></>}
          </button>
          {busy && <div className="progress-track" role="progressbar" aria-label="Image compression progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>}
          {busy && <button className="text-button cancel-button" type="button" onClick={() => { cancelRequested.current = true; }}>Cancel processing</button>}
        </div>
      )}

      {isPdfBuilder && files.length > 0 && (
        <div className="controls">
          <div className="select-grid">
            <div className="field-group"><label className="field-label" htmlFor="page-size">Page size</label><select id="page-size" value={pageSize} disabled={busy} onChange={(event) => setPageSize(event.target.value as "a4" | "image")}><option value="a4">A4</option><option value="image">Match image</option></select></div>
            {pageSize === "a4" && <div className="field-group"><label className="field-label" htmlFor="orientation">Orientation</label><select id="orientation" value={orientation} disabled={busy} onChange={(event) => setOrientation(event.target.value as "portrait" | "landscape")}><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></div>}
            <div className="field-group"><label className="field-label" htmlFor="margin">Margin <span>pt</span></label><input id="margin" type="number" min="0" max="100" value={margin} disabled={busy} onChange={(event) => setMargin(event.target.value)} /></div>
          </div>
          <button className="button process-button" type="button" disabled={busy} onClick={() => void createPdf()}>{busy ? "Creating PDF…" : "Create PDF"} <span aria-hidden="true">→</span></button>
          {busy && <button className="text-button cancel-button" type="button" onClick={() => { cancelRequested.current = true; }}>Cancel processing</button>}
        </div>
      )}

      {isPdf && selectedFile && pdfImages.length === 0 && (
        <div className="controls">
          <div className="field-group"><span className="field-label">Pages to convert</span><div className="radio-row">
            <label className="radio-card"><input type="radio" name="pages" checked={pageSelection === "all"} disabled={busy} onChange={() => setPageSelection("all")} /> All pages</label>
            <label className="radio-card"><input type="radio" name="pages" checked={pageSelection === "selected"} disabled={busy} onChange={() => setPageSelection("selected")} /> Selected pages</label>
          </div></div>
          {pageSelection === "selected" && <div className="field-group"><label className="field-label" htmlFor="page-range">Page numbers</label><input id="page-range" placeholder="For example: 1, 3-5" value={pageRange} disabled={busy} onChange={(event) => setPageRange(event.target.value)} /></div>}
          <div className="field-group format-field"><label className="field-label" htmlFor="pdf-format">Output format</label><select id="pdf-format" value={pdfFormat} disabled={busy} onChange={(event) => setPdfFormat(event.target.value as "image/jpeg" | "image/png")}><option value="image/jpeg">JPG</option><option value="image/png">PNG</option></select></div>
          <button className="button process-button" type="button" disabled={busy} onClick={() => void convertPdf()}>{busy ? "Converting pages…" : "Convert to images"} <span aria-hidden="true">→</span></button>
          {busy && <button className="text-button cancel-button" type="button" onClick={() => { cancelRequested.current = true; }}>Cancel processing</button>}
        </div>
      )}

      {result && resultUrl && file && (
        <div className="result-panel" aria-live="polite">
          <div className="result-heading"><span className={notice.startsWith("Every") ? "result-check" : "result-warning"} aria-hidden="true">{notice.startsWith("Every") ? "✓" : "!"}</span><div><strong>{notice.startsWith("Every") ? "Your image is ready" : "Closest result is ready"}</strong><span>{formatLabel(result.format)} · {result.width} × {result.height} px · {result.fitMode === "crop" ? "Cropped to fill" : result.fitMode === "pad" ? "Padded to fit" : "Stretched to exact size"}</span></div></div>
          <div className="result-comparison">
            <div className="comparison-preview"><span>BEFORE</span><img src={previewUrl} alt="Original image preview" /><strong>{formatBytes(file.size)}</strong></div>
            <span className="comparison-arrow" aria-hidden="true">→</span>
            <div className="comparison-preview"><span>AFTER</span><img src={resultUrl} alt="Processed image preview" /><strong>{formatBytes(result.blob.size)}</strong></div>
          </div>
          <p className="fit-preview-note">Preview shows the exact file that will be downloaded. {result.fitMode === "crop" ? "The image was cropped from the edges to fill the requested dimensions." : result.fitMode === "pad" ? "The image keeps its proportions and empty space was added to reach the requested dimensions." : "The image was scaled directly to the requested dimensions, which can change its proportions."}</p>
          <div className="verification-list">
            {mode !== "resize" || targetSize.trim() ? <span className={result.blob.size <= Number(targetSize) * (sizeUnit === "MB" ? 1024 * 1024 : 1024) ? "verified" : "not-verified"}>
              {result.blob.size <= Number(targetSize) * (sizeUnit === "MB" ? 1024 * 1024 : 1024) ? "✓" : "!"} Under {targetSize} {sizeUnit}</span> : null}
            {mode !== "compress" && (width.trim() || height.trim()) ? <span className="verified">✓ {result.width} × {result.height} px</span> : null}
            <span className="verified">✓ {formatLabel(result.format)}</span>
            <span className="saved-stat">Saved <strong>{file.size > result.blob.size ? `${((1 - result.blob.size / file.size) * 100).toFixed(1)}%` : "—"}</strong></span>
          </div>
          <p className={notice.startsWith("Every") ? "result-notice success-text" : "result-notice"}>{notice}</p>
          <div className="result-actions">
            <button className="button download-button" type="button" onClick={() => downloadBlob(result.blob, `${file.name.replace(/\.[^.]+$/, "")}-filefix.${extensions[result.format]}`)}>Download file <span aria-hidden="true">↓</span></button>
            <button className="text-button" type="button" onClick={() => { setFile(null); setDimensions(null); resetResult(); }}>Process another</button>
          </div>
        </div>
      )}

      {pdfImages.length > 0 && (
        <div className="pdf-results" aria-live="polite">
          <div className="result-heading"><span className="result-check">✓</span><div><strong>Images are ready</strong><span>{pdfImages.length} {pdfImages.length === 1 ? "page" : "pages"} · {formatLabel(pdfFormat)}</span></div></div>
          <div className="pdf-image-grid">{pdfImages.map((image, index) => <div className="pdf-image-card" key={image.name}><img src={pdfImageUrls[index]} alt={`Preview of ${image.name}`} /><span>{image.name}</span><button type="button" className="text-button" onClick={() => downloadBlob(image.blob, image.name)}>Download page</button></div>)}</div>
          <button className="button download-button" type="button" disabled={busy} onClick={() => void downloadAllPages()}>{busy ? "Preparing ZIP…" : pdfImages.length > 1 ? "Download all as ZIP" : "Download image"} <span aria-hidden="true">↓</span></button>
          <button className="text-button" type="button" onClick={() => { setFiles([]); setPdfImages([]); setNotice(""); }}>Convert another PDF</button>
        </div>
      )}

      {notice && !result && !pdfImages.length && <p className="inline-notice" role="status">{notice}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {isImageMode && <p className="privacy-note"><span aria-hidden="true">⌑</span> Images are processed in your browser and aren’t sent to a FileFix upload service.</p>}
      {isPdf && <p className="privacy-note"><span aria-hidden="true">⌑</span> PDF pages are rendered in your browser. Processing code loads only when you start conversion.</p>}
      {isPdfBuilder && <p className="privacy-note"><span aria-hidden="true">⌑</span> PDFs are created in your browser. Images aren’t sent to a FileFix upload service.</p>}
    </section>
  );
}
