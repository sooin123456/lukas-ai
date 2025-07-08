/**
 * Work Tools Screen
 * 
 * This component provides specialized AI tools for internal employees:
 * - Document analysis and summarization
 * - Email composition and response drafting
 * - Meeting notes and action items extraction
 * - Code review and documentation generation
 */
import type { Route } from "./+types/work-tools";

import { 
  BotIcon, 
  FileTextIcon, 
  MailIcon, 
  MessageSquareIcon, 
  CodeIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon
} from "lucide-react";
import { useState } from "react";
import { Form, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { requireAuthentication } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * Meta function for the work tools page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `Work Tools | Lukas AI`,
    },
  ];
};

/**
 * Loader function for authentication
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireAuthentication(client);
  return {};
}

/**
 * Work Tools component
 */
export default function WorkTools() {
  const [activeTab, setActiveTab] = useState("document");
  const [results, setResults] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const fetcher = useFetcher();

  /**
   * Handle form submission for different tools
   */
  const handleSubmit = (tool: string) => async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("tool", tool);

    setIsLoading(prev => ({ ...prev, [tool]: true }));

    fetcher.submit(formData, {
      method: "post",
      action: "/api/assistant/work-tools",
    });
  };

  /**
   * Handle AI response
   */
  const handleResponse = (tool: string) => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        setResults(prev => ({ ...prev, [tool]: fetcher.data.result }));
      }
      setIsLoading(prev => ({ ...prev, [tool]: false }));
    }
  };

  /**
   * Copy result to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  /**
   * Download result as text file
   */
  const downloadAsFile = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">업무 AI 도구</h1>
        <p className="text-muted-foreground">
          내부 직원들을 위한 전문적인 AI 도구들을 사용하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            문서 분석
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <MailIcon className="h-4 w-4" />
            이메일 작성
          </TabsTrigger>
          <TabsTrigger value="meeting" className="flex items-center gap-2">
            <MessageSquareIcon className="h-4 w-4" />
            회의 노트
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <CodeIcon className="h-4 w-4" />
            코드 리뷰
          </TabsTrigger>
        </TabsList>

        {/* Document Analysis Tab */}
        <TabsContent value="document" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5" />
                문서 분석 및 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSubmit("document_analysis")} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">분석 유형</Label>
                    <Select name="type" defaultValue="summarize">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summarize">요약</SelectItem>
                        <SelectItem value="extract_key_points">핵심 포인트 추출</SelectItem>
                        <SelectItem value="find_issues">개선점 찾기</SelectItem>
                        <SelectItem value="improve">문서 개선</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">언어</Label>
                    <Select name="language" defaultValue="ko">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">영어</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="content">문서 내용</Label>
                  <Textarea
                    name="content"
                    placeholder="분석할 문서 내용을 입력하세요..."
                    className="min-h-[200px]"
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading.document_analysis}>
                  {isLoading.document_analysis && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  분석 시작
                </Button>
              </Form>

              {results.document_analysis && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">분석 결과</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(results.document_analysis)}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsFile(results.document_analysis, "document-analysis.txt")}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-4 bg-muted">
                    <pre className="whitespace-pre-wrap text-sm">{results.document_analysis}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Composition Tab */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailIcon className="h-5 w-5" />
                이메일 작성 도우미
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSubmit("email_composition")} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="purpose">이메일 목적</Label>
                    <Select name="purpose" defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inquiry">문의</SelectItem>
                        <SelectItem value="follow_up">후속 조치</SelectItem>
                        <SelectItem value="meeting_request">회의 요청</SelectItem>
                        <SelectItem value="feedback">피드백</SelectItem>
                        <SelectItem value="general">일반 업무</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tone">톤</Label>
                    <Select name="tone" defaultValue="professional">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">공식적</SelectItem>
                        <SelectItem value="professional">전문적</SelectItem>
                        <SelectItem value="friendly">친근한</SelectItem>
                        <SelectItem value="casual">편안한</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">언어</Label>
                    <Select name="language" defaultValue="ko">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">영어</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="context">상황 설명</Label>
                  <Textarea
                    name="context"
                    placeholder="이메일을 작성할 상황을 자세히 설명해주세요..."
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading.email_composition}>
                  {isLoading.email_composition && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  이메일 생성
                </Button>
              </Form>

              {results.email_composition && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">생성된 이메일</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(results.email_composition)}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsFile(results.email_composition, "email-draft.txt")}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-4 bg-muted">
                    <pre className="whitespace-pre-wrap text-sm">{results.email_composition}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meeting Notes Tab */}
        <TabsContent value="meeting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareIcon className="h-5 w-5" />
                회의 노트 정리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSubmit("meeting_notes")} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">정리 형식</Label>
                    <Select name="format" defaultValue="action_items">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action_items">액션 아이템</SelectItem>
                        <SelectItem value="bullet_points">불릿 포인트</SelectItem>
                        <SelectItem value="structured">구조화된 정리</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">언어</Label>
                    <Select name="language" defaultValue="ko">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">한국어</SelectItem>
                        <SelectItem value="en">영어</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="transcript">회의 내용</Label>
                  <Textarea
                    name="transcript"
                    placeholder="회의 내용이나 녹음 내용을 입력하세요..."
                    className="min-h-[200px]"
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading.meeting_notes}>
                  {isLoading.meeting_notes && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  노트 정리
                </Button>
              </Form>

              {results.meeting_notes && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">정리된 회의 노트</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(results.meeting_notes)}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsFile(results.meeting_notes, "meeting-notes.txt")}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-4 bg-muted">
                    <pre className="whitespace-pre-wrap text-sm">{results.meeting_notes}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Review Tab */}
        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CodeIcon className="h-5 w-5" />
                코드 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={handleSubmit("code_review")} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">프로그래밍 언어</Label>
                    <Select name="language" defaultValue="javascript">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                        <SelectItem value="csharp">C#</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="focus">리뷰 포커스</Label>
                    <Select name="focus" defaultValue="best_practices">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="best_practices">모범 사례</SelectItem>
                        <SelectItem value="security">보안</SelectItem>
                        <SelectItem value="performance">성능</SelectItem>
                        <SelectItem value="readability">가독성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="code">코드</Label>
                  <Textarea
                    name="code"
                    placeholder="리뷰할 코드를 입력하세요..."
                    className="min-h-[300px] font-mono text-sm"
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading.code_review}>
                  {isLoading.code_review && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  코드 리뷰
                </Button>
              </Form>

              {results.code_review && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">리뷰 결과</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(results.code_review)}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAsFile(results.code_review, "code-review.txt")}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-4 bg-muted">
                    <pre className="whitespace-pre-wrap text-sm">{results.code_review}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 