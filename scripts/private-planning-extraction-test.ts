import assert from "node:assert/strict";
import {
  buildPrivatePlanningVendorFromSuggestion,
  coercePrivatePlanningVendorCategory,
  findPrivatePlanningVendorMatches,
  sanitizePrivatePlanningExtraction,
} from "../lib/private-planning-vendor-extraction";

const extracted = sanitizePrivatePlanningExtraction({
  vendor: {
    name: "Bloom & Branch Floral Ltd",
    category: "flowers",
    contactName: "Maya",
    email: "hello@bloombranch.com",
    phone: "+61 400 111 222",
    website: "https://www.bloombranch.com/invoices",
    address: "12 Garden Lane",
  },
  document: {
    documentType: "invoice",
    invoiceNumber: "INV-42",
    receiptNumber: null,
    invoiceDate: "2026-02-01",
    dueDate: "2026-03-01",
    subtotal: 1000,
    tax: 100,
    total: 1100,
    currency: "aud",
  },
  confidence: {
    vendor: 0.9,
    contact: 0.8,
    amounts: 0.7,
    dates: 0.6,
  },
  warnings: [],
});

assert.equal(extracted.vendor.name, "Bloom & Branch Floral Ltd");
assert.equal(extracted.document.currency, "AUD");
assert.equal(extracted.document.total, 1100);

const matches = findPrivatePlanningVendorMatches(extracted.vendor, [
  {
    id: "vendor-bloom",
    vendorName: "Bloom and Branch Floral",
    category: "Florist",
    email: "hello@bloombranch.com",
    phone: "+61 400 111 222",
    website: "bloombranch.com",
  },
  {
    id: "vendor-other",
    vendorName: "Other Vendor",
    category: "Cake",
  },
]);

assert.equal(matches[0]?.id, "vendor-bloom", "duplicate vendor matching should prefer exact contact/domain matches");
assert.ok(matches[0].score >= 1, "matched vendor should have a strong score");

const sensitive = sanitizePrivatePlanningExtraction({
  vendor: {
    name: "Sensitive Vendor",
    email: "account number 12345678",
    phone: "4111 1111 1111 1111",
    website: "https://safevendor.example",
    address: "BSB 123-456",
  },
  document: {
    documentType: "receipt",
    invoiceNumber: "ABN 11 222 333 444",
    total: "250.50",
    currency: "AUD",
  },
  confidence: {},
  warnings: ["bank details ignored"],
});

assert.equal(sensitive.vendor.email, null, "bank account-like values should not be stored as contact fields");
assert.equal(sensitive.vendor.phone, null, "card-like values should not be stored as phone fields");
assert.equal(sensitive.vendor.address, null, "bank routing details should not be stored as address fields");
assert.equal(sensitive.document.invoiceNumber, null, "tax identifiers should not be stored as invoice numbers");
assert.equal(sensitive.document.total, 250.5);

assert.equal(coercePrivatePlanningVendorCategory("floral design"), "Florist");
assert.equal(coercePrivatePlanningVendorCategory("wedding cinematography"), "Videography");

const generatedVendor = buildPrivatePlanningVendorFromSuggestion({
  id: "vendor-generated",
  vendor: extracted.vendor,
  document: extracted.document,
  fileId: "file-123",
  sourceFilename: "bloom-invoice.pdf",
});

assert.equal(generatedVendor.id, "vendor-generated");
assert.equal(generatedVendor.category, "Florist");
assert.equal(generatedVendor.vendorName, "Bloom & Branch Floral Ltd");
assert.equal(generatedVendor.email, "hello@bloombranch.com");
assert.match(generatedVendor.notes, /Source document: bloom-invoice\.pdf\./);
assert.doesNotMatch(generatedVendor.notes, /account|card|bsb/i, "generated vendor notes should avoid sensitive payment fields");

console.log("private planning extraction helper checks passed");
