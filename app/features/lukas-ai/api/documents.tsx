import { data } from "react-router";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireUser } from "~/core/lib/guards.server";
import db from "~/core/db/drizzle-client.server";
import {
  companyDocuments,
  documentChunks,
  documentQA,
  knowledgeBase,
} from "../schema";

export async function loader({ request }: any) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const isPrivate = url.searchParams.get("isPrivate") === "true";
  
  // Build where conditions
  const conditions = [eq(companyDocuments.userId, user.id)];
  
  if (search) {
    conditions.push(eq(companyDocuments.title, search));
  }

  if (isPrivate !== null) {
    conditions.push(eq(companyDocuments.isPrivate, isPrivate));
  }

  // Get documents
  const documents = await db
    .select({
      id: companyDocuments.id,
      title: companyDocuments.title,
      description: companyDocuments.description,
      fileName: companyDocuments.fileName,
      fileSize: companyDocuments.fileSize,
      fileType: companyDocuments.fileType,
      fileUrl: companyDocuments.fileUrl,
      content: companyDocuments.content,
      status: companyDocuments.status,
      isPrivate: companyDocuments.isPrivate,
      created_at: companyDocuments.created_at,
      updated_at: companyDocuments.updated_at,
    })
    .from(companyDocuments)
    .where(and(...conditions))
    .orderBy(companyDocuments.created_at);

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
    .orderBy(knowledgeBase.created_at);

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
    .orderBy(documentQA.created_at)
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
      const isPrivate = formData.get("isPrivate") === "true";

      await db
        .insert(companyDocuments)
        .values({
          userId: user.id,
          title,
          description,
          fileName,
          fileSize,
          fileType,
          fileUrl,
          isPrivate,
        });

      return data({ success: true });
    }

    case "add_knowledge": {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const tags = formData.get("tags") ? JSON.parse(formData.get("tags") as string) : null;
      const sourceDocuments = formData.get("sourceDocuments") ? JSON.parse(formData.get("sourceDocuments") as string) : null;

      await db
        .insert(knowledgeBase)
        .values({
          userId: user.id,
          title,
          content: description,
          tags,
          sourceDocuments,
        });

      return data({ success: true });
    }

    case "ask_question": {
      const question = formData.get("question") as string;
      const documentId = formData.get("documentId") as string;
      const answer = formData.get("answer") as string;
      const confidence = parseFloat(formData.get("confidence") as string) || 0;
      const sources = formData.get("sources") ? JSON.parse(formData.get("sources") as string) : null;

      await db
        .insert(documentQA)
        .values({
          userId: user.id,
          question,
          answer,
          documentId,
          confidence,
          sourceChunks: sources,
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