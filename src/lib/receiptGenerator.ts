const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + numberToWords(-num);

  let words = "";
  if (Math.floor(num / 10000000) > 0) {
    words += numberToWords(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    words += numberToWords(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    words += numberToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    words += ones[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num > 0) {
    if (words !== "") words += "and ";
    if (num < 20) {
      words += ones[num];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) words += "-" + ones[num % 10];
    }
  }
  return words.trim();
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = "Rupees " + numberToWords(rupees);
  if (paise > 0) result += " and " + numberToWords(paise) + " Paise";
  result += " Only";
  return result;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  donorName: string;
  donorEmail?: string;
  donorPan?: string;
  amount: number;
  orderId: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
  return `
<!DOCTYPE html>
<html>
<head>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Georgia', serif; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #b45309; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; color: #b45309; margin: 0; }
  .header p { font-size: 12px; color: #666; margin: 5px 0; }
  .receipt-title { text-align: center; font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 20px 0; text-transform: uppercase; letter-spacing: 2px; }
  .section-80g { text-align: center; font-size: 11px; color: #b45309; margin-bottom: 20px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  td { padding: 10px 15px; font-size: 14px; border-bottom: 1px solid #eee; }
  td:first-child { font-weight: bold; color: #444; width: 40%; }
  .amount-row td { font-size: 18px; color: #b45309; font-weight: bold; border-bottom: 2px solid #b45309; }
  .amount-words { font-style: italic; font-size: 13px; color: #666; padding: 10px 15px; }
  .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
  .stamp { text-align: center; }
  .stamp p { font-size: 11px; color: #888; margin: 5px 0; }
  .stamp .line { width: 180px; border-top: 1px solid #999; margin: 0 auto; }
  .legal { text-align: center; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Dhyan Foundation</h1>
    <p>Registered Charitable Trust</p>
    <p>PAN: AAATD4460P | 80G Registration: AAATD4460PF2021A01</p>
  </div>
  <div class="receipt-title">Donation Receipt</div>
  <div class="section-80g">Tax Exemption under Section 80G of the Income Tax Act, 1961</div>
  <table>
    <tr><td>Receipt No.</td><td>${data.receiptNumber}</td></tr>
    <tr><td>Date</td><td>${data.date}</td></tr>
    <tr><td>Donor Name</td><td>${data.donorName}</td></tr>
    ${data.donorEmail ? `<tr><td>Email</td><td>${data.donorEmail}</td></tr>` : ""}
    ${data.donorPan ? `<tr><td>PAN</td><td>${data.donorPan.toUpperCase()}</td></tr>` : ""}
    <tr class="amount-row"><td>Amount (₹)</td><td>₹${data.amount.toLocaleString("en-IN")}</td></tr>
  </table>
  <div class="amount-words">${amountInWords(data.amount)}</div>
  <div class="footer">
    <div></div>
    <div class="stamp">
      <div class="line"></div>
      <p>Authorized Signatory</p>
      <p>Dhyan Foundation</p>
    </div>
  </div>
  <div class="legal">
    This receipt is issued for the purpose of claiming tax exemption under Section 80G of the Income Tax Act, 1961.
    <br/>Order Reference: ${data.orderId.slice(0, 8).toUpperCase()}
  </div>
</body>
</html>`;
}

export function downloadReceipt(data: ReceiptData) {
  const html = generateReceiptHTML(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
