import OpenAI from "openai";
import type { Response, ResponseCreateParamsNonStreaming, ResponseInputContent } from "openai/resources/responses/responses";
import { privatePlanningAllowedMimeTypes } from "@/lib/private-planning-file-rules";

export const PRIVATE_PLANNING_EXTRACTION_MODEL = process.env.OPENAI_EXTRACTION_MODEL || "gpt-4.1-mini";

export const privatePlanningVendorCategories = [
  "Venue",
  "Celebrant",
  "Photography",
  "Videography",
  "Florist",
  "DJ / Entertainment",
  "Cake",
  "Hair & Makeup",
  "Stationery",
  "Decor / Hire",
  "Transport",
  "Accommodation",
  "Audio Guestbook",
] as const;

type VendorCategory = (typeof privatePlanningVendorCategories)[number];
type ContactMethod = "Email" | "Phone" | "Instagram" | "Website";

export type PrivatePlanningExtractedVendor = {
  name: string | null;
  category: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
};

export type PrivatePlanningExtractedDocument = {
  documentType: "invoice" | "receipt" | "quote" | "contract" | "unknown";
  invoiceNumber: string | null;
  receiptNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string | null;
};

export type PrivatePlanningExtractionConfidence = {
  vendor: number;
  contact: number;
  amounts: number;
  dates: number;
};

export type PrivatePlanningExtractionResult = {
  vendor: PrivatePlanningExtractedVendor;
  document: PrivatePlanningExtractedDocument;
  confidence: PrivatePlanningExtractionConfidence;
  warnings: string[];
};

export type PrivatePlanningVendorRecord = {
  id?: string;
  category?: string;
  vendorName?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  notes?: string;
};

export type PrivatePlanningVendorMatch = {
  id: string;
  vendorName: string;
  category: string;
  email: string;
  phone: string;
  website: string;
  score: number;
  reasons: string[];
};

export type PrivatePlanningVendorSuggestionDto = {
  id: string;
  fileId: string;
  suggestionStatus: string;
  suggestedVendor: PrivatePlanningExtractedVendor;
  suggestedDocument: PrivatePlanningExtractedDocument;
  confidence: PrivatePlanningExtractionConfidence;
  warnings: string[];
  possibleMatches: PrivatePlanningVendorMatch[];
  matchedVendorId: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  dismissedAt: string | null;
};

export type PrivatePlanningFileExtractionDto = {
  id: string;
  fileId: string;
  extractionStatus: string;
  extractedVendor: PrivatePlanningExtractedVendor | null;
  extractedDocument: PrivatePlanningExtractedDocument | null;
  confidence: PrivatePlanningExtractionConfidence | null;
  warnings: string[];
  errorMessage: string | null;
  matchedVendorId: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  dismissedAt: string | null;
  suggestion: PrivatePlanningVendorSuggestionDto | null;
};

type PrivatePlanningSuggestionLike = {
  id: string;
  fileId: string;
  suggestionStatus: string;
  suggestedVendor: unknown;
  suggestedDocument: unknown;
  confidence: unknown;
  warnings: unknown;
  possibleMatches: unknown;
  matchedVendorId: string | null;
  reviewedAt: Date | null;
  appliedAt: Date | null;
  dismissedAt: Date | null;
};

type PrivatePlanningExtractionLike = {
  id: string;
  fileId: string;
  extractionStatus: string;
  extractedVendor: unknown;
  extractedDocument: unknown;
  confidence: unknown;
  warnings: unknown;
  errorMessage: string | null;
  matchedVendorId: string | null;
  reviewedAt: Date | null;
  appliedAt: Date | null;
  dismissedAt: Date | null;
};

type GeneratedVendorInput = {
  id: string;
  vendor: PrivatePlanningExtractedVendor;
  document: PrivatePlanningExtractedDocument | null;
  fileId: string;
  sourceFilename?: string;
};

const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["vendor", "document", "confidence", "warnings"],
  properties: {
    vendor: {
      type: "object",
      additionalProperties: false,
      required: ["name", "category", "contactName", "email", "phone", "website", "address"],
      properties: {
        name: { type: ["string", "null"] },
        category: { type: ["string", "null"] },
        contactName: { type: ["string", "null"] },
        email: { type: ["string", "null"] },
        phone: { type: ["string", "null"] },
        website: { type: ["string", "null"] },
        address: { type: ["string", "null"] },
      },
    },
    document: {
      type: "object",
      additionalProperties: false,
      required: ["documentType", "invoiceNumber", "receiptNumber", "invoiceDate", "dueDate", "subtotal", "tax", "total", "currency"],
      properties: {
        documentType: { type: "string", enum: ["invoice", "receipt", "quote", "contract", "unknown"] },
        invoiceNumber: { type: ["string", "null"] },
        receiptNumber: { type: ["string", "null"] },
        invoiceDate: { type: ["string", "null"] },
        dueDate: { type: ["string", "null"] },
        subtotal: { type: ["number", "null"] },
        tax: { type: ["number", "null"] },
        total: { type: ["number", "null"] },
        currency: { type: ["string", "null"] },
      },
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: ["vendor", "contact", "amounts", "dates"],
      properties: {
        vendor: { type: "number", minimum: 0, maximum: 1 },
        contact: { type: "number", minimum: 0, maximum: 1 },
        amounts: { type: "number", minimum: 0, maximum: 1 },
        dates: { type: "number", minimum: 0, maximum: 1 },
      },
    },
    warnings: {
      type: "array",
      items: { type: "string" },
      maxItems: 10,
    },
  },
} as const;

