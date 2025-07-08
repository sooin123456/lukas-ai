/**
 * AI Assistant Chat API
 * 
 * This API endpoint handles conversations with the AI assistant.
 * It processes user messages, calls the AI service, and stores conversation history.
 */
import type { Route } from "./+types/chat";

import { data } from "react-router";
import { z } from "zod";

import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Validation schema for chat messages
 */
const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  conversationId: z.string().uuid().optional(),
  context: z.string().optional(),
});

/**
 * AI Service Client
 * 
 * This would integrate with your preferred AI service (OpenAI, Anthropic, etc.)
 */
class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.baseUrl = "https://api.openai.com/v1";
  }

  async generateResponse(
    message: string,
    context: string = "general",
    language: string = "ko"
  ): Promise<string> {
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
              content: `You are a helpful AI assistant. Respond in ${language}. Context: ${context}`,
            },
            {
              role: "user",
              content: message,
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
      return result.choices[0]?.message?.content || "Sorry, I couldn't process your request.";
    } catch (error) {
      console.error("AI service error:", error);
      return "I'm having trouble connecting right now. Please try again later.";
    }
  }
}

/**
 * Action handler for processing chat messages
 */
export async function action({ request }: Route.ActionArgs) {
  // Create Supabase client and authenticate user
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  // Get authenticated user
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return data({ error: "User not authenticated" }, { status: 401 });
  }

  // Parse and validate form data
  const formData = await request.formData();
  const result = chatSchema.safeParse(Object.fromEntries(formData));

  if (!result.success) {
    return data(
      { fieldErrors: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { message, conversationId, context } = result.data;

  try {
    // Initialize AI service
    const aiService = new AIService();
    
    // Generate AI response
    const aiResponse = await aiService.generateResponse(message, context);

    // TODO: Store conversation and messages in database
    // This would involve:
    // 1. Creating or updating conversation record
    // 2. Storing user message
    // 3. Storing AI response
    // 4. Returning conversation data

    return data({
      success: true,
      response: aiResponse,
      conversationId: conversationId || "new-conversation-id", // Replace with actual ID
    });

  } catch (error) {
    console.error("Chat processing error:", error);
    return data(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
} 