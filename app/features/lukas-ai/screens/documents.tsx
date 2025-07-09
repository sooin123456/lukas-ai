import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/core/components/ui/select";
import { Textarea } from "~/core/components/ui/textarea";
import { Badge } from "~/core/components/ui/badge";
import { Separator } from "~/core/components/ui/separator";
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Download,
  Eye,
  EyeOff,
  MessageSquare,
  BookOpen,
  Tag,
  Calendar
} from "lucide-react";

export default function DocumentsScreen() {
  const { documents, knowledgeEntries, recentQa } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [searchTerm, setSearchTerm] = useState("");
  const [showPrivate, setShowPrivate] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc: any) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrivacy = showPrivate ? true : !doc.isPrivate;
    return matchesSearch && matchesPrivacy;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">문서 관리</h1>
          <p className="text-muted-foreground">
            회사 문서를 업로드하고 AI로 분석하세요
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          문서 업로드
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="문서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 카테고리</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="docx">Word</SelectItem>
            <SelectItem value="txt">텍스트</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => setShowPrivate(!showPrivate)}
        >
          {showPrivate ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
          {showPrivate ? "전체 보기" : "공개만"}
        </Button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map((doc: any) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {doc.fileType.toUpperCase()} • {(doc.fileSize / 1024 / 1024).toFixed(1)}MB
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  {doc.isPrivate && <Badge variant="outline" className="text-xs">비공개</Badge>}
                  <Badge variant={doc.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {doc.status === "completed" ? "완료" : "처리중"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {doc.description || "설명이 없습니다"}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Q&A
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            지식 베이스
          </CardTitle>
          <CardDescription>
            자주 묻는 질문과 회사 정책을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {knowledgeEntries.map((entry: any) => (
              <div key={entry.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{entry.title}</h4>
                    <p className="text-sm text-muted-foreground">{entry.content}</p>
                  </div>
                  <Badge variant="outline">{entry.category}</Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                  {entry.tags && entry.tags.length > 0 && (
                    <>
                      <Tag className="w-3 h-3" />
                      <span>{entry.tags.join(", ")}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Q&A */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            최근 Q&A
          </CardTitle>
          <CardDescription>
            최근 문서에 대한 질문과 답변을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQa.map((qa: any) => (
              <div key={qa.id} className="p-4 border rounded-lg">
                <div className="mb-2">
                  <h4 className="font-medium text-sm">Q: {qa.question}</h4>
                  <p className="text-sm text-muted-foreground mt-1">A: {qa.answer}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>신뢰도: {qa.confidence}%</span>
                  <span>{new Date(qa.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle>문서 업로드</CardTitle>
          <CardDescription>
            새로운 문서를 업로드하여 AI 분석을 받으세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="action" value="upload_document" />
            
            <div className="space-y-2">
              <Label htmlFor="title">문서 제목</Label>
              <Input name="title" placeholder="문서 제목을 입력하세요" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea name="description" placeholder="문서에 대한 설명을 입력하세요" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileName">파일명</Label>
                <Input name="fileName" placeholder="example.pdf" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileType">파일 타입</Label>
                <Select name="fileType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="파일 타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="docx">Word</SelectItem>
                    <SelectItem value="txt">텍스트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileSize">파일 크기 (bytes)</Label>
                <Input name="fileSize" type="number" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileUrl">파일 URL</Label>
                <Input name="fileUrl" placeholder="https://..." required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPrivate">비공개 문서</Label>
              <Select name="isPrivate" defaultValue="true">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">비공개</SelectItem>
                  <SelectItem value="false">공개</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "업로드 중..." : "문서 업로드"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 