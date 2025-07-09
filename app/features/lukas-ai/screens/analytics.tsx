import { useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Target, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  Settings,
  Download
} from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Badge } from "~/core/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/core/components/ui/select";
import { useAnalyticsData } from "~/features/lukas-ai/api/analytics";

export default function AnalyticsScreen() {
  const { 
    usageStats, 
    performanceMetrics, 
    costAnalysis, 
    optimizationSuggestions, 
    recentUsage, 
    summary 
  } = useAnalyticsData();
  const actionData = useActionData<typeof import("~/features/lukas-ai/api/analytics").action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedFeature, setSelectedFeature] = useState("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFeatureColor = (feature: string) => {
    switch (feature) {
      case "chat": return "text-blue-600";
      case "document_qa": return "text-green-600";
      case "meeting_summary": return "text-purple-600";
      case "workflow": return "text-orange-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI 사용량 분석</h1>
          <p className="text-muted-foreground">
            AI 기능 사용량, 비용, 성능을 분석하고 최적화하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1주일</SelectItem>
              <SelectItem value="month">1개월</SelectItem>
              <SelectItem value="quarter">3개월</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            보고서 다운로드
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              지난 {selectedPeriod === "week" ? "7일" : selectedPeriod === "month" ? "30일" : "90일"}간
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 토큰</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalTokens)}</div>
            <p className="text-xs text-muted-foreground">
              입력 + 출력 토큰
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 요청</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalRequests)}</div>
            <p className="text-xs text-muted-foreground">
              AI 기능 호출 횟수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 응답시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats.length > 0 
                ? `${Math.round(usageStats.reduce((sum, stat) => sum + (Number(stat.avgResponseTime) || 0), 0) / usageStats.length)}ms`
                : "0ms"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              평균 응답 시간
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage">📊 사용량 분석</TabsTrigger>
          <TabsTrigger value="cost">💰 비용 분석</TabsTrigger>
          <TabsTrigger value="performance">📈 성능 분석</TabsTrigger>
          <TabsTrigger value="optimization">🎯 최적화 제안</TabsTrigger>
        </TabsList>

        {/* Usage Analysis Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Usage Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  기능별 사용량
                </CardTitle>
                <CardDescription>
                  AI 기능별 사용량 분포를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usageStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>사용량 데이터가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {usageStats.map((stat) => (
                      <div key={stat.feature} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${getFeatureColor(stat.feature)}`}>
                            {stat.feature === "chat" ? "AI 채팅" :
                             stat.feature === "document_qa" ? "문서 Q&A" :
                             stat.feature === "meeting_summary" ? "회의 요약" :
                             stat.feature === "workflow" ? "워크플로우" : stat.feature}
                          </span>
                          <Badge variant="outline">
                            {formatNumber(Number(stat.totalRequests))}회
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${(Number(stat.totalTokens) / summary.totalTokens) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{formatNumber(Number(stat.totalTokens))} 토큰</span>
                          <span>{formatCurrency(Number(stat.totalCost) || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Usage Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  최근 사용 활동
                </CardTitle>
                <CardDescription>
                  최근 AI 기능 사용 기록입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentUsage.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>최근 사용 기록이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentUsage.slice(0, 10).map((usage) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getFeatureColor(usage.feature).replace('text-', 'bg-')}`}></div>
                          <div>
                            <p className="font-medium text-sm">
                              {usage.feature === "chat" ? "AI 채팅" :
                               usage.feature === "document_qa" ? "문서 Q&A" :
                               usage.feature === "meeting_summary" ? "회의 요약" :
                               usage.feature === "workflow" ? "워크플로우" : usage.feature}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {usage.model} • {formatNumber(usage.tokensUsed)} 토큰
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {usage.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(usage.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="cost" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  비용 추이
                </CardTitle>
                <CardDescription>
                  시간별 AI 사용 비용 변화를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {costAnalysis.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>비용 분석 데이터가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {costAnalysis.map((analysis) => (
                      <div key={analysis.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            {analysis.period === "daily" ? "일간" :
                             analysis.period === "weekly" ? "주간" : "월간"} 분석
                          </h4>
                          <Badge variant="outline">
                            {formatCurrency(Number(analysis.totalCost) || 0)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(analysis.startDate).toLocaleDateString()} - {new Date(analysis.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  비용 세부 분석
                </CardTitle>
                <CardDescription>
                  기능별 비용 분포를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">AI 채팅</span>
                    </div>
                    <span className="font-medium">{formatCurrency(45.20)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">문서 Q&A</span>
                    </div>
                    <span className="font-medium">{formatCurrency(32.80)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="font-medium">회의 요약</span>
                    </div>
                    <span className="font-medium">{formatCurrency(28.50)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="font-medium">워크플로우</span>
                    </div>
                    <span className="font-medium">{formatCurrency(15.30)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Analysis Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  성능 지표
                </CardTitle>
                <CardDescription>
                  AI 기능별 성능 지표를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {performanceMetrics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>성능 지표 데이터가 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {performanceMetrics.map((metric) => (
                      <div key={metric.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{metric.feature}</h4>
                            <p className="text-sm text-muted-foreground">
                              {metric.metric === "accuracy" ? "정확도" :
                               metric.metric === "response_time" ? "응답시간" :
                               metric.metric === "user_satisfaction" ? "사용자 만족도" : metric.metric}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {metric.value}{metric.unit || ""}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  성능 추이
                </CardTitle>
                <CardDescription>
                  시간별 성능 변화를 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">응답 시간</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-16 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">1.2초</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">정확도</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-18 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">사용자 만족도</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div className="w-17 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">4.8/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Suggestions Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  최적화 제안
                </CardTitle>
                <CardDescription>
                  AI 사용을 최적화하기 위한 제안사항입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {optimizationSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>최적화 제안이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {optimizationSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <Badge className={getImpactColor(suggestion.impact)}>
                            {suggestion.impact === "high" ? "높음" :
                             suggestion.impact === "medium" ? "보통" : "낮음"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        {suggestion.estimatedSavings && (
                          <p className="text-sm font-medium text-green-600 mb-3">
                            예상 절약: {formatCurrency(Number(suggestion.estimatedSavings))}
                          </p>
                        )}
                        <div className="flex gap-2">
                          {!suggestion.isApplied && (
                            <Form method="post">
                              <input type="hidden" name="action" value="apply-optimization" />
                              <input type="hidden" name="suggestionId" value={suggestion.id} />
                              <Button type="submit" size="sm">
                                적용하기
                              </Button>
                            </Form>
                          )}
                          <Form method="post">
                            <input type="hidden" name="action" value="delete-suggestion" />
                            <input type="hidden" name="suggestionId" value={suggestion.id} />
                            <Button type="submit" variant="outline" size="sm">
                              삭제
                            </Button>
                          </Form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sample Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  추천 최적화
                </CardTitle>
                <CardDescription>
                  일반적인 AI 사용 최적화 방법입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">토큰 사용량 최적화</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      더 짧고 명확한 프롬프트를 사용하여 토큰 사용량을 줄이세요.
                    </p>
                    <Badge variant="outline" className="text-xs">비용 절약</Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">모델 선택 최적화</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      간단한 작업에는 GPT-3.5를, 복잡한 작업에는 GPT-4를 사용하세요.
                    </p>
                    <Badge variant="outline" className="text-xs">성능 향상</Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium mb-2">배치 처리 활용</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      여러 요청을 한 번에 처리하여 API 호출 횟수를 줄이세요.
                    </p>
                    <Badge variant="outline" className="text-xs">효율성 향상</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 