/**
 * Work-specific AI Tools API
 * 
 * This API provides specialized AI tools for internal employees:
 * - Document analysis and summarization
 * - Email composition and response drafting
 * - Meeting notes and action items extraction
 * - Code review and documentation generation
 * - Data analysis and report generation
 */
import type { Route } from "./+types/work-tools";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schemas for different work tools
 */
const documentAnalysisSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  type: z.enum(["summarize", "extract_key_points", "find_issues", "improve"]),
  language: z.string().default("ko"),
});

const emailSchema = z.object({
  context: z.string().min(1, "Context is required"),
  tone: z.enum(["formal", "casual", "professional", "friendly"]).default("professional"),
  purpose: z.enum(["inquiry", "follow_up", "meeting_request", "feedback", "general"]),
  language: z.string().default("ko"),
});

const meetingNotesSchema = z.object({
  transcript: z.string().min(1, "Transcript cannot be empty"),
  format: z.enum(["bullet_points", "structured", "action_items"]).default("action_items"),
  language: z.string().default("ko"),
});

const codeReviewSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  language: z.string().min(1, "Programming language is required"),
  focus: z.enum(["security", "performance", "readability", "best_practices"]).default("best_practices"),
});

/**
 * Enhanced AI Service for Work Tools
 */
class WorkAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl = "https://api.openai.com/v1";
  }

  /**
   * Analyze and process documents
   */
  async analyzeDocument(content: string, type: string, language: string = "ko"): Promise<string> {
    const prompts = {
      summarize: `다음 문서를 간결하게 요약해주세요 (${language}):`,
      extract_key_points: `다음 문서에서 핵심 포인트들을 추출해주세요 (${language}):`,
      find_issues: `다음 문서에서 개선이 필요한 부분들을 찾아주세요 (${language}):`,
      improve: `다음 문서를 더 명확하고 전문적으로 개선해주세요 (${language}):`,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `당신은 전문적인 문서 분석 도구입니다. ${language}로 응답해주세요.`,
            },
            {
              role: "user",
              content: `${prompts[type as keyof typeof prompts]}\n\n${content}`,
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "분석을 완료할 수 없습니다.";
    } catch (error) {
      console.error("Document analysis error:", error);
      return "문서 분석 중 오류가 발생했습니다.";
    }
  }

  /**
   * Compose professional emails
   */
  async composeEmail(context: string, tone: string, purpose: string, language: string = "ko"): Promise<string> {
    const tonePrompts = {
      formal: "공식적이고 격식있는 톤으로",
      casual: "친근하고 편안한 톤으로",
      professional: "전문적이고 비즈니스적인 톤으로",
      friendly: "친근하지만 전문적인 톤으로",
    };

    const purposePrompts = {
      inquiry: "문의 이메일을 작성해주세요",
      follow_up: "후속 조치 이메일을 작성해주세요",
      meeting_request: "회의 요청 이메일을 작성해주세요",
      feedback: "피드백 이메일을 작성해주세요",
      general: "일반적인 업무 이메일을 작성해주세요",
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `당신은 전문적인 이메일 작성 도우미입니다. ${tonePrompts[tone as keyof typeof tonePrompts]} ${purposePrompts[purpose as keyof typeof purposePrompts]}를 ${language}로 작성해주세요.`,
            },
            {
              role: "user",
              content: `다음 상황에 맞는 이메일을 작성해주세요:\n\n${context}`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "이메일 작성에 실패했습니다.";
    } catch (error) {
      console.error("Email composition error:", error);
      return "이메일 작성 중 오류가 발생했습니다.";
    }
  }

  /**
   * Extract meeting notes and action items
   */
  async processMeetingNotes(transcript: string, format: string, language: string = "ko"): Promise<string> {
    const formatPrompts = {
      bullet_points: "회의 내용을 불릿 포인트로 정리해주세요",
      structured: "회의 내용을 구조화된 형태로 정리해주세요",
      action_items: "회의에서 나온 액션 아이템들을 추출해주세요",
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `당신은 회의 노트 정리 전문가입니다. ${formatPrompts[format as keyof typeof formatPrompts]}를 ${language}로 작성해주세요.`,
            },
            {
              role: "user",
              content: `다음 회의 내용을 정리해주세요:\n\n${transcript}`,
            },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "회의 노트 정리에 실패했습니다.";
    } catch (error) {
      console.error("Meeting notes processing error:", error);
      return "회의 노트 처리 중 오류가 발생했습니다.";
    }
  }

  /**
   * Review and improve code
   */
  async reviewCode(code: string, language: string, focus: string): Promise<string> {
    const focusPrompts = {
      security: "보안 관점에서 코드를 리뷰해주세요",
      performance: "성능 관점에서 코드를 리뷰해주세요",
      readability: "가독성 관점에서 코드를 리뷰해주세요",
      best_practices: "모범 사례 관점에서 코드를 리뷰해주세요",
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `당신은 ${language} 전문 개발자입니다. ${focusPrompts[focus as keyof typeof focusPrompts]} 한국어로 리뷰해주세요.`,
            },
            {
              role: "user",
              content: `다음 코드를 리뷰해주세요:\n\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          ],
          max_tokens: 2000,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "코드 리뷰에 실패했습니다.";
    } catch (error) {
      console.error("Code review error:", error);
      return "코드 리뷰 중 오류가 발생했습니다.";
    }
  }
}

/**
 * Action handler for document analysis
 */
export async function action({ request }: Route.ActionArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return data({ error: "User not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const tool = formData.get("tool") as string;

  try {
    const aiService = new WorkAIService();

    switch (tool) {
      case "document_analysis": {
        const result = documentAnalysisSchema.safeParse(Object.fromEntries(formData));
        if (!result.success) {
          return data({ fieldErrors: result.error.flatten().fieldErrors }, { status: 400 });
        }
        const { content, type, language } = result.data;
        const analysis = await aiService.analyzeDocument(content, type, language);
        return data({ success: true, result: analysis });
      }

      case "email_composition": {
        const result = emailSchema.safeParse(Object.fromEntries(formData));
        if (!result.success) {
          return data({ fieldErrors: result.error.flatten().fieldErrors }, { status: 400 });
        }
        const { context, tone, purpose, language } = result.data;
        const email = await aiService.composeEmail(context, tone, purpose, language);
        return data({ success: true, result: email });
      }

      case "meeting_notes": {
        const result = meetingNotesSchema.safeParse(Object.fromEntries(formData));
        if (!result.success) {
          return data({ fieldErrors: result.error.flatten().fieldErrors }, { status: 400 });
        }
        const { transcript, format, language } = result.data;
        const notes = await aiService.processMeetingNotes(transcript, format, language);
        return data({ success: true, result: notes });
      }

      case "code_review": {
        const result = codeReviewSchema.safeParse(Object.fromEntries(formData));
        if (!result.success) {
          return data({ fieldErrors: result.error.flatten().fieldErrors }, { status: 400 });
        }
        const { code, language, focus } = result.data;
        const review = await aiService.reviewCode(code, language, focus);
        return data({ success: true, result: review });
      }

      default:
        return data({ error: "Unknown tool" }, { status: 400 });
    }
  } catch (error) {
    console.error("Work tool processing error:", error);
    return data({ error: "Failed to process request" }, { status: 500 });
  }
} 