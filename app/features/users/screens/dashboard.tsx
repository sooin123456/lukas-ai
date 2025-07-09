import type { Route } from "./+types/dashboard";

import { 
  BookOpen,
  MessageSquare, 
  FileText, 
  Mic, 
  Users, 
  TrendingUp,
  Calendar,
  Clock
} from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Badge } from "~/core/components/ui/badge";

export const meta: Route.MetaFunction = () => {
  return [{ title: `대시보드 | Lukas AI` }];
};

export default function Dashboard() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Welcome Section */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">안녕하세요! 👋</h1>
        <p className="text-muted-foreground">
          Lukas AI로 업무 효율성을 극대화하세요.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              AI 채팅
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Lukas AI와 대화하여 업무를 도와드립니다.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/assistant">
                채팅 시작
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-600" />
              업무 도구
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              문서 분석, 이메일 작성, 코드 리뷰 등 전문 도구를 사용하세요.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/work-tools">
                도구 사용
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="h-5 w-5 text-purple-600" />
              실시간 회의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              실시간 음성 녹음, 화자 구분, 자동 요약 기능을 제공합니다.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/meeting">
                회의 시작
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-orange-600" />
              팀 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              팀원들과 문서를 공유하고 협업하세요.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/dashboard/team">
                팀 보기
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              사내 문서 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              문서 업로드 및 AI 질의응답으로 지식을 활용하세요.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/documents">
                문서 관리
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-red-600" />
              일정 관리 & 자동화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              일정 관리, 작업 자동화, 시간 추적으로 생산성을 높이세요.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/schedule">
                일정 관리
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              AI 사용량 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AI 사용량, 비용, 성능을 분석하고 최적화하세요.
            </p>
            <Button asChild className="w-full">
              <Link to="/dashboard/analytics">
                분석 대시보드
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              이번 달 사용량
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">문서 분석</span>
              <Badge variant="outline">15/50건</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">회의 정리</span>
              <Badge variant="outline">8/25건</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">AI 채팅</span>
              <Badge variant="outline">무제한</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              최근 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>문서 분석 완료</span>
              <span className="text-muted-foreground ml-auto">2시간 전</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>회의 요약 생성</span>
              <span className="text-muted-foreground ml-auto">1일 전</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>AI 채팅 사용</span>
              <span className="text-muted-foreground ml-auto">3일 전</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              시간 절약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">12.5시간</div>
              <div className="text-sm text-muted-foreground">이번 주 절약</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">+35%</div>
              <div className="text-sm text-muted-foreground">생산성 향상</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>최근 문서</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Q4 매출 보고서</div>
                  <div className="text-sm text-muted-foreground">2시간 전 분석 완료</div>
                </div>
              </div>
              <Badge variant="outline">분석 완료</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">월간 팀 회의</div>
                  <div className="text-sm text-muted-foreground">1일 전 요약 생성</div>
                </div>
              </div>
              <Badge variant="outline">요약 완료</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">신규 프로젝트 계획서</div>
                  <div className="text-sm text-muted-foreground">3일 전 분석 완료</div>
                </div>
              </div>
              <Badge variant="outline">분석 완료</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
