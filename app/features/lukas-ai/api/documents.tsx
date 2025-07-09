import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq, desc, and, gte, lte, sum, count, avg } from "drizzle-orm";
import { z } from "zod";

import db from "~/core/db/drizzle-client.server";
import { requireUser } from "~/core/lib/guards.server";
import { 
  companyDocuments, 
  documentChunks, 
  documentQA, 
  knowledgeBase 
} from "~/features/lukas-ai/schema";

// Document upload schema
const documentUploadSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().optional(),
  fileUrl: z.string().url("파일 URL을 입력해주세요"),
  fileType: z.string().min(1, "파일 타입을 입력해주세요"),
  fileSize: z.number().min(1, "파일 크기를 입력해주세요"),
  isPrivate: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

// Document chunk schema
const documentChunkSchema = z.object({
  documentId: z.string().min(1, "문서 ID를 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요"),
  chunkIndex: z.number().min(0, "청크 인덱스를 입력해주세요"),
  embedding: z.array(z.number()).optional(),
});

// Knowledge base schema
const knowledgeBaseSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().min(1, "설명을 입력해주세요"),
  sourceDocuments: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const type = url.searchParams.get("type");
  
  // Get user's documents
  let documentsQuery = db
    .select()
    .from(companyDocuments)
    .where(eq(companyDocuments.userId, user.id))
    .orderBy(desc(companyDocuments.created_at));

  if (search) {
    documentsQuery = documentsQuery.where(
      // Add search functionality here
      eq(companyDocuments.title, search)
    );
  }

  if (type) {
    documentsQuery = documentsQuery.where(
      eq(companyDocuments.fileType, type)
    );
  }

  const documents = await documentsQuery;

  // Get knowledge bases
  const knowledgeBases = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, user.id))
    .orderBy(desc(knowledgeBase.created_at));

  // Get recent Q&A
  const recentQa = await db
    .select()
    .from(documentQA)
    .where(eq(documentQA.userId, user.id))
    .orderBy(desc(documentQA.created_at))
    .limit(10);

  return json({
    documents,
    knowledgeBases,
    recentQa,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "upload-document": {
        const data = documentUploadSchema.parse({
          title: formData.get("title"),
          description: formData.get("description"),
          fileUrl: formData.get("fileUrl"),
          fileType: formData.get("fileType"),
          fileSize: formData.get("fileSize") ? Number(formData.get("fileSize")) : 0,
          isPrivate: formData.get("isPrivate") === "true",
          tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [],
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

      case "add-document-chunk": {
        const data = documentChunkSchema.parse({
          documentId: formData.get("documentId"),
          content: formData.get("content"),
          chunkIndex: formData.get("chunkIndex") ? Number(formData.get("chunkIndex")) : 0,
          embedding: formData.get("embedding") ? JSON.parse(formData.get("embedding") as string) : undefined,
        });

        const [chunk] = await db
          .insert(documentChunks)
          .values({
            ...data,
          })
          .returning();

        return json({ success: true, chunk });
      }

      case "create-knowledge-base": {
        const data = knowledgeBaseSchema.parse({
          title: formData.get("title"),
          description: formData.get("description"),
          sourceDocuments: formData.get("sourceDocuments") ? JSON.parse(formData.get("sourceDocuments") as string) : [],
          isPublic: formData.get("isPublic") === "true",
          tags: formData.get("tags") ? JSON.parse(formData.get("tags") as string) : [],
        });

        const [kb] = await db
          .insert(knowledgeBase)
          .values({
            userId: user.id,
            ...data,
          })
          .returning();

        return json({ success: true, knowledgeBase: kb });
      }

      case "delete-document": {
        const documentId = formData.get("documentId") as string;
        
        await db
          .delete(companyDocuments)
          .where(eq(companyDocuments.id, documentId));

        return json({ success: true });
      }

      case "delete-knowledge-base": {
        const kbId = formData.get("kbId") as string;
        
        await db
          .delete(knowledgeBase)
          .where(eq(knowledgeBase.id, kbId));

        return json({ success: true });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Documents action error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

export function useDocumentsData() {
  return useLoaderData<typeof loader>();
} 