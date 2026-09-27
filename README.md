# FileFix

FileFix is a browser-based file utility MVP built with Next.js, React, TypeScript, and Tailwind CSS. It helps people make images meet their upload requirements, and convert images and PDFs without accounts or a FileFix upload service.

The interface defaults to a dark indigo theme. Use the sun/moon control in the header to switch to light mode; the preference is stored locally in the browser.

## Local setup

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a production build with `npm run build`, then serve it locally with `npm start`.

## Deploy to Vercel

Import the repository into Vercel, keep the detected Next.js framework settings, and deploy. No environment variables, database, or file storage are required. The app uses Next.js App Router static generation for the tool landing pages.

## Included tools

- Make it fit: maximum size, dimensions, output format, editable presets, and per-constraint verification.
- Compress image: iterative browser Canvas encoding with a chosen size limit.
- Resize image: exact dimensions with an optional size target and aspect-ratio control.
- Images to PDF: multiple JPG/PNG/WebP images, reorder controls, A4 or image-sized pages, orientation, and margins.
- PDF to images: all pages or selected page numbers/ranges, JPG or PNG, individual downloads, and ZIP download.

## File handling

Image input is decoded and re-encoded with browser image and Canvas APIs. PDF generation uses `pdf-lib`, and PDF rendering and ZIP creation use `pdfjs-dist` and `jszip`. The PDF/ZIP packages are dynamically imported when those operations are requested; they are not part of the initial client UI import. Image and PDF bytes are processed in the browser and are not sent to a FileFix upload service. Vercel serves the application and static code assets, not user files.
Image and PDF conversion operations can be cancelled between processing steps. Combining images into one PDF is limited to 20 images and 100 MB total.

## Ad slots

`components/AdSlot.tsx` exports the reusable `<AdSlot />` component. It currently returns no content in development and a reserved, unobtrusive container in production. A future ad integration can be added inside this component; no tool, download, or upload component needs to know about the ad provider. Follow the provider’s consent, layout, and policy requirements before enabling ads.

## Known limitations

- Image processing currently accepts JPG/JPEG, PNG, and WebP files up to 20 MB. Very large dimensions or a very low size target may exceed browser memory or be impossible to satisfy. Such size limits are reported rather than treated as successful.
- Image resizing scales to the requested exact width and height; it does not crop to preserve the source composition. With “Keep aspect ratio” enabled, dimensions update proportionally.
- Browser Canvas encoding may not preserve metadata, animation, or all color profiles. PNG output can be larger than the source or chosen maximum.
- PDFs are limited to 100 MB. Browser memory, PDF encryption, unusual PDF structures, and browser capabilities can limit rendering or export. PDF-to-image output uses a bounded rendering scale.
- Processing runs on the main browser thread. Progress is surfaced during iterative image encoding, but very large files may still temporarily make a low-memory device less responsive.
- Cancellation takes effect after the current browser encoding or rendering step; an individual active Canvas encoding or PDF page render cannot be interrupted mid-operation.
- Presets are editable starting points, not universal or official requirements. Check the destination’s current specifications.

## Suggested V2

- Crop and fit modes, including transparent padding and smart crop previews.
- More detailed image quality/size trade-off controls.
- Dedicated worker-based processing and a broader browser/device test matrix.
- PDF page thumbnails, reorder controls, and richer page sizing options.
- Optional local-history workflow that stores no uploaded file on a server.
