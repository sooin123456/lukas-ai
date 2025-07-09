import { useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { Upload, FileText, Search, Plus, Trash2, MessageSquare, BookOpen, Tag } from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/core/components/ui/select";
import { Badge } from "~/core/components/ui/badge";
import { Separator } from "~/core/components/ui/separator";
import { useDocumentsData } from "~/features/lukas-ai/api/documents";

export default function DocumentsScreen() {
  const { documents, knowledgeEntries } = useDocumentsData();
  const actionData = useActionData<typeof import("~/features/lukas-ai/api/documents").action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showKnowledgeForm, setShowKnowledgeForm] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate file processing
      console.log("File uploaded:", file.name);
    }
  };

  const handleAskQuestion = (documentId: string) => {
    if (!question.trim()) return;
    
    // Submit question form
    const form = document.createElement("form");
    form.method = "post";
    form.innerHTML = `
      <input type="hidden" name="action" value="ask-question" />
      <input type="hidden" name="documentId" value="${documentId}" />
      <input type="hidden" name="question" value="${question}" />
    `;
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
    
    setQuestion("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">사내 문서 관리</h1>
          <p className="text-muted-foreground">
            문서를 업로드하고 AI와 질의응답을 통해 지식을 활용하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUploadForm(true)}>
            <Upload className="w-4 h-4 mr-2" />
            문서 업로드
          </Button>
          <Button variant="outline" onClick={() => setShowKnowledgeForm(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            지식 베이스 추가
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                업로드된 문서
              </CardTitle>
              <CardDescription>
                업로드된 문서 목록입니다. 문서를 선택하여 AI와 질의응답을 할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>업로드된 문서가 없습니다</p>
                  <p className="text-sm">문서를 업로드하여 시작하세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDocument === doc.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedDocument(doc.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {doc.fileName} • {doc.fileType}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {doc.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.status === "completed" ? "default" : "secondary"}>
                            {doc.status === "completed" ? "완료" : "처리중"}
                          </Badge>
                          <Form method="post">
                            <input type="hidden" name="action" value="delete-document" />
                            <input type="hidden" name="documentId" value={doc.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Q&A Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI 질의응답
              </CardTitle>
              <CardDescription>
                선택한 문서에 대해 AI에게 질문하고 답변을 받으세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="문서에 대해 질문하세요..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleAskQuestion(selectedDocument);
                        }
                      }}
                    />
                    <Button
                      onClick={() => handleAskQuestion(selectedDocument)}
                      disabled={!question.trim() || isSubmitting}
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Sample Q&A */}
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Q: 이 문서의 주요 내용은 무엇인가요?</p>
                      <p className="text-sm text-muted-foreground">
                        A: 이 문서는 회사의 정책과 절차에 대한 내용을 담고 있습니다. 
                        주요 섹션으로는 인사 정책, 업무 절차, 보안 가이드라인이 포함되어 있습니다.
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Q: 휴가 신청 절차는 어떻게 되나요?</p>
                      <p className="text-sm text-muted-foreground">
                        A: 휴가 신청은 최소 1주일 전에 시스템을 통해 신청해야 하며, 
                        팀장의 승인을 받은 후 사용할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>질문할 문서를 선택해주세요</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Knowledge Base Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            지식 베이스
          </CardTitle>
          <CardDescription>
            자주 묻는 질문과 중요한 정보를 정리한 지식 베이스입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {knowledgeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>지식 베이스 항목이 없습니다</p>
              <p className="text-sm">중요한 정보를 추가하여 팀원들과 공유하세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeEntries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{entry.title}</h4>
                    <Form method="post">
                      <input type="hidden" name="action" value="delete-knowledge-entry" />
                      <input type="hidden" name="entryId" value={entry.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Form>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {entry.content.substring(0, 100)}...
                  </p>
                  {entry.category && (
                    <Badge variant="outline" className="text-xs">
                      {entry.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>문서 업로드</CardTitle>
              <CardDescription>
                분석할 문서를 업로드하세요. PDF, DOCX, TXT 파일을 지원합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="upload-document" />
                
                <div>
                  <Label htmlFor="title">문서 제목</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="문서 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">설명 (선택사항)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="문서에 대한 간단한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <Label htmlFor="file">파일 선택</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    name="isPrivate"
                    value="true"
                    defaultChecked
                  />
                  <Label htmlFor="isPrivate">비공개 문서</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "업로드 중..." : "업로드"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUploadForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {showKnowledgeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>지식 베이스 추가</CardTitle>
              <CardDescription>
                팀원들과 공유할 중요한 정보를 추가하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="create-knowledge-entry" />
                
                <div>
                  <Label htmlFor="kb-title">제목</Label>
                  <Input
                    id="kb-title"
                    name="title"
                    placeholder="제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="kb-content">내용</Label>
                  <Textarea
                    id="kb-content"
                    name="content"
                    placeholder="내용을 입력하세요"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="kb-category">카테고리</Label>
                  <Select name="category">
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faq">자주 묻는 질문</SelectItem>
                      <SelectItem value="policy">정책</SelectItem>
                      <SelectItem value="procedure">절차</SelectItem>
                      <SelectItem value="guide">가이드</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "추가 중..." : "추가"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowKnowledgeForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 