import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import type { ToolMode } from "@/types/filefix";

const pages: Record<string, { title: string; heading: string; description: string; intro: string; mode: ToolMode; faqs: [string, string][] }> = {
  "compress-image": {
    title: "Compress Image Online — FileFix",
    heading: "Compress an image to the size you need.",
    description: "Compress JPG, PNG and WebP images in your browser. Set a maximum file size and download a verified result with FileFix.",
    intro: "Need an image under a specific upload limit? Choose your target size and output format. FileFix adjusts image compression iteratively and checks the final file size before you download.",
    mode: "compress",
    faqs: [["Can I set an exact maximum size?", "Yes. Enter a target in KB or MB. FileFix checks the final file size and tells you if the target could not be reached."], ["Will compression change dimensions?", "Not unless you choose dimensions too. The default keeps your original image dimensions."]],
  },
  "resize-image": {
    title: "Resize Image Online — FileFix",
    heading: "Resize an image to exact dimensions.",
    description: "Resize JPG, PNG and WebP images to exact pixel dimensions. Keep proportions or choose a new aspect ratio with FileFix.",
    intro: "Enter the width and height your upload requires, choose whether to preserve the image proportions, and select an output format. The dimensions are checked on the processed image.",
    mode: "resize",
    faqs: [["Can I preserve the original proportions?", "Yes. Enable Keep aspect ratio and changing either dimension will update the other."], ["Can resized images have a size limit too?", "Yes. Add an optional maximum file size and FileFix will try progressive compression."]],
  },
  "image-to-pdf": {
    title: "Convert Images to PDF — FileFix",
    heading: "Turn your images into a PDF.",
    description: "Combine JPG, PNG and WebP images into a PDF in your browser. Reorder pages and choose page size and orientation with FileFix.",
    intro: "Select multiple images, arrange them in the order you want, and export a single PDF. Choose an A4 page or match the page to each image, with optional margins.",
    mode: "image-to-pdf",
    faqs: [["Which image types can I add?", "JPG, PNG, and WebP are supported. WebP images are converted to JPEG for PDF embedding."], ["Can I change the page order?", "Yes. Use the move controls next to each image before creating the PDF."]],
  },
  "pdf-to-image": {
    title: "Convert PDF to Images — FileFix",
    heading: "Convert PDF pages into images.",
    description: "Convert all PDF pages or choose specific pages as JPG or PNG images. Download page images individually or together as a ZIP.",
    intro: "Load a PDF and choose whether to convert every page or a specific page range. Select JPG or PNG output, then download images individually or together in a ZIP archive.",
    mode: "pdf-to-image",
    faqs: [["Does this work with multi-page PDFs?", "Yes. You can render all pages, or enter page numbers and ranges such as 1, 3-5."], ["Are PDF pages uploaded?", "No. PDF rendering runs in your browser after the necessary processing code is loaded."]],
  },
  "compress-image-to-50kb": {
    title: "Compress Image to 50 KB — FileFix",
    heading: "Compress an image to 50 KB.",
    description: "Try to fit a JPG, PNG or WebP image within 50 KB. FileFix checks the resulting file size before download.",
    intro: "Set a 50 KB target and choose your output format. FileFix iterates through compression settings, then clearly shows whether your processed image met the size target.",
    mode: "compress",
    faqs: [["Will every image fit under 50 KB?", "Some images cannot meet that target at their current dimensions. FileFix reports when the closest output is still over the limit."], ["Can I also set dimensions?", "Yes. Use Make It Fit to specify both dimensions and file size at the same time."]],
  },
  "compress-image-to-100kb": {
    title: "Compress Image to 100 KB — FileFix",
    heading: "Compress an image to 100 KB.",
    description: "Try to fit your image within 100 KB. Adjust format and dimensions and verify the result with FileFix.",
    intro: "Use a 100 KB target for your upload. Choose JPG, PNG, or WebP output and FileFix checks whether the generated image meets the selected size limit.",
    mode: "compress",
    faqs: [["Does 100 KB guarantee a good-looking image?", "Compression results vary by image content. Preview the result before downloading and choose the format that works best for your upload."], ["What if my image is larger than 20 MB?", "For browser performance, FileFix currently accepts images up to 20 MB."]],
  },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  return page ? { title: page.title, description: page.description } : {};
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <main className="tool-page page-shell">
      <div className="tool-page-heading"><span className="eyebrow">FILEFIX TOOL</span><h1>{page.heading}</h1><p>{page.intro}</p></div>
      <ToolWorkspace initialMode={page.mode} />
      <AdSlot />
      <section className="page-help">
        <h2>A simpler way to meet upload requirements</h2>
        <p>FileFix helps you prepare files without installing an app or creating an account. Your file is processed in your browser, and the result is checked before we say it is ready.</p>
        <h2>Explore more tools</h2>
        <div className="related-links">
          <Link href="/compress-image">Compress image</Link><Link href="/resize-image">Resize image</Link>
          <Link href="/image-to-pdf">Image to PDF</Link><Link href="/pdf-to-image">PDF to image</Link>
          <Link href="/compress-image-to-50kb">Compress to 50 KB</Link><Link href="/compress-image-to-100kb">Compress to 100 KB</Link>
        </div>
        <h2>Frequently asked questions</h2>
        <div className="faq-list">{page.faqs.map(([question, answer]) => (
          <details key={question}><summary>{question}</summary><p>{answer}</p></details>
        ))}</div>
      </section>
    </main>
  );
}
