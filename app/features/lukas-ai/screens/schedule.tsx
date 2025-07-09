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
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  Timer,
  Workflow,
  Settings
} from "lucide-react";

export default function ScheduleScreen() {
  const { events, tasks, executions, timeEntries, workflows } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedView, setSelectedView] = useState("calendar");
  const [showEventForm, setShowEventForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">일정 관리</h1>
          <p className="text-muted-foreground">
            일정과 작업을 관리하고 자동화하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calendar">캘린더</SelectItem>
              <SelectItem value="tasks">작업</SelectItem>
              <SelectItem value="automation">자동화</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowEventForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            일정 추가
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {selectedView === "calendar" && (
        <div className="space-y-6">
          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                다가오는 일정
              </CardTitle>
              <CardDescription>
                이번 주 예정된 일정들을 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(0, 5).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.startTime).toLocaleDateString()} - {new Date(event.endTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.type}</Badge>
                      <Badge variant={event.priority === "high" ? "destructive" : "outline"}>
                        {event.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Events */}
          <Card>
            <CardHeader>
              <CardTitle>전체 일정</CardTitle>
              <CardDescription>
                모든 일정을 확인하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(5, 10).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.description || "설명이 없습니다"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks View */}
      {selectedView === "tasks" && (
        <div className="space-y-6">
          {/* Automated Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                자동화 작업
              </CardTitle>
              <CardDescription>
                설정된 자동화 작업들을 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <div>
                        <div className="font-medium">{task.name}</div>
                        <div className="text-sm text-muted-foreground">{task.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.isActive ? "default" : "secondary"}>
                        {task.isActive ? "활성" : "비활성"}
                      </Badge>
                      <Form method="post">
                        <input type="hidden" name="action" value="toggle_task" />
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="isActive" value={(!task.isActive).toString()} />
                        <Button size="sm" variant="outline" type="submit">
                          {task.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      </Form>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Executions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                작업 실행 기록
              </CardTitle>
              <CardDescription>
                최근 자동화 작업 실행 결과를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution: any) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {execution.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : execution.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <div>
                        <div className="font-medium">작업 실행</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(execution.startTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={execution.status === "success" ? "default" : "destructive"}>
                        {execution.status}
                      </Badge>
                      {execution.duration && (
                        <span className="text-sm text-muted-foreground">
                          {execution.duration}초
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            시간 추적
          </CardTitle>
          <CardDescription>
            작업 시간을 추적하고 생산성을 분석하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeEntries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{entry.taskName}</div>
                    <div className="text-sm text-muted-foreground">{entry.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{entry.duration}분</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(entry.startTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            워크플로우
          </CardTitle>
          <CardDescription>
            복잡한 작업을 자동화하는 워크플로우를 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow: any) => (
              <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-sm text-muted-foreground">{workflow.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.isActive ? "default" : "secondary"}>
                    {workflow.isActive ? "활성" : "비활성"}
                  </Badge>
                  <Button size="sm" variant="outline">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Event Form */}
      {showEventForm && (
        <Card>
          <CardHeader>
            <CardTitle>새 일정 추가</CardTitle>
            <CardDescription>
              새로운 일정을 추가하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="action" value="create_event" />
              
              <div className="space-y-2">
                <Label htmlFor="title">제목</Label>
                <Input name="title" placeholder="일정 제목" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea name="description" placeholder="일정에 대한 설명" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">시작 시간</Label>
                  <Input name="startTime" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">종료 시간</Label>
                  <Input name="endTime" type="datetime-local" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">유형</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">회의</SelectItem>
                      <SelectItem value="task">작업</SelectItem>
                      <SelectItem value="reminder">알림</SelectItem>
                      <SelectItem value="deadline">마감일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">우선순위</Label>
                  <Select name="priority" required>
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

              <div className="space-y-2">
                <Label htmlFor="location">위치</Label>
                <Input name="location" placeholder="회의실 또는 위치" />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "추가 중..." : "일정 추가"}
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
      )}
    </div>
  );
} 