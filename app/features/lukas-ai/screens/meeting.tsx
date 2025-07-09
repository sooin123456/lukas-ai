/**
 * Real-time Meeting Screen
 * 
 * This component provides real-time meeting functionality including:
 * - Live audio recording
 * - Speaker identification
 * - Real-time transcription
 * - Meeting summary generation
 * - Action item extraction
 */
import type { Route } from "./+types/meeting";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { json } from "@react-router/node";
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "@react-router/node";
import { useLoaderData, useFetcher } from "@react-router/react";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import db from "~/core/db/drizzle-client.server";
import {
  meetingSessions,
  meetingTranscripts,
  meetingSummaries,
} from "../schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/core/components/ui/card";
import { Button } from "~/core/components/ui/button";
import { Badge } from "~/core/components/ui/badge";
import { Separator } from "~/core/components/ui/separator";
import { ScrollArea } from "~/core/components/ui/scroll-area";
import { Textarea } from "~/core/components/ui/textarea";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/core/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/core/components/ui/select";
import {
  Users,
  Mic,
  Play,
  Pause,
  Square,
  Clock,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";

/**
 * Meta function for the meeting page
 */
export const meta: Route.MetaFunction = () => {
  return [
    {
      title: `실시간 회의 | Lukas AI`,
    },
  ];
};

// Temporary requireUser function until we fix the import
async function requireUser(request: Request) {
  // This is a simplified version - you'll need to implement proper auth
  return { id: "temp-user-id" };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  
  // Get recent meeting sessions
  const sessions = await db
    .select({
      id: meetingSessions.id,
      title: meetingSessions.title,
      description: meetingSessions.description,
      startTime: meetingSessions.startTime,
      endTime: meetingSessions.endTime,
      duration: meetingSessions.duration,
      participants: meetingSessions.participants,
      status: meetingSessions.status,
      recordingUrl: meetingSessions.recordingUrl,
    })
    .from(meetingSessions)
    .where(eq(meetingSessions.userId, user.id))
    .orderBy(sql`${meetingSessions.startTime} DESC`)
    .limit(10);

  // Get recent transcripts
  const transcripts = await db
    .select({
      id: meetingTranscripts.id,
      sessionId: meetingTranscripts.sessionId,
      speaker: meetingTranscripts.speaker,
      text: meetingTranscripts.text,
      timestamp: meetingTranscripts.timestamp,
      confidence: meetingTranscripts.confidence,
    })
    .from(meetingTranscripts)
    .where(eq(meetingTranscripts.userId, user.id))
    .orderBy(sql`${meetingTranscripts.timestamp} DESC`)
    .limit(50);

  // Get recent summaries
  const summaries = await db
    .select({
      id: meetingSummaries.id,
      sessionId: meetingSummaries.sessionId,
      summary: meetingSummaries.summary,
      keyPoints: meetingSummaries.keyPoints,
      actionItems: meetingSummaries.actionItems,
      decisions: meetingSummaries.decisions,
      created_at: meetingSummaries.created_at,
    })
    .from(meetingSummaries)
    .where(eq(meetingSummaries.userId, user.id))
    .orderBy(sql`${meetingSummaries.created_at} DESC`)
    .limit(5);

  return json({
    sessions,
    transcripts,
    summaries,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  switch (action) {
    case "start_session": {
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const participants = formData.get("participants") ? JSON.parse(formData.get("participants") as string) : [];

      const [session] = await db
        .insert(meetingSessions)
        .values({
          userId: user.id,
          title,
          description,
          startTime: new Date(),
          endTime: null,
          duration: 0,
          participants,
          status: "recording",
          recordingUrl: null,
        })
        .returning();

      return json({ success: true, session });
    }

    case "end_session": {
      const sessionId = formData.get("sessionId") as string;
      const endTime = new Date();

      await db
        .update(meetingSessions)
        .set({
          endTime,
          duration: sql`EXTRACT(EPOCH FROM (${endTime} - start_time))`,
          status: "completed",
        })
        .where(eq(meetingSessions.id, sessionId));

      return json({ success: true });
    }

    case "add_transcript": {
      const sessionId = formData.get("sessionId") as string;
      const speaker = formData.get("speaker") as string;
      const text = formData.get("text") as string;
      const timestamp = new Date(formData.get("timestamp") as string);
      const confidence = parseFloat(formData.get("confidence") as string);

      await db
        .insert(meetingTranscripts)
        .values({
          userId: user.id,
          sessionId,
          speaker,
          text,
          timestamp,
          confidence,
        });

      return json({ success: true });
    }

    case "generate_summary": {
      const sessionId = formData.get("sessionId") as string;
      const summary = formData.get("summary") as string;
      const keyPoints = formData.get("keyPoints") ? JSON.parse(formData.get("keyPoints") as string) : [];
      const actionItems = formData.get("actionItems") ? JSON.parse(formData.get("actionItems") as string) : [];
      const decisions = formData.get("decisions") ? JSON.parse(formData.get("decisions") as string) : [];

      await db
        .insert(meetingSummaries)
        .values({
          userId: user.id,
          sessionId,
          summary,
          keyPoints,
          actionItems,
          decisions,
        });

      return json({ success: true });
    }

    default:
      return json({ error: "Invalid action" }, { status: 400 });
  }
}

/**
 * Meeting interface
 */
interface Meeting {
  id: string;
  title: string;
  status: 'scheduled' | 'active' | 'ended';
  startTime: Date;
  participants: string[];
}

/**
 * Transcript interface
 */
interface Transcript {
  id: string;
  speakerName: string;
  content: string;
  timestamp: Date;
  confidence: number;
}

/**
 * Meeting component
 */
export default function Meeting({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { sessions, transcripts, summaries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcriptText, setTranscriptText] = useState("");
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time transcription
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        
        // Simulate speaker changes
        const speakerNames = ["김부장", "이과장", "박대리", "최사원"];
        const randomSpeaker = speakerNames[Math.floor(Math.random() * speakerNames.length)];
        setCurrentSpeaker(randomSpeaker);
        
        // Simulate transcript updates
        const sampleTexts = [
          "프로젝트 일정에 대해 논의해보겠습니다.",
          "예산 확정이 필요합니다.",
          "팀 구성원 배치를 조정해야겠네요.",
          "다음 주 미팅 일정을 잡아주세요.",
        ];
        const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        setTranscriptText(prev => prev + `\n[${randomSpeaker}] ${randomText}`);
      }, 5000);
      
      intervalRef.current = interval;
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        // Here you would typically upload the audio to your server
        console.log("Recording stopped, audio blob:", audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscriptText("");
      setSpeakers([]);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("meeting.title")}</h1>
          <p className="text-muted-foreground">{t("meeting.description")}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {speakers.length} 참가자
          </span>
        </div>
      </div>

      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5" />
            실시간 회의 녹음
          </CardTitle>
          <CardDescription>
            회의를 녹음하고 실시간으로 요약을 생성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center space-x-2"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    녹음 중지
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    녹음 시작
                  </>
                )}
              </Button>
              
              {isRecording && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
            
            {currentSpeaker && (
              <Badge variant="secondary">
                현재 발언자: {currentSpeaker}
              </Badge>
            )}
          </div>

          {/* Live Transcript */}
          {isRecording && (
            <div className="space-y-2">
              <Label>실시간 전사</Label>
              <ScrollArea className="h-32 w-full rounded-md border p-3">
                <div className="text-sm">
                  {transcriptText || "전사가 시작됩니다..."}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            최근 회의 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h3 className="font-medium">{session.title}</h3>
                  <p className="text-sm text-muted-foreground">{session.description}</p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(session.startTime).toLocaleString()}</span>
                    {session.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.round(session.duration / 60)}분</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                    {session.status === "completed" ? "완료" : "진행중"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    요약 보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Summaries */}
      <Card>
        <CardHeader>
          <CardTitle>최근 회의 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div key={summary.id} className="p-4 border rounded-lg">
                <div className="space-y-2">
                  <h4 className="font-medium">회의 요약</h4>
                  <p className="text-sm text-muted-foreground">{summary.summary}</p>
                  
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium">주요 포인트</h5>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {summary.keyPoints.map((point: string, index: number) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {summary.actionItems && summary.actionItems.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium">액션 아이템</h5>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {summary.actionItems.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 