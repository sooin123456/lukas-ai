/**
 * AI Assistant Chat Screen
 * 
 * This component provides a chat interface for users to interact with the AI assistant.
 * It includes real-time messaging, conversation history, and AI response handling.
 */
import type { Route } from "./+types/chat";

import { BotIcon, SendIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { ScrollArea } from "~/core/components/ui/scroll-area";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the chat page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `AI Assistant | Lukas AI`,
    },
  ];
};

/**
 * Loader function for authentication and initial data
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);

  // TODO: Load user's conversation history and settings
  return {
    conversations: [],
    settings: {
      model: "gpt-4",
      language: "ko",
      context: "general",
    },
  };
}

/**
 * Message interface
 */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/**
 * Chat component
 */
export default function Chat({ loaderData }: Route.ComponentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetcher = useFetcher();

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message") as string;

    if (!message.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Clear input
    event.currentTarget.reset();

    // Submit to AI service
    fetcher.submit(
      { message, context: loaderData.settings.context },
      { method: "post", action: "/api/assistant/chat" }
    );
  };

  /**
   * Handle AI response
   */
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fetcher.data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
      setIsLoading(false);
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <div className="flex h-full flex-col">
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-1 flex-col gap-4">
          {/* Messages Area */}
          <ScrollArea className="flex-1 rounded-md border p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground">
                  <BotIcon className="mx-auto h-12 w-12 mb-4" />
                  <p>안녕하세요! 무엇을 도와드릴까요?</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] gap-2 rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <BotIcon className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <UserIcon className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex max-w-[80%] gap-2 rounded-lg bg-muted p-3">
                    <BotIcon className="h-4 w-4 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.1s" }}></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <Form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              name="message"
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading} size="icon">
              <SendIcon className="h-4 w-4" />
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 