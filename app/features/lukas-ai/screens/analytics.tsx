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
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Lightbulb, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Download,
  Upload,
  Activity,
  Target,
  Zap
} from "lucide-react";

export default function AnalyticsScreen() {
  const { usageStats, recentUsage, performanceMetrics, costAnalysis, optimizationSuggestions } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedFeature, setSelectedFeature] = useState("all");

  // Calculate summary statistics
  const totalCost = usageStats.reduce((sum: number, stat: any) => sum + (Number(stat.totalCost) || 0), 0);
  const totalTokens = usageStats.reduce((sum: number, stat: any) => sum + (Number(stat.totalTokens) || 0), 0);
  const avgResponseTime = usageStats.length > 0 
    ? `${Math.round(usageStats.reduce((sum: any, stat: any) => sum + (Number(stat.avgResponseTime) || 0), 0) / usageStats.length)}ms`
    : "0ms";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI 사용량 분석</h1>
          <p className="text-muted-foreground">
            AI 기능 사용량과 성능을 모니터링하고 최적화하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">주간</SelectItem>
              <SelectItem value="month">월간</SelectItem>
              <SelectItem value="quarter">분기</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedFeature} onValueChange={setSelectedFeature}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 기능</SelectItem>
              <SelectItem value="chat">채팅</SelectItem>
              <SelectItem value="document_qa">문서 Q&A</SelectItem>
              <SelectItem value="meeting_summary">회의 요약</SelectItem>
              <SelectItem value="workflow">워크플로우</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              이번 달 AI 사용 비용
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 토큰</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              사용된 총 토큰 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}</div>
            <p className="text-xs text-muted-foreground">
              AI 응답 평균 시간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성공률</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              AI 요청 성공률
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            기능별 사용량 통계
          </CardTitle>
          <CardDescription>
            각 AI 기능의 사용량과 비용을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usageStats.map((stat: any) => (
              <div key={stat.feature} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium">{stat.feature}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.totalTokens.toLocaleString()} 토큰 사용
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${Number(stat.totalCost).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.successRate.toFixed(1)}% 성공률
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            최근 사용 내역
          </CardTitle>
          <CardDescription>
            최근 AI 기능 사용 기록을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsage.slice(0, 10).map((usage: any) => (
              <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{usage.feature}</Badge>
                  <div>
                    <div className="font-medium">{usage.model}</div>
                    <div className="text-sm text-muted-foreground">
                      {usage.tokensUsed.toLocaleString()} 토큰
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${Number(usage.cost).toFixed(4)}</div>
                  <div className="text-sm text-muted-foreground">
                    {usage.responseTime}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            비용 분석
          </CardTitle>
          <CardDescription>
            AI 사용 비용을 분석하고 예측하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costAnalysis.map((analysis: any) => (
              <div key={analysis.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{analysis.period} 분석</div>
                  <Badge variant="outline">
                    ${Number(analysis.totalCost).toFixed(2)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(analysis.startDate).toLocaleDateString()} - {new Date(analysis.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            성능 지표
          </CardTitle>
          <CardDescription>
            AI 기능의 성능을 모니터링하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceMetrics.map((metric: any) => (
              <div key={metric.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{metric.metric}</div>
                  <div className="text-sm text-muted-foreground">{metric.feature}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{metric.value}</div>
                  <div className="text-sm text-muted-foreground">{metric.unit}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            최적화 제안
          </CardTitle>
          <CardDescription>
            AI 사용을 최적화하기 위한 제안사항을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationSuggestions.map((suggestion: any) => (
              <div key={suggestion.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{suggestion.title}</div>
                    <div className="text-sm text-muted-foreground">{suggestion.description}</div>
                  </div>
                  <Badge variant={suggestion.impact === "high" ? "destructive" : "outline"}>
                    {suggestion.impact} 영향
                  </Badge>
                </div>
                {suggestion.estimatedSavings && (
                  <div className="text-sm text-green-600">
                    예상 절약: ${Number(suggestion.estimatedSavings).toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Track Usage */}
        <Card>
          <CardHeader>
            <CardTitle>사용량 추적</CardTitle>
            <CardDescription>AI 기능 사용량을 기록하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="track_usage" />
              
              <div className="space-y-2">
                <Label htmlFor="feature">기능</Label>
                <Select name="feature" required>
                  <SelectTrigger>
                    <SelectValue placeholder="기능을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">채팅</SelectItem>
                    <SelectItem value="document_qa">문서 Q&A</SelectItem>
                    <SelectItem value="meeting_summary">회의 요약</SelectItem>
                    <SelectItem value="workflow">워크플로우</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">모델</Label>
                <Input name="model" placeholder="gpt-4, claude-3 등" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokensUsed">총 토큰</Label>
                  <Input name="tokensUsed" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">비용</Label>
                  <Input name="cost" type="number" step="0.000001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inputTokens">입력 토큰</Label>
                  <Input name="inputTokens" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outputTokens">출력 토큰</Label>
                  <Input name="outputTokens" type="number" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responseTime">응답시간 (ms)</Label>
                  <Input name="responseTime" type="number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="success">성공 여부</Label>
                  <Select name="success" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">성공</SelectItem>
                      <SelectItem value="false">실패</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "저장 중..." : "사용량 기록"}
              </Button>
            </Form>
          </CardContent>
        </Card>

        {/* Add Optimization */}
        <Card>
          <CardHeader>
            <CardTitle>최적화 제안 추가</CardTitle>
            <CardDescription>새로운 최적화 제안을 추가하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="add_optimization" />
              
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input name="title" placeholder="최적화 제안 제목" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea name="description" placeholder="최적화 제안에 대한 상세 설명" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">비용</SelectItem>
                      <SelectItem value="performance">성능</SelectItem>
                      <SelectItem value="usage">사용량</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impact">영향도</Label>
                  <Select name="impact" required>
                    <SelectTrigger>
                      <SelectValue placeholder="영향도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="medium">보통</SelectItem>
                      <SelectItem value="low">낮음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedSavings">예상 절약액</Label>
                <Input name="estimatedSavings" type="number" step="0.01" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="implementation">구현 방법</Label>
                <Textarea name="implementation" placeholder="최적화 구현 방법" />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "추가 중..." : "제안 추가"}
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 