let openAiClient: OpenAI | null = null;

export function isPrivatePlanningExtractionConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getOpenAiClient() {
  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openAiClient;
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown) {
  const text = safeString(value);

  if (!text || includesSensitiveFinancialIdentifier(text)) {
    return null;
  }

  return text.slice(0, 500);
}

function nullableMoney(value: unknown) {
  const amount = typeof value === "number" ? value : Number.parseFloat(safeString(value).replace(/[^0-9.-]/g, ""));

  return Number.isFinite(amount) ? amount : null;
}

function confidenceNumber(value: unknown) {
  const number = typeof value === "number" && Number.isFinite(value) ? value : 0;

  return Math.max(0, Math.min(1, number));
}

function includesSensitiveFinancialIdentifier(value: string) {
  const compact = value.replace(/\s+/g, " ");

  return [
    /\b(?:iban|swift|bic|bsb|sort code|account number|acct no|routing number|tax file number|tfn|abn|vat|passport|driver'?s licence|medical)\b/i,
    /\b(?:\d[ -]*?){13,19}\b/,
  ].some((pattern) => pattern.test(compact));
}

export function sanitizePrivatePlanningExtraction(raw: unknown): PrivatePlanningExtractionResult {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const rawVendor = source.vendor && typeof source.vendor === "object" ? (source.vendor as Record<string, unknown>) : {};
  const rawDocument = source.document && typeof source.document === "object" ? (source.document as Record<string, unknown>) : {};
  const rawConfidence = source.confidence && typeof source.confidence === "object" ? (source.confidence as Record<string, unknown>) : {};
  const documentType = safeString(rawDocument.documentType);
  const currency = nullableText(rawDocument.currency)?.toUpperCase() ?? null;

  return {
    vendor: {
      name: nullableText(rawVendor.name),
      category: nullableText(rawVendor.category),
      contactName: nullableText(rawVendor.contactName),
      email: nullableText(rawVendor.email),
      phone: nullableText(rawVendor.phone),
      website: nullableText(rawVendor.website),
      address: nullableText(rawVendor.address),
    },
    document: {
      documentType: ["invoice", "receipt", "quote", "contract"].includes(documentType)
        ? (documentType as PrivatePlanningExtractedDocument["documentType"])
        : "unknown",
      invoiceNumber: nullableText(rawDocument.invoiceNumber),
      receiptNumber: nullableText(rawDocument.receiptNumber),
      invoiceDate: nullableText(rawDocument.invoiceDate),
      dueDate: nullableText(rawDocument.dueDate),
      subtotal: nullableMoney(rawDocument.subtotal),
      tax: nullableMoney(rawDocument.tax),
      total: nullableMoney(rawDocument.total),
      currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : null,
    },
    confidence: {
      vendor: confidenceNumber(rawConfidence.vendor),
      contact: confidenceNumber(rawConfidence.contact),
      amounts: confidenceNumber(rawConfidence.amounts),
      dates: confidenceNumber(rawConfidence.dates),
    },
    warnings: Array.isArray(source.warnings)
      ? source.warnings.map((warning) => nullableText(warning)).filter((warning): warning is string => Boolean(warning)).slice(0, 10)
      : [],
  };
}

export function canExtractPrivatePlanningMimeType(mimeType: string) {
  return (privatePlanningAllowedMimeTypes as readonly string[]).includes(mimeType);
}

function normalizeText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(pty|ltd|limited|co|company|the|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value?: string | null) {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeDomain(value?: string | null) {
  const text = (value ?? "").trim();

  if (!text) {
    return "";
  }

  try {
    const url = new URL(text.includes("://") ? text : `https://${text}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return text.replace(/^www\./, "").toLowerCase();
  }
}

function levenshtein(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function fuzzySimilarity(left: string, right: string) {
  if (!left || !right) {
    return 0;
  }

  return 1 - levenshtein(left, right) / Math.max(left.length, right.length);
}

export function findPrivatePlanningVendorMatches(
  extractedVendor: PrivatePlanningExtractedVendor,
  vendors: PrivatePlanningVendorRecord[],
) {
  const extractedName = normalizeText(extractedVendor.name);
  const extractedEmail = safeString(extractedVendor.email).toLowerCase();
  const extractedPhone = normalizePhone(extractedVendor.phone);
  const extractedDomain = normalizeDomain(extractedVendor.website);

  return vendors
    .map((vendor) => {
      const reasons: string[] = [];
      let score = 0;
      const vendorName = safeString(vendor.vendorName);
      const vendorEmail = safeString(vendor.email).toLowerCase();
      const vendorPhone = normalizePhone(vendor.phone);
      const vendorDomain = normalizeDomain(vendor.website);
      const nameSimilarity = fuzzySimilarity(extractedName, normalizeText(vendorName));

      if (extractedName && extractedName === normalizeText(vendorName)) {
        score += 1;
        reasons.push("exact name");
      } else if (nameSimilarity >= 0.78) {
        score += nameSimilarity * 0.75;
        reasons.push("similar name");
      }

      if (extractedEmail && vendorEmail && extractedEmail === vendorEmail) {
        score += 1;
        reasons.push("email");
      }

      if (extractedPhone && vendorPhone && extractedPhone.endsWith(vendorPhone.slice(-8))) {
        score += 0.8;
        reasons.push("phone");
      }

      if (extractedDomain && vendorDomain && extractedDomain === vendorDomain) {
        score += 0.9;
        reasons.push("website");
      }

      return {
        id: safeString(vendor.id),
        vendorName,
        category: safeString(vendor.category),
        email: vendorEmail,
        phone: safeString(vendor.phone),
        website: safeString(vendor.website),
        score: Number(score.toFixed(3)),
        reasons,
      };
    })
    .filter((match): match is PrivatePlanningVendorMatch => Boolean(match.id && match.vendorName && match.score >= 0.7))
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

export function coercePrivatePlanningVendorCategory(category?: string | null): VendorCategory {
  const normalized = normalizeText(category);
  const exact = privatePlanningVendorCategories.find((candidate) => normalizeText(candidate) === normalized);

  if (exact) {
    return exact;
  }

  const keywordMap: Array<[RegExp, VendorCategory]> = [
    [/venue|house|estate|restaurant|hotel|function/, "Venue"],
    [/celebrant|officiant/, "Celebrant"],
    [/photo/, "Photography"],
    [/video|film|cinemat/, "Videography"],
    [/flor|flower|bloom/, "Florist"],
    [/dj|music|band|entertain/, "DJ / Entertainment"],
    [/cake|dessert|bakery/, "Cake"],
    [/hair|makeup|beauty/, "Hair & Makeup"],
    [/stationer|invite|print|paper/, "Stationery"],
    [/decor|hire|rental|styling|furniture/, "Decor / Hire"],
    [/transport|car|bus|limo/, "Transport"],
    [/accommodation|hotel|stay/, "Accommodation"],
    [/audio|guestbook|phone/, "Audio Guestbook"],
  ];

  return keywordMap.find(([pattern]) => pattern.test(normalized))?.[1] ?? "Venue";
}

function chooseContactMethod(vendor: PrivatePlanningExtractedVendor): ContactMethod {
  if (vendor.email) {
    return "Email";
  }

  if (vendor.phone) {
    return "Phone";
  }

  if (vendor.website) {
    return "Website";
  }

  return "Email";
}

export function buildPrivatePlanningVendorFromSuggestion(input: GeneratedVendorInput) {
  const vendor = sanitizePrivatePlanningExtraction({ vendor: input.vendor, document: input.document, confidence: {}, warnings: [] }).vendor;
  const document = input.document;
  const sourceParts = [
    input.sourceFilename ? `Source document: ${input.sourceFilename}.` : `Source file ID: ${input.fileId}.`,
    document?.documentType && document.documentType !== "unknown" ? `Document type: ${document.documentType}.` : "",
    document?.invoiceNumber ? `Invoice: ${document.invoiceNumber}.` : "",
    document?.receiptNumber ? `Receipt: ${document.receiptNumber}.` : "",
    document?.invoiceDate ? `Date: ${document.invoiceDate}.` : "",
    document?.dueDate ? `Due: ${document.dueDate}.` : "",
    document?.total !== null && document?.total !== undefined ? `Total detected: ${document.currency ?? ""} ${document.total}.` : "",
  ].filter(Boolean);

  return {
    id: input.id,
    category: coercePrivatePlanningVendorCategory(vendor.category),
    vendorName: vendor.name ?? "New vendor",
    contact: vendor.contactName ?? "",
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    instagram: "",
    website: vendor.website ?? "",
    contactMethod: chooseContactMethod(vendor),
    priority: "Medium",
    status: "Researching",
    contractSigned: "No",
    quote: "",
    depositPaid: "",
    balanceDue: "",
    dueDate: "",
    depositDueDate: "",
    finalPaymentDueDate: document?.dueDate ?? "",
    lastContactedDate: "",
    followUpDate: "",
    notes: sourceParts.join(" "),
    nextAction: "Review extracted vendor details.",
    filesLinks: input.sourceFilename ?? input.fileId,
    communicationLog: [],
  };
}

export function toPrivatePlanningVendorSuggestionDto(suggestion: PrivatePlanningSuggestionLike): PrivatePlanningVendorSuggestionDto {
  const sanitized = sanitizePrivatePlanningExtraction({
    vendor: suggestion.suggestedVendor,
    document: suggestion.suggestedDocument,
    confidence: suggestion.confidence,
    warnings: suggestion.warnings,
  });

  return {
    id: suggestion.id,
    fileId: suggestion.fileId,
    suggestionStatus: suggestion.suggestionStatus,
    suggestedVendor: sanitized.vendor,
    suggestedDocument: sanitized.document,
    confidence: sanitized.confidence,
    warnings: Array.isArray(suggestion.warnings) ? suggestion.warnings.filter((warning): warning is string => typeof warning === "string") : [],
    possibleMatches: Array.isArray(suggestion.possibleMatches)
      ? suggestion.possibleMatches
          .filter((match): match is PrivatePlanningVendorMatch => Boolean(match && typeof match === "object" && "id" in match))
          .slice(0, 5)
      : [],
    matchedVendorId: suggestion.matchedVendorId,
    reviewedAt: suggestion.reviewedAt?.toISOString() ?? null,
    appliedAt: suggestion.appliedAt?.toISOString() ?? null,
    dismissedAt: suggestion.dismissedAt?.toISOString() ?? null,
  };
}

export function toPrivatePlanningFileExtractionDto(
  extraction: PrivatePlanningExtractionLike,
  suggestion?: PrivatePlanningSuggestionLike | null,
): PrivatePlanningFileExtractionDto {
  const sanitized = sanitizePrivatePlanningExtraction({
    vendor: extraction.extractedVendor,
    document: extraction.extractedDocument,
    confidence: extraction.confidence,
    warnings: extraction.warnings,
  });

  return {
    id: extraction.id,
    fileId: extraction.fileId,
    extractionStatus: extraction.extractionStatus,
    extractedVendor: extraction.extractedVendor ? sanitized.vendor : null,
    extractedDocument: extraction.extractedDocument ? sanitized.document : null,
    confidence: extraction.confidence ? sanitized.confidence : null,
    warnings: Array.isArray(extraction.warnings) ? extraction.warnings.filter((warning): warning is string => typeof warning === "string") : [],
    errorMessage: extraction.errorMessage,
    matchedVendorId: extraction.matchedVendorId,
    reviewedAt: extraction.reviewedAt?.toISOString() ?? null,
    appliedAt: extraction.appliedAt?.toISOString() ?? null,
    dismissedAt: extraction.dismissedAt?.toISOString() ?? null,
    suggestion: suggestion ? toPrivatePlanningVendorSuggestionDto(suggestion) : null,
  };
}

export async function extractPrivatePlanningFileDetails({
  fileBuffer,
  filename,
  mimeType,
}: {
  fileBuffer: Buffer;
  filename: string;
  mimeType: string;
}) {
  if (!canExtractPrivatePlanningMimeType(mimeType)) {
    throw new Error("Unsupported file type for extraction.");
  }

  const base64 = fileBuffer.toString("base64");
  const isImage = mimeType.startsWith("image/");
  const filePart: ResponseInputContent = isImage
    ? {
        type: "input_image",
        image_url: `data:${mimeType};base64,${base64}`,
        detail: "high",
      }
    : {
        type: "input_file",
        filename,
        file_data: `data:${mimeType};base64,${base64}`,
      };

  const response = (await getOpenAiClient().responses.create({
    model: PRIVATE_PLANNING_EXTRACTION_MODEL,
    input: [
      {
        role: "system",
        content:
          "You extract wedding vendor and invoice details from private planning documents. Return only the requested JSON. Do not include or infer bank account numbers, card numbers, sort codes, tax IDs, passport/ID numbers, or medical/legal details.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Extract basic vendor details and document totals from this wedding invoice, receipt, quote, or contract. Use null for missing fields. If sensitive payment identifiers are visible, ignore them and add a generic warning without repeating the value.",
          },
          filePart,
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "private_planning_vendor_extraction",
        strict: true,
        schema: extractionJsonSchema,
      },
    },
  } satisfies ResponseCreateParamsNonStreaming)) as Response;
  const outputText = response.output_text;

  return sanitizePrivatePlanningExtraction(JSON.parse(outputText));
}
