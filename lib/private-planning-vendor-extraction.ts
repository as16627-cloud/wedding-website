import { privatePlanningAllowedMimeTypes } from "@/lib/private-planning-file-rules";

export const PRIVATE_PLANNING_EXTRACTION_SOURCE = "local-text-extraction-v1";
export const PRIVATE_PLANNING_MIN_EXTRACTED_TEXT_LENGTH = 24;

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

export function isPrivatePlanningExtractionConfigured() {
  return true;
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

function cleanExtractedText(value: string) {
  return value
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function hasReadablePrivatePlanningExtractedText(value: string) {
  const text = cleanExtractedText(value);

  return text.length >= PRIVATE_PLANNING_MIN_EXTRACTED_TEXT_LENGTH && /[a-z]/i.test(text);
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

const datePattern =
  /\b(?:\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{1,2}\s+(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{2,4}|(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+\d{1,2},?\s+\d{2,4})\b/i;

const moneyPattern = /(?:AUD\s*)?\$?\s*(-?\d{1,3}(?:,\d{3})*(?:\.\d{2})|-?\d+(?:\.\d{2}))/gi;
const abnPattern = /\bABN\s*[:#-]?\s*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/i;

function extractedLines(text: string) {
  return cleanExtractedText(text)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);
}

function firstPatternMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();

    if (value) {
      return value.replace(/^[#:\-\s]+|[.,;:\s]+$/g, "").slice(0, 120);
    }
  }

  return null;
}

function firstDateByLabel(lines: string[], labels: RegExp[]) {
  for (const label of labels) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (!label.test(line)) {
        continue;
      }

      const sameLine = line.match(datePattern)?.[0];
      const nextLine = lines[index + 1]?.match(datePattern)?.[0];

      if (sameLine || nextLine) {
        return (sameLine ?? nextLine ?? "").trim();
      }
    }
  }

  return null;
}

function parseMoneyValue(value: string) {
  const amount = Number.parseFloat(value.replace(/,/g, ""));

  return Number.isFinite(amount) ? amount : null;
}

function amountsInLine(line: string) {
  return Array.from(line.matchAll(moneyPattern))
    .map((match) => parseMoneyValue(match[1] ?? ""))
    .filter((amount): amount is number => amount !== null);
}

function firstAmountByLabel(lines: string[], labels: RegExp[]) {
  for (const label of labels) {
    const matches: number[] = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];

      if (!label.test(line)) {
        continue;
      }

      matches.push(...amountsInLine(line));

      if (matches.length === 0 && lines[index + 1]) {
        matches.push(...amountsInLine(lines[index + 1]));
      }
    }

    if (matches.length > 0) {
      return matches[matches.length - 1] ?? null;
    }
  }

  return null;
}

function detectDocumentType(text: string): PrivatePlanningExtractedDocument["documentType"] {
  if (/\breceipt\b/i.test(text)) {
    return "receipt";
  }

  if (/\bquote|quotation\b/i.test(text)) {
    return "quote";
  }

  if (/\bcontract|agreement\b/i.test(text)) {
    return "contract";
  }

  if (/\binvoice|tax invoice|\binv[-\s#:/]/i.test(text)) {
    return "invoice";
  }

  return "unknown";
}

function detectEmail(text: string) {
  return text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? null;
}

function detectWebsite(text: string) {
  const matches = Array.from(
    text.matchAll(/\b(?:https?:\/\/|www\.)[^\s<>()]+|\b[a-z0-9-]+\.(?:com\.au|com|net\.au|net|org\.au|org|au)(?:\/[^\s<>()]*)?/gi),
  );
  const match = matches.find((candidate) => {
    const index = candidate.index ?? 0;
    return text[index - 1] !== "@";
  })?.[0];

  return match ? match.replace(/[.,;:)]+$/g, "") : null;
}

function detectPhone(text: string) {
  const match = text.match(/\b(?:\+?61|0)[\s().-]*(?:\d[\s().-]*){8,10}\b/);

  return match?.[0]?.replace(/\s{2,}/g, " ").trim() ?? null;
}

function detectAddress(lines: string[]) {
  return (
    lines.find((line) =>
      /\d/.test(line) &&
      /\b(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|place|pl|terrace|tce|boulevard|blvd|court|ct|way|highway|hwy)\b/i.test(line) &&
      !includesSensitiveFinancialIdentifier(line),
    ) ?? null
  );
}

function detectKnownVendor(text: string, vendors: PrivatePlanningVendorRecord[]) {
  const normalizedText = normalizeText(text);

  return vendors
    .map((vendor) => {
      const vendorName = safeString(vendor.vendorName);
      const normalizedName = normalizeText(vendorName);

      return {
        vendor,
        vendorName,
        normalizedName,
        score: normalizedName && normalizedText.includes(normalizedName) ? normalizedName.length : 0,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((first, second) => second.score - first.score)[0]?.vendor;
}

function detectVendorName(lines: string[], text: string, vendors: PrivatePlanningVendorRecord[]) {
  const knownVendor = detectKnownVendor(text, vendors);

  if (knownVendor?.vendorName) {
    return safeString(knownVendor.vendorName);
  }

  const candidate = lines.slice(0, 10).find((line) => {
    if (line.length < 2 || line.length > 90 || !/[a-z]/i.test(line)) {
      return false;
    }

    return !/\b(?:tax invoice|invoice|receipt|quote|contract|abn|gst|total|amount|balance|subtotal|date|due|page|phone|email|www|http)\b/i.test(line);
  });

  return candidate ?? null;
}

function inferVendorCategory(text: string, knownVendor?: PrivatePlanningVendorRecord) {
  if (knownVendor?.category) {
    return safeString(knownVendor.category);
  }

  const normalized = normalizeText(text);
  const keywordMap: Array<[RegExp, VendorCategory]> = [
    [/venue|catering|function/, "Venue"],
    [/celebrant|officiant/, "Celebrant"],
    [/photo|portrait/, "Photography"],
    [/video|film|cinemat/, "Videography"],
    [/flor|flower|bloom|bouquet/, "Florist"],
    [/dj|music|band|entertain/, "DJ / Entertainment"],
    [/cake|dessert|bakery/, "Cake"],
    [/hair|makeup|beauty|mua/, "Hair & Makeup"],
    [/stationer|invite|print|paper/, "Stationery"],
    [/decor|hire|rental|styling|furniture/, "Decor / Hire"],
    [/transport|car|bus|limo/, "Transport"],
    [/accommodation|hotel|stay/, "Accommodation"],
    [/audio|guestbook|phone/, "Audio Guestbook"],
  ];

  return keywordMap.find(([pattern]) => pattern.test(normalized))?.[1] ?? null;
}

function detectCurrency(text: string) {
  if (/\bAUD\b|\$/i.test(text)) {
    return "AUD";
  }

  return null;
}

function textExtractionWarnings(text: string, result: PrivatePlanningExtractionResult) {
  const warnings: string[] = [];

  if (abnPattern.test(text)) {
    warnings.push("ABN detected and intentionally not stored in the vendor profile.");
  }

  if (/\b(?:bsb|account number|sort code|iban|swift|card number|credit card)\b/i.test(text)) {
    warnings.push("Sensitive payment details were detected and ignored.");
  }

  if (!result.vendor.name) {
    warnings.push("Vendor name could not be confidently detected.");
  }

  if (result.document.total === null) {
    warnings.push("Total amount could not be confidently detected.");
  }

  return warnings.slice(0, 10);
}

export function extractPrivatePlanningDetailsFromText({
  text,
  vendors = [],
}: {
  text: string;
  vendors?: PrivatePlanningVendorRecord[];
}): PrivatePlanningExtractionResult {
  if (!hasReadablePrivatePlanningExtractedText(text)) {
    throw new Error("No readable text found -- download only.");
  }

  const cleanedText = cleanExtractedText(text).slice(0, 120_000);
  const lines = extractedLines(cleanedText);
  const knownVendor = detectKnownVendor(cleanedText, vendors);
  const vendorName = detectVendorName(lines, cleanedText, vendors);
  const email = detectEmail(cleanedText);
  const phone = detectPhone(cleanedText);
  const website = detectWebsite(cleanedText);
  const invoiceNumber = firstPatternMatch(cleanedText, [
    /\b(?:invoice|inv)\s*(?:number|no\.?|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{1,})\b/i,
    /\bINV[-\s#:/]*([A-Z0-9][A-Z0-9/_-]{2,})\b/i,
  ]);
  const receiptNumber = firstPatternMatch(cleanedText, [
    /\breceipt\s*(?:number|no\.?|#)\s*[:#-]?\s*([A-Z0-9][A-Z0-9/_-]{1,})\b/i,
    /\bRCPT[-\s#:/]*([A-Z0-9][A-Z0-9/_-]{2,})\b/i,
  ]);
  const invoiceDate = firstDateByLabel(lines, [/\binvoice\s*date\b/i, /\bdate\s*issued\b/i, /\bissue\s*date\b/i, /\bdate\b/i]);
  const dueDate = firstDateByLabel(lines, [/\bdue\s*date\b/i, /\bpayment\s*due\b/i, /\bdue\b/i]);
  const subtotal = firstAmountByLabel(lines, [/\bsub\s*total\b/i, /\bsubtotal\b/i]);
  const tax = firstAmountByLabel(lines, [/\bgst\b/i, /\btax\b/i]);
  const total = firstAmountByLabel(lines, [
    /\bamount\s*due\b/i,
    /\bbalance\s*due\b/i,
    /\binvoice\s*total\b/i,
    /\bgrand\s*total\b/i,
    /\bgst\s*total\b/i,
    /\btotal\s*(?:aud)?\b/i,
  ]);
  const result = sanitizePrivatePlanningExtraction({
    vendor: {
      name: vendorName,
      category: inferVendorCategory(`${cleanedText} ${vendorName ?? ""}`, knownVendor),
      contactName: firstPatternMatch(cleanedText, [/\b(?:attn|attention|contact)\s*[:#-]\s*([A-Z][A-Z .'-]{1,80})/i]),
      email,
      phone,
      website,
      address: detectAddress(lines),
    },
    document: {
      documentType: detectDocumentType(cleanedText),
      invoiceNumber,
      receiptNumber,
      invoiceDate,
      dueDate,
      subtotal,
      tax,
      total,
      currency: detectCurrency(cleanedText),
    },
    confidence: {
      vendor: knownVendor ? 0.86 : vendorName ? 0.58 : 0,
      contact: Math.min(1, [email, phone, website].filter(Boolean).length / 3 + 0.15),
      amounts: total !== null ? 0.78 : subtotal !== null || tax !== null ? 0.42 : 0,
      dates: invoiceDate || dueDate ? 0.72 : 0,
    },
    warnings: [],
  });

  return {
    ...result,
    warnings: textExtractionWarnings(cleanedText, result),
  };
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
