"use server";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateAiDraft } from "@/lib/ai";
import { clearSession, createSession, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateScores } from "@/lib/scoring";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const user = await db.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/login?error=Invalid%20username%20or%20password");
  }
  await createSession(user.id);
  await db.auditLog.create({ data: { userId: user.id, action: "LOGIN" } });
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function acceptConsentAction() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { consentAt: new Date() } });
  await db.auditLog.create({ data: { userId: user.id, action: "CONSENT_ACCEPTED" } });
  revalidatePath("/dashboard");
}

export async function startAttemptAction(questionnaireId: string) {
  const user = await requireUser(Role.USER);
  if (!user.consentAt) redirect("/dashboard");
  const attempt = await db.attempt.create({
    data: {
      userId: user.id,
      questionnaireId,
      status: "IN_PROGRESS",
    },
  });
  return attempt.id;
}

export async function saveResponseAction(attemptId: string, questionId: string, optionId: string) {
  const user = await requireUser(Role.USER);
  const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.userId !== user.id || attempt.status !== "IN_PROGRESS") {
    throw new Error("Invalid attempt");
  }
  const option = await db.option.findUnique({
    where: { id: optionId },
    include: { question: true },
  });
  if (!option || option.questionId !== questionId) throw new Error("Invalid option");

  await db.response.upsert({
    where: {
      attemptId_questionId: { attemptId, questionId },
    },
    update: {
      optionId: option.id,
      optionText: option.text,
      scoringSnapshot: option.scoringJson,
    },
    create: {
      attemptId,
      questionId,
      optionId: option.id,
      questionText: option.question.text,
      optionText: option.text,
      scoringSnapshot: option.scoringJson,
    },
  });
}

export async function completeAttemptAction(attemptId: string) {
  const user = await requireUser(Role.USER);
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { responses: true, questionnaire: { include: { sections: { include: { questions: true } } } } },
  });
  if (!attempt || attempt.userId !== user.id || attempt.status !== "IN_PROGRESS") {
    throw new Error("Invalid attempt");
  }

  const totalQuestions = attempt.questionnaire.sections.reduce((acc, s) => acc + s.questions.length, 0);
  if (attempt.responses.length < totalQuestions) {
    throw new Error("Please answer all questions before submitting.");
  }

  const scores = calculateScores(attempt.responses.map(r => r.scoringSnapshot));

  await db.attempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      scoresJson: JSON.stringify(scores),
    },
  });

  await db.auditLog.create({
    data: { userId: user.id, action: "ATTEMPT_SUBMITTED", details: attemptId },
  });

  redirect(`/attempts/${attemptId}`);
}

export async function createAccountAction(formData: FormData) {
  const admin = await requireUser(Role.ADMIN);
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role")) === "ADMIN" ? "ADMIN" : "USER";
  if (username.length < 3 || password.length < 8) {
    throw new Error("Username must be 3+ characters and password 8+ characters.");
  }
  await db.user.create({
    data: { username, passwordHash: await bcrypt.hash(password, 12), role },
  });
  await db.auditLog.create({
    data: { userId: admin.id, action: "ACCOUNT_CREATED", details: `${username}:${role}` },
  });
  revalidatePath("/admin");
}

