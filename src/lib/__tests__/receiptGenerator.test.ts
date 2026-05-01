import { describe, it, expect } from "vitest";
import { amountInWords, generateReceiptHTML, ReceiptData } from "../receiptGenerator";

describe("amountInWords", () => {
  it("converts zero", () => {
    expect(amountInWords(0)).toBe("Rupees Zero Only");
  });

  it("converts single digits", () => {
    expect(amountInWords(5)).toBe("Rupees Five Only");
  });

  it("converts teens", () => {
    expect(amountInWords(17)).toBe("Rupees Seventeen Only");
  });

  it("converts tens", () => {
    expect(amountInWords(50)).toBe("Rupees Fifty Only");
  });

  it("converts hundreds", () => {
    expect(amountInWords(500)).toBe("Rupees Five Hundred Only");
  });

  it("converts hundreds with remainder", () => {
    expect(amountInWords(123)).toBe("Rupees One Hundred and Twenty-Three Only");
  });

  it("converts thousands", () => {
    expect(amountInWords(5000)).toBe("Rupees Five Thousand Only");
  });

  it("converts lakhs", () => {
    expect(amountInWords(150000)).toBe("Rupees One Lakh Fifty Thousand Only");
  });

  it("converts crores", () => {
    expect(amountInWords(10000000)).toBe("Rupees One Crore Only");
  });

  it("handles paise", () => {
    expect(amountInWords(100.50)).toBe("Rupees One Hundred and Fifty Paise Only");
  });

  it("handles complex amounts", () => {
    const result = amountInWords(1234);
    expect(result).toBe("Rupees One Thousand Two Hundred and Thirty-Four Only");
  });
});

describe("generateReceiptHTML", () => {
  const baseData: ReceiptData = {
    receiptNumber: "DF-2024-001",
    date: "2024-01-15",
    donorName: "Ramesh Kumar",
    amount: 5000,
    orderId: "abc12345-defg-hijk",
  };

  it("includes receipt number", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).toContain("DF-2024-001");
  });

  it("includes donor name", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).toContain("Ramesh Kumar");
  });

  it("includes formatted amount", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).toContain("₹5,000");
  });

  it("includes amount in words", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).toContain("Rupees Five Thousand Only");
  });

  it("includes order reference (first 8 chars uppercase)", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).toContain("ABC12345");
  });

  it("includes email when provided", () => {
    const html = generateReceiptHTML({ ...baseData, donorEmail: "r@test.com" });
    expect(html).toContain("r@test.com");
  });

  it("excludes email row when not provided", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).not.toContain("<td>Email</td>");
  });

  it("includes PAN when provided", () => {
    const html = generateReceiptHTML({ ...baseData, donorPan: "abcde1234f" });
    expect(html).toContain("ABCDE1234F");
  });

  it("excludes PAN row when not provided", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).not.toContain("<td>PAN</td>");
  });

  it("includes 80G section reference", () => {
    const html = generateReceiptHTML(baseData);
    expect(html).toContain("Section 80G");
  });
});
