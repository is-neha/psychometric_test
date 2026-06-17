import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function wrap(text: string, max = 88) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    if (!paragraph.trim()) { lines.push(""); continue; }
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      if (`${line} ${word}`.trim().length > max) {
        lines.push(line);
        line = word;
      } else line = `${line} ${word}`.trim();
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function GET(_: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const user = await currentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { attemptId } = await params;
  const attempt = await db.attempt.findUnique({ where: { id: attemptId }, include: { user: true, questionnaire: true, report: true } });
  if (!attempt?.report || (user.role !== "ADMIN" && (attempt.userId !== user.id || attempt.report.status !== "PUBLISHED"))) {
    return new Response("Report unavailable", { status: 404 });
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const margin = 52;
  const addPage = () => { page = pdf.addPage([595, 842]); y = 790; };
  page.drawText("PSYCHOMETRIC TEST", { x: margin, y, size: 11, font: bold, color: rgb(0.02, 0.35, 0.25) });
  y -= 30;
  page.drawText("Psychometric Assessment Report", { x: margin, y, size: 22, font: bold });
  y -= 25;
  page.drawText(`User: ${attempt.user.username}`, { x: margin, y, size: 10, font });
  y -= 15;
  page.drawText(`Assessment: ${attempt.questionnaire.title}`, { x: margin, y, size: 10, font });
  y -= 15;
  page.drawText(`Published: ${attempt.report.publishedAt?.toLocaleDateString() || ""}`, { x: margin, y, size: 10, font });
  y -= 28;

  for (const line of wrap(attempt.report.adminContent || "")) {
    if (y < 55) addPage();
    page.drawText(line.replace(/[^\x20-\x7E]/g, ""), { x: margin, y, size: 10, font, maxWidth: 490 });
    y -= line ? 15 : 9;
  }
  if (y < 90) addPage();
  y -= 15;
  page.drawText("This report is non-diagnostic and should be interpreted with appropriate guidance.", { x: margin, y, size: 8, font, color: rgb(0.35, 0.4, 0.38) });
  y -= 14;
  page.drawText(`${process.env.ORGANIZATION_NAME || ""} ${process.env.ORGANIZATION_CONTACT || ""}`.trim(), { x: margin, y, size: 8, font });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="psychometric-report-${attempt.user.username}.pdf"`,
    },
  });
}
