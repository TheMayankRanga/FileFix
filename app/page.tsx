import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { ToolWorkspace } from "@/components/ToolWorkspace";

const features = [
  ["01", "Set the requirements", "Choose the exact file size, dimensions and format your upload form asks for."],
  ["02", "Let FileFix do the work", "Your image is resized and compressed step by step, right in your browser."],
  ["03", "Check, then download", "We verify the output against your requirements before calling it a fit."],
];

export default function HomePage() {
  return (
    <main>
      <section className="hero page-shell">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> FILEFIX · YOUR UPLOAD TOOLKIT</span>
          <h1>Make your file fit <span>any upload requirement.</span></h1>
          <p>Set the size, dimensions, and format. FileFix does the rest.</p>
          <div className="hero-actions">
            <a className="button" href="#tool">Tell us what you need <span aria-hidden="true">→</span></a>
            <span className="trust-note"><span aria-hidden="true">✳</span> Free <i /> No signup <i /> Browser-based</span>
          </div>
        </div>
        <div className="hero-panel" aria-label="Example of a file being prepared">
          <div className="hero-panel-top"><span className="hero-panel-dot" /> YOUR REQUIREMENTS <span className="hero-panel-status">READY</span></div>
          <div className="hero-file">
            <div className="hero-file-thumb"><span className="mini-photo mini-photo-small" /></div>
            <div><strong>profile-photo.png</strong><span>2.8 MB · 1200 × 1200 px</span></div>
            <span className="hero-file-more">•••</span>
          </div>
          <div className="hero-target"><div><span>MAXIMUM SIZE</span><strong>50 KB</strong></div><div><span>DIMENSIONS</span><strong>200 × 230 px</strong></div><div><span>FORMAT</span><strong>JPG</strong></div></div>
          <div className="hero-progress"><div><span style={{ width: "82%" }} /></div><span>Making it fit <strong>82%</strong></span></div>
          <div className="hero-success"><span>✓</span><div><strong>Ready to upload</strong><small>48.7 KB · 200 × 230 px · JPG</small></div></div>
        </div>
      </section>

      <section className="tool-section page-shell" id="tool">
        <div className="section-heading">
          <div><span className="eyebrow">THE MAIN WORKFLOW</span><h2>What does the upload require?</h2></div>
          <p>Give us the requirements you know. Upload your image when you’re ready.</p>
        </div>
        <ToolWorkspace initialMode="fit" fitFirst />
      </section>

      <div className="page-shell"><AdSlot /></div>

      <section className="how-section page-shell">
        <div className="section-heading">
          <div><span className="eyebrow">NO GUESSWORK</span><h2>Exactly what the upload form asked for.</h2></div>
          <p>No mystery settings. You set the target, and FileFix checks the result.</p>
        </div>
        <div className="feature-grid">{features.map(([number, title, copy]) => (
          <article className="feature-card" key={number}>
            <span className="feature-number">{number}</span><h3>{title}</h3><p>{copy}</p>
          </article>
        ))}</div>
      </section>

      <section className="tools-strip page-shell">
        <div><span className="eyebrow">NEED SOMETHING ELSE?</span><h2>More ways to get it right.</h2></div>
        <div className="tool-links">
          <Link href="/compress-image">Compress an image <span>↗</span></Link>
          <Link href="/resize-image">Resize an image <span>↗</span></Link>
          <Link href="/image-to-pdf">Images to PDF <span>↗</span></Link>
          <Link href="/pdf-to-image">PDF to images <span>↗</span></Link>
        </div>
      </section>

      <section className="faq-section page-shell">
        <span className="eyebrow">GOOD TO KNOW</span><h2>Frequently asked questions</h2>
        <div className="faq-list">
          <details><summary>How does FileFix make an image fit?</summary><p>Choose your maximum file size, dimensions, and output format. FileFix resizes the image, iteratively adjusts compression, and checks the output against each requested constraint.</p></details>
          <details><summary>Are my files uploaded?</summary><p>Image tools process files in your browser. PDF conversion also runs in your browser using locally loaded processing libraries; files are not sent to a FileFix upload service.</p></details>
          <details><summary>Can every image fit under my chosen size?</summary><p>Not always. Some format and dimension combinations have a minimum possible size. If the output cannot meet your target, FileFix will say so and let you download the closest result.</p></details>
          <details><summary>Are the presets official requirements?</summary><p>No. Presets are editable starting points only. Always check the requirements from the organization or website where you plan to upload.</p></details>
        </div>
      </section>
    </main>
  );
}
