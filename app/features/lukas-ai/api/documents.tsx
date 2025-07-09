import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/core/db/drizzle-client.server";
import { requireUser } from "~/core/lib/guards.server";
import { companyDocuments, documentChunks, documentQA, knowledgeBase } from "~/features/lukas-ai/schema";

// Document upload schema
const uploadDocumentSchema = z.object({
  title: z.string().min(1, "문서 제목을 입력해주세요"),
  description: z.string().optional(),
  fileName: z.string().min(1, "파일명이 필요합니다"),
  fileSize: z.number().optional(),
  fileType: z.string().min(1, "파일 타입이 필요합니다"),
  fileUrl: z.string().optional(),
  content: z.string().optional(),
  isPrivate: z.boolean().default(true),
});

// Document Q&A schema
const documentQASchema = z.object({
  documentId: z.string().uuid("유효한 문서 ID가 필요합니다"),
  question: z.string().min(1, "질문을 입력해주세요"),
});

// Knowledge base entry schema
const knowledgeBaseSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sourceDocuments: z.array(z.string()).optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Get user's documents
  const documents = await db
    .select()
    .from(companyDocuments)
    .where(eq(companyDocuments.userId, user.id))
    .orderBy(desc(companyDocuments.createdAt));

  // Get user's knowledge base entries
  const knowledgeEntries = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, user.id))
    .orderBy(desc(knowledgeBase.createdAt));

  return json({
    documents,
    knowledgeEntries,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "upload-document": {
        const data = uploadDocumentSchema.parse({
          title: formData.get("title"),
          description: formData.get("description"),
          fileName: formData.get("fileName"),
          fileSize: formData.get("fileSize") ? Number(formData.get("fileSize")) : undefined,
          fileType: formData.get("fileType"),
          fileUrl: formData.get("fileUrl"),
          content: formData.get("content"),
          isPrivate: formData.get("isPrivate") === "true",
        });

        const [document] = await db
          .insert(companyDocuments)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, document });
      }

      case "delete-document": {
        const documentId = formData.get("documentId") as string;
        
        await db
          .delete(companyDocuments)
          .where(eq(companyDocuments.id, documentId));

        return json({ success: true });
      }

      case "ask-question": {
        const data = documentQASchema.parse({
          documentId: formData.get("documentId"),
          question: formData.get("question"),
        });

        // Get document content
        const [document] = await db
          .select()
          .from(companyDocuments)
          .where(eq(companyDocuments.id, data.documentId));

        if (!document) {
          return json({ error: "문서를 찾을 수 없습니다" }, { status: 404 });
        }

        // Simulate AI answer (in real implementation, this would use AI service)
        const answer = `문서 "${document.title}"에 대한 질문: "${data.question}"\n\nAI 답변: 이 문서의 내용을 바탕으로 한 답변입니다. 실제 구현에서는 AI 서비스를 통해 정확한 답변을 생성합니다.`;

        const [qa] = await db
          .insert(documentQA)
          .values({
            userId: user.id,
            documentId: data.documentId,
            question: data.question,
            answer,
            confidence: 85,
          })
          .returning();

        return json({ success: true, qa });
      }

      case "create-knowledge-entry": {
        const data = knowledgeBaseSchema.parse({
          title: formData.get("title"),
          content: formData.get("content"),
          category: formData.get("category"),
          tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : undefined,
          sourceDocuments: formData.get("sourceDocuments") ? JSON.parse(formData.get("sourceDocuments") as string) : undefined,
        });

        const [entry] = await db
          .insert(knowledgeBase)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, entry });
      }

      case "delete-knowledge-entry": {
        const entryId = formData.get("entryId") as string;
        
        await db
          .delete(knowledgeBase)
          .where(eq(knowledgeBase.id, entryId));

        return json({ success: true });
      }

      default:
        return json({ error: "알 수 없는 액션입니다" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({ error: error.errors[0]?.message || "입력 데이터가 유효하지 않습니다" }, { status: 400 });
    }
    return json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

export function useDocumentsData() {
  return useLoaderData<typeof loader>();
} 