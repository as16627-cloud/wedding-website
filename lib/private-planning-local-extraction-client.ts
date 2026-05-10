"use client";

const MIN_READABLE_TEXT_LENGTH = 24;
const MAX_OCR_PDF_PAGES = 4;

type ExtractionStatusCallback = (message: string) => void;

type PdfTextItem = {
  str?: string;
};

type PdfPage = {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: { canvas: HTMLCanvasElement; viewport: { width: number; height: number } }) => { promise: Promise<void> };
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPage>;
  destroy?: () => Promise<void>;
};

export type PrivatePlanningLocalExtractionResult = {
  text: string;
  method: "pdf-text" | "pdf-ocr" | "image-ocr";
};

function cleanText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function hasReadableText(value: string) {
  const text = cleanText(value);

  return text.length >= MIN_READABLE_TEXT_LENGTH && /[a-z]/i.test(text);
}

async function loadPdfDocument(file: Blob) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  pdfjs.GlobalWorkerOptions.workerSrc ||= new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useWorkerFetch: false,
  });

  return (await loadingTask.promise) as unknown as PdfDocument;
}

async function extractPdfSelectableText(pdf: PdfDocument) {
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str ?? "").join(" ");

    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  return cleanText(pages.join("\n"));
}

async function recognizeImage(source: string | HTMLCanvasElement, onStatus: ExtractionStatusCallback) {
  const tesseract = await import("tesseract.js");
  const result = await tesseract.recognize(source, "eng", {
    logger: (message) => {
      if (message.status === "recognizing text" && message.progress > 0) {
        onStatus("OCR running locally...");
      }
    },
  });

  return cleanText(result.data.text ?? "");
}

async function ocrPdfPages(pdf: PdfDocument, onStatus: ExtractionStatusCallback) {
  const pages: string[] = [];
  const pageLimit = Math.min(pdf.numPages, MAX_OCR_PDF_PAGES);

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, Math.max(1.25, 1500 / Math.max(baseViewport.width, 1)));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvas, viewport }).promise;
    pages.push(await recognizeImage(canvas, onStatus));
  }

  return cleanText(pages.join("\n"));
}

async function extractPdfText(file: Blob, onStatus: ExtractionStatusCallback): Promise<PrivatePlanningLocalExtractionResult> {
  onStatus("Extracting text...");

  const pdf = await loadPdfDocument(file);

  try {
    const selectableText = await extractPdfSelectableText(pdf);

    if (hasReadableText(selectableText)) {
      return {
        text: selectableText,
        method: "pdf-text",
      };
    }

    onStatus("PDF appears scanned/image-based and needs OCR.");
    onStatus("OCR running locally...");

    const ocrText = await ocrPdfPages(pdf, onStatus);

    if (!hasReadableText(ocrText)) {
      throw new Error("No readable text found — download only");
    }

    return {
      text: ocrText,
      method: "pdf-ocr",
    };
  } finally {
    await pdf.destroy?.().catch(() => undefined);
  }
}

async function extractImageText(file: Blob, onStatus: ExtractionStatusCallback): Promise<PrivatePlanningLocalExtractionResult> {
  onStatus("OCR running locally...");

  const imageUrl = URL.createObjectURL(file);

  try {
    const text = await recognizeImage(imageUrl, onStatus);

    if (!hasReadableText(text)) {
      throw new Error("No readable text found — download only");
    }

    return {
      text,
      method: "image-ocr",
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export async function extractPrivatePlanningTextLocally({
  file,
  mimeType,
  onStatus,
}: {
  file: Blob;
  mimeType: string;
  onStatus: ExtractionStatusCallback;
}): Promise<PrivatePlanningLocalExtractionResult> {
  if (mimeType === "application/pdf") {
    return extractPdfText(file, onStatus);
  }

  if (mimeType.startsWith("image/")) {
    return extractImageText(file, onStatus);
  }

  throw new Error("This file type cannot be extracted.");
}
