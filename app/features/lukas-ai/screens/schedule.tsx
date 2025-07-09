import { useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Settings, 
  Workflow,
  TrendingUp,
  Zap,
  Users,
  Target
} from "lucide-react";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/core/components/ui/select";
import { Badge } from "~/core/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/core/components/ui/tabs";
import { useScheduleData } from "~/features/lukas-ai/api/schedule";

export default function ScheduleScreen() {
  const { events, tasks, executions, timeEntries, workflows } = useScheduleData();
  const actionData = useActionData<typeof import("~/features/lukas-ai/api/schedule").action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentTask, setCurrentTask] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "meeting": return <Users className="w-4 h-4" />;
      case "task": return <Target className="w-4 h-4" />;
      case "deadline": return <Clock className="w-4 h-4" />;
      case "reminder": return <Zap className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">일정 관리 & 자동화</h1>
          <p className="text-muted-foreground">
            일정을 관리하고 반복 작업을 자동화하여 생산성을 높이세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            일정 추가
          </Button>
          <Button variant="outline" onClick={() => setShowTaskForm(true)}>
            <Zap className="w-4 h-4 mr-2" />
            자동화 작업
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar">📅 일정 관리</TabsTrigger>
          <TabsTrigger value="automation">🤖 작업 자동화</TabsTrigger>
          <TabsTrigger value="tracking">⏱️ 시간 추적</TabsTrigger>
          <TabsTrigger value="workflows">🔄 워크플로우</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  오늘의 일정
                </CardTitle>
                <CardDescription>
                  오늘 예정된 일정들을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>오늘 예정된 일정이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.slice(0, 5).map((event) => (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getEventTypeIcon(event.type)}
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={getPriorityColor(event.priority)}>
                            {event.priority}
                          </Badge>
                        </div>
                        {event.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  예정된 일정
                </CardTitle>
                <CardDescription>
                  이번 주 예정된 일정들입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(5, 10).map((event) => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  빠른 작업
                </CardTitle>
                <CardDescription>
                  자주 사용하는 작업들을 빠르게 실행하세요
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Play className="w-4 h-4 mr-2" />
                  시간 추적 시작
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  회의 일정 잡기
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  작업 목표 설정
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Automated Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  자동화 작업
                </CardTitle>
                <CardDescription>
                  설정된 자동화 작업들을 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>설정된 자동화 작업이 없습니다</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowTaskForm(true)}
                    >
                      작업 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{task.type}</Badge>
                              <Badge variant={task.isActive ? "default" : "secondary"}>
                                {task.isActive ? "활성" : "비활성"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Form method="post">
                              <input type="hidden" name="action" value="toggle-task" />
                              <input type="hidden" name="taskId" value={task.id} />
                              <input type="hidden" name="isActive" value={!task.isActive} />
                              <Button type="submit" variant="ghost" size="sm">
                                {task.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </Button>
                            </Form>
                            <Form method="post">
                              <input type="hidden" name="action" value="delete-task" />
                              <input type="hidden" name="taskId" value={task.id} />
                              <Button type="submit" variant="ghost" size="sm">
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

            {/* Task Executions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  실행 기록
                </CardTitle>
                <CardDescription>
                  최근 자동화 작업 실행 기록입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>실행 기록이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {executions.map((execution) => (
                      <div key={execution.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {execution.status === "success" ? "✅ 성공" : "❌ 실패"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(execution.startTime).toLocaleString()}
                            </p>
                          </div>
                          {execution.duration && (
                            <Badge variant="outline">
                              {Math.floor(execution.duration / 60)}분
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Tracker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  시간 추적
                </CardTitle>
                <CardDescription>
                  작업 시간을 추적하고 생산성을 분석하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isTracking ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="taskName">작업명</Label>
                      <Input
                        id="taskName"
                        placeholder="작업명을 입력하세요"
                        value={currentTask}
                        onChange={(e) => setCurrentTask(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => setIsTracking(true)}
                      disabled={!currentTask.trim()}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      추적 시작
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        추적 중...
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentTask}
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsTracking(false)}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      추적 중지
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  시간 기록
                </CardTitle>
                <CardDescription>
                  최근 시간 추적 기록입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>시간 추적 기록이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{entry.taskName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.startTime).toLocaleDateString()}
                            </p>
                          </div>
                          {entry.duration && (
                            <Badge variant="outline">
                              {formatDuration(entry.duration)}
                            </Badge>
                          )}
                        </div>
                        {entry.category && (
                          <Badge variant="secondary" className="mt-2">
                            {entry.category}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  워크플로우
                </CardTitle>
                <CardDescription>
                  업무 프로세스를 자동화하는 워크플로우를 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflows.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>설정된 워크플로우가 없습니다</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowWorkflowForm(true)}
                    >
                      워크플로우 추가
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workflows.map((workflow) => (
                      <div key={workflow.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{workflow.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {workflow.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={workflow.isActive ? "default" : "secondary"}>
                                {workflow.isActive ? "활성" : "비활성"}
                              </Badge>
                              <Badge variant="outline">
                                {workflow.executionCount}회 실행
                              </Badge>
                            </div>
                          </div>
                          <Form method="post">
                            <input type="hidden" name="action" value="delete-workflow" />
                            <input type="hidden" name="workflowId" value={workflow.id} />
                            <Button type="submit" variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </Form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  워크플로우 템플릿
                </CardTitle>
                <CardDescription>
                  자주 사용하는 워크플로우 템플릿들입니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <h4 className="font-medium">회의 준비 워크플로우</h4>
                  <p className="text-sm text-muted-foreground">
                    회의 전 필요한 자료 준비 및 참석자 알림
                  </p>
                </div>
                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <h4 className="font-medium">일일 보고서 워크플로우</h4>
                  <p className="text-sm text-muted-foreground">
                    매일 업무 진행상황 정리 및 보고서 생성
                  </p>
                </div>
                <div className="p-3 border rounded-lg cursor-pointer hover:bg-muted">
                  <h4 className="font-medium">프로젝트 마감 워크플로우</h4>
                  <p className="text-sm text-muted-foreground">
                    프로젝트 완료 시 문서 정리 및 팀원 알림
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>일정 추가</CardTitle>
              <CardDescription>
                새로운 일정을 추가하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="create-event" />
                
                <div>
                  <Label htmlFor="title">제목</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="일정 제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="일정에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">시작 시간</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="datetime-local"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">종료 시간</Label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="datetime-local"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">유형</Label>
                    <Select name="type">
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meeting">회의</SelectItem>
                        <SelectItem value="task">작업</SelectItem>
                        <SelectItem value="deadline">마감일</SelectItem>
                        <SelectItem value="reminder">알림</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">우선순위</Label>
                    <Select name="priority">
                      <SelectTrigger>
                        <SelectValue placeholder="우선순위 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">낮음</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="high">높음</SelectItem>
                        <SelectItem value="urgent">긴급</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">장소</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="장소를 입력하세요"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "추가 중..." : "추가"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEventForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>자동화 작업 추가</CardTitle>
              <CardDescription>
                반복되는 작업을 자동화하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="create-automated-task" />
                
                <div>
                  <Label htmlFor="taskName">작업명</Label>
                  <Input
                    id="taskName"
                    name="name"
                    placeholder="자동화 작업명을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="taskDescription">설명</Label>
                  <Textarea
                    id="taskDescription"
                    name="description"
                    placeholder="작업에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taskType">작업 유형</Label>
                    <Select name="type">
                      <SelectTrigger>
                        <SelectValue placeholder="유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">이메일</SelectItem>
                        <SelectItem value="report">보고서</SelectItem>
                        <SelectItem value="reminder">알림</SelectItem>
                        <SelectItem value="data_processing">데이터 처리</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="trigger">트리거</Label>
                    <Select name="trigger">
                      <SelectTrigger>
                        <SelectValue placeholder="트리거 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="schedule">스케줄</SelectItem>
                        <SelectItem value="event">이벤트</SelectItem>
                        <SelectItem value="condition">조건</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "추가 중..." : "추가"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTaskForm(false)}
                  >
                    취소
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Form Modal */}
      {showWorkflowForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>워크플로우 추가</CardTitle>
              <CardDescription>
                업무 프로세스를 자동화하는 워크플로우를 만드세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-4">
                <input type="hidden" name="action" value="create-workflow" />
                
                <div>
                  <Label htmlFor="workflowName">워크플로우명</Label>
                  <Input
                    id="workflowName"
                    name="name"
                    placeholder="워크플로우명을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="workflowDescription">설명</Label>
                  <Textarea
                    id="workflowDescription"
                    name="description"
                    placeholder="워크플로우에 대한 설명을 입력하세요"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "추가 중..." : "추가"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowWorkflowForm(false)}
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