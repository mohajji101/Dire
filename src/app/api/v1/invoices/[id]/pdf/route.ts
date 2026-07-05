import { apiError } from "@/lib/api-responses";
import { getInvoiceDetail } from "@/lib/supabase/dire-data";

type RouteProps = {
  params: Promise<{ id: string }>;
};

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildSimplePdf(lines: string[]) {
  const textCommands = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${780 - index * 18} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const content = `q\n${textCommands}\nQ`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export async function GET(_: Request, { params }: RouteProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);

  if (!detail) {
    return apiError("NOT_FOUND", "Invoice not found.", 404);
  }

  const { invoice, lines, payments } = detail;
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = invoice.totalAmount - paidAmount;
  const pdf = buildSimplePdf([
    `Dire Cargo Invoice ${invoice.invoiceNumber}`,
    "",
    `Customer: ${invoice.customerName}`,
    `Customer Code: ${invoice.customerCode}`,
    `Shipment: ${invoice.trackingNumber}`,
    `Created: ${invoice.createdAt}`,
    `Due: ${invoice.dueDate}`,
    `Status: ${invoice.status}`,
    "",
    ...lines.map(
      (line) =>
        `${line.label}: ${invoice.currency} ${line.amount}${line.includedInTotal === false ? " (excluded from total)" : ""}`,
    ),
    `Total: ${invoice.currency} ${invoice.totalAmount}`,
    `Paid: ${invoice.currency} ${paidAmount}`,
    `Balance: ${invoice.currency} ${balance}`,
  ]);

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