export async function deleteUserHistoryAction(formData: FormData) {
  const admin = await requireUser(Role.ADMIN);
  const userId = String(formData.get("userId"));
  await db.attempt.deleteMany({ where: { userId } });
  await db.auditLog.create({
    data: { userId: admin.id, action: "USER_HISTORY_DELETED", details: userId },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${userId}`);
}

export async function createQuestionnaireAction(formData: FormData) {
  await requireUser(Role.ADMIN);
  const questionnaire = await db.questionnaire.create({
    data: {
      title: String(formData.get("title") || "Untitled questionnaire").trim(),
      audience: String(formData.get("audience") || "General").trim(),
      description: String(formData.get("description") || "").trim(),
      sections: {
        create: {
          title: String(formData.get("section") || "Main section").trim(),
          position: 1,
        },
      },
    },
  });
  redirect(`/admin/questionnaires/${questionnaire.id}`);
}

export async function addQuestionAction(formData: FormData) {
  await requireUser(Role.ADMIN);
  const questionnaireId = String(formData.get("questionnaireId"));
  const sectionId = String(formData.get("sectionId"));
  const optionLines = String(formData.get("options") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const count = await db.question.count({ where: { sectionId } });
  await db.question.create({
    data: {
      sectionId,
      text: String(formData.get("text") || "").trim(),
      model: String(formData.get("model") || "GENERAL").trim().toUpperCase(),
      trait: String(formData.get("trait") || "").trim(),
      position: count + 1,
      options: {
        create: optionLines.map((line, index) => {
          const [label, text, scoringJson = "{}", adminNote = ""] = line.split("|");
          JSON.parse(scoringJson);
          return {
            label: label?.trim() || String.fromCharCode(65 + index),
            text: text?.trim() || "Option",
            scoringJson: scoringJson.trim(),
            adminNote: adminNote.trim(),
            position: index + 1,
          };
        }),
      },
    },
  });
  revalidatePath(`/admin/questionnaires/${questionnaireId}`);
}

export async function importQuestionnaireAction(formData: FormData) {
  await requireUser(Role.ADMIN);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Select an Excel file.");
  const workbook = new ExcelJS.Workbook();
  const excelBuffer = Buffer.from(
    await file.arrayBuffer(),
  ) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(excelBuffer);
  const sheet = workbook.worksheets[0];
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, col) => headers.set(String(cell.value).trim(), col));
  const value = (row: ExcelJS.Row, name: string) =>
    String(row.getCell(headers.get(name) || 0).value || "").trim();

  const rows: Array<Record<string, string>> = [];
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    rows.push({
      title: value(row, "Questionnaire"),
      audience: value(row, "Audience"),
      section: value(row, "Section"),
      model: value(row, "Model"),
      trait: value(row, "Trait"),
      question: value(row, "Question"),
      label: value(row, "Option Label"),
      option: value(row, "Option Text"),
      scoring: value(row, "Scoring JSON"),
      note: value(row, "Admin Note"),
    });
  });
  if (!rows.length) throw new Error("The spreadsheet has no questionnaire rows.");

  const questionnaire = await db.questionnaire.create({
    data: {
      title: rows[0].title || file.name.replace(/\.[^.]+$/, ""),
      audience: rows[0].audience || "General",
    },
  });
  const sections = [...new Set(rows.map((row) => row.section || "Main section"))];
  for (const [sectionIndex, sectionName] of sections.entries()) {
    const section = await db.section.create({
      data: { questionnaireId: questionnaire.id, title: sectionName, position: sectionIndex + 1 },
    });
    const sectionRows = rows.filter((row) => (row.section || "Main section") === sectionName);
    const questions = [...new Set(sectionRows.map((row) => row.question))].filter(Boolean);
    for (const [questionIndex, questionText] of questions.entries()) {
      const questionRows = sectionRows.filter((row) => row.question === questionText);
      await db.question.create({
        data: {
          sectionId: section.id,
          text: questionText,
          model: questionRows[0].model || "GENERAL",
          trait: questionRows[0].trait,
          position: questionIndex + 1,
          options: {
            create: questionRows.map((row, optionIndex) => {
              JSON.parse(row.scoring || "{}");
              return {
                label: row.label || String.fromCharCode(65 + optionIndex),
                text: row.option,
                scoringJson: row.scoring || "{}",
                adminNote: row.note,
                position: optionIndex + 1,
              };
            }),
          },
        },
      });
    }
  }
  redirect(`/admin/questionnaires/${questionnaire.id}`);
}

export async function generateDraftAction(formData: FormData) {
  const admin = await requireUser(Role.ADMIN);
  const attemptId = String(formData.get("attemptId"));
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { user: true },
  });
  if (!attempt?.scoresJson) throw new Error("Scores are unavailable.");
  const aiDraft = await generateAiDraft(attempt.user.username, JSON.parse(attempt.scoresJson));
  await db.report.upsert({
    where: { attemptId },
    update: { aiDraft, adminContent: aiDraft, reviewerId: admin.id, status: "DRAFT" },
    create: {
      attemptId,
      subjectId: attempt.userId,
      reviewerId: admin.id,
      aiDraft,
      adminContent: aiDraft,
    },
  });
  revalidatePath(`/admin/attempts/${attemptId}`);
}

export async function saveReportAction(formData: FormData) {
  const admin = await requireUser(Role.ADMIN);
  const attemptId = String(formData.get("attemptId"));
  const status = String(formData.get("intent")) === "publish" ? "PUBLISHED" : "REVIEWED";
  await db.report.update({
    where: { attemptId },
    data: {
      adminContent: String(formData.get("content") || ""),
      reviewerId: admin.id,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
  await db.auditLog.create({
    data: { userId: admin.id, action: `REPORT_${status}`, details: attemptId },
  });
  revalidatePath(`/admin/attempts/${attemptId}`);
  revalidatePath(`/attempts/${attemptId}`);
}
