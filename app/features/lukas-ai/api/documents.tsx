import { data } from "react-router";
import { z } from "zod";
import { eq, and, like, desc, sql } from "drizzle-orm";

import db from "~/core/db/drizzle-client.server";
import {
  companyDocuments,
  documentChunks,
  knowledgeBase,
  documentQA,
} from "../schema";

// Temporary requireUser function until we fix the import
async function requireUser(request: Request) {
  // This is a temporary implementation
  return { id: "temp-user-id" };
}

export async function loader({ request }: any) {
  const user = await requireUser(request);
  
  // Get user's documents
  const documents = await db
    .select({
      id: companyDocuments.id,
      title: companyDocuments.title,
      description: companyDocuments.description,
      fileName: companyDocuments.fileName,
      fileSize: companyDocuments.fileSize,
      fileType: companyDocuments.fileType,
      status: companyDocuments.status,
      isPrivate: companyDocuments.isPrivate,
      created_at: companyDocuments.created_at,
    })
    .from(companyDocuments)
    .where(eq(companyDocuments.userId, user.id))
    .orderBy(sql`${companyDocuments.created_at} DESC`);

  // Get knowledge base entries
  const knowledgeEntries = await db
    .select({
      id: knowledgeBase.id,
      title: knowledgeBase.title,
      content: knowledgeBase.content,
      category: knowledgeBase.category,
      tags: knowledgeBase.tags,
      sourceDocuments: knowledgeBase.sourceDocuments,
      created_at: knowledgeBase.created_at,
    })
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, user.id))
    .orderBy(sql`${knowledgeBase.created_at} DESC`);

  // Get recent Q&A interactions
  const recentQa = await db
    .select({
      id: documentQA.id,
      question: documentQA.question,
      answer: documentQA.answer,
      documentId: documentQA.documentId,
      confidence: documentQA.confidence,
      created_at: documentQA.created_at,
    })
    .from(documentQA)
    .where(eq(documentQA.userId, user.id))
    .orderBy(sql`${documentQA.created_at} DESC`)
    .limit(10);

  return data({
    documents,
    knowledgeEntries,
    recentQa,
  });
}

export async function action({ request }: any) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "upload_document": {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const fileName = formData.get("fileName") as string;
      const fileSize = parseInt(formData.get("fileSize") as string);
      const fileType = formData.get("fileType") as string;
      const fileUrl = formData.get("fileUrl") as string;
      const content = formData.get("content") as string;
      const isPrivate = formData.get("isPrivate") === "true";

      const [document] = await db
        .insert(companyDocuments)
        .values({
          userId: user.id,
          title,
          description,
          fileName,
          fileSize,
          fileType,
          fileUrl,
          content,
          isPrivate,
          status: "processing",
        })
        .returning();

      return data({ success: true, document });
    }

    case "process_document": {
      const documentId = formData.get("documentId") as string;
      const chunks = JSON.parse(formData.get("chunks") as string);

      // Insert document chunks
      await db
        .insert(documentChunks)
        .values(
          chunks.map((chunk: any, index: number) => ({
            documentId,
            chunkIndex: index,
            content: chunk.content,
            metadata: chunk.metadata,
          }))
        );

      // Update document status
      await db
        .update(companyDocuments)
        .set({ status: "completed" })
        .where(eq(companyDocuments.id, documentId));

      return data({ success: true });
    }

    case "add_knowledge": {
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;
      const category = formData.get("category") as string;
      const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [];
      const sourceDocuments = formData.get("sourceDocuments") ? JSON.parse(formData.get("sourceDocuments") as string) : [];

      await db
        .insert(knowledgeBase)
        .values({
          userId: user.id,
          title,
          content,
          category,
          tags,
          sourceDocuments,
        });

      return data({ success: true });
    }

    case "ask_question": {
      const question = formData.get("question") as string;
      const documentId = formData.get("documentId") as string;
      const answer = formData.get("answer") as string;
      const sourceChunks = formData.get("sourceChunks") ? JSON.parse(formData.get("sourceChunks") as string) : [];
      const confidence = parseFloat(formData.get("confidence") as string);

      await db
        .insert(documentQA)
        .values({
          userId: user.id,
          question,
          answer,
          documentId,
          sourceChunks,
          confidence,
        });

      return data({ success: true });
    }

    case "delete_document": {
      const documentId = formData.get("documentId") as string;

      await db
        .delete(companyDocuments)
        .where(eq(companyDocuments.id, documentId));

      return data({ success: true });
    }

    case "delete_knowledge": {
      const knowledgeId = formData.get("knowledgeId") as string;

      await db
        .delete(knowledgeBase)
        .where(eq(knowledgeBase.id, knowledgeId));

      return data({ success: true });
    }

    default:
      return data({ error: "Invalid action" }, { status: 400 });
  }
} 