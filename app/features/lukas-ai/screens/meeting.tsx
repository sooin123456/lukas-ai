/**
 * Real-time Meeting Screen
 * 
 * This component provides real-time meeting functionality including:
 * - Audio recording and transcription
 * - Speaker identification
 * - Real-time summary generation
 * - Meeting session management
 */
import type { Route } from "./+types/meeting";

import { useState, useRef, useEffect } from "react";
import { useLoaderData, useActionData, Form } from "react-router";
import { data } from "react-router";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";

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
  // This is a temporary implementation
  return { id: "temp-user-id" };
}

export async function loader({ request }: any) {
  const user = await requireUser(request);
  
  // Get recent meeting sessions
  const sessions = await db
    .select({
      id: meetingSessions.id,
      title: meetingSessions.title,
      description: meetingSessions.description,
      startTime: meetingSessions.startTime,
      endTime: meetingSessions.endTime,
      status: meetingSessions.status,
      participants: meetingSessions.participants,
      settings: meetingSessions.settings,
    })
    .from(meetingSessions)
    .where(eq(meetingSessions.userId, user.id))
    .orderBy(desc(meetingSessions.startTime))
    .limit(10);

  // Get recent transcripts
  const transcripts = await db
    .select({
      id: meetingTranscripts.id,
      meetingId: meetingTranscripts.meetingId,
      speakerId: meetingTranscripts.speakerId,
      speakerName: meetingTranscripts.speakerName,
      content: meetingTranscripts.content,
      timestamp: meetingTranscripts.timestamp,
      confidence: meetingTranscripts.confidence,
    })
    .from(meetingTranscripts)
    .where(eq(meetingTranscripts.meetingId, meetingSessions.id))
    .orderBy(desc(meetingTranscripts.timestamp))
    .limit(50);

  // Get recent summaries
  const summaries = await db
    .select({
      id: meetingSummaries.id,
      meetingId: meetingSummaries.meetingId,
      summary: meetingSummaries.summary,
      keyPoints: meetingSummaries.keyPoints,
      actionItems: meetingSummaries.actionItems,
      decisions: meetingSummaries.decisions,
      nextSteps: meetingSummaries.nextSteps,
      created_at: meetingSummaries.created_at,
    })
    .from(meetingSummaries)
    .where(eq(meetingSummaries.meetingId, meetingSessions.id))
    .orderBy(desc(meetingSummaries.created_at))
    .limit(5);

  return {
    sessions,
    transcripts,
    summaries,
  };
}

export async function action({ request }: any) {
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
          status: "active",
          participants,
          settings: { recording: true, transcription: true },
        })
        .returning();

      return { success: true, session };
    }

    case "end_session": {
      const sessionId = formData.get("sessionId") as string;

      await db
        .update(meetingSessions)
        .set({
          endTime: new Date(),
          status: "ended",
        })
        .where(eq(meetingSessions.id, sessionId));

      return { success: true };
    }

    case "add_transcript": {
      const meetingId = formData.get("meetingId") as string;
      const speakerId = formData.get("speakerId") as string;
      const speakerName = formData.get("speakerName") as string;
      const content = formData.get("content") as string;
      const timestamp = new Date(formData.get("timestamp") as string);
      const confidence = parseInt(formData.get("confidence") as string);

      await db
        .insert(meetingTranscripts)
        .values({
          meetingId,
          speakerId,
          speakerName,
          content,
          timestamp,
          confidence,
        });

      return { success: true };
    }

    case "add_summary": {
      const meetingId = formData.get("meetingId") as string;
      const summary = formData.get("summary") as string;
      const keyPoints = formData.get("keyPoints") ? JSON.parse(formData.get("keyPoints") as string) : [];
      const actionItems = formData.get("actionItems") ? JSON.parse(formData.get("actionItems") as string) : [];
      const decisions = formData.get("decisions") ? JSON.parse(formData.get("decisions") as string) : [];
      const nextSteps = formData.get("nextSteps") as string;

      await db
        .insert(meetingSummaries)
        .values({
          meetingId,
          summary,
          keyPoints,
          actionItems,
          decisions,
          nextSteps,
        });

      return { success: true };
    }

    default:
      return { error: "Invalid action" };
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
 * Real-time Meeting Screen
 * 
 * This component provides real-time meeting functionality including:
 * - Audio recording and transcription
 * - Speaker identification
 * - Real-time summary generation
 * - Meeting session management
 */
export default function MeetingScreen() {
  const { sessions, transcripts, summaries } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [speakers, setSpeakers] = useState<string[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start recording
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you would send the audio to your transcription service
        console.log('Recording stopped, audio blob:', audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Simulate real-time transcription
  const simulateTranscription = () => {
    const sampleTexts = [
      "안녕하세요, 오늘 회의를 시작하겠습니다.",
      "첫 번째 안건은 프로젝트 진행 상황입니다.",
      "다음 주까지 마감해야 할 작업들이 있습니다.",
      "팀원들의 의견을 들어보겠습니다.",
      "결론적으로 다음 단계를 진행하겠습니다."
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < sampleTexts.length) {
        setTranscript(prev => prev + "\n" + sampleTexts[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  };

  // Generate summary
  const generateSummary = () => {
    const sampleSummary = `
회의 요약:
- 프로젝트 진행 상황 점검
- 다음 주 마감 작업 논의
- 팀원 의견 수렴
- 다음 단계 계획 수립

주요 결정사항:
1. 프로젝트 일정 조정
2. 추가 리소스 할당
3. 다음 회의 일정 확정
    `;
    setSummary(sampleSummary);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">실시간 회의</h1>
          <p className="text-muted-foreground">회의를 녹음하고 실시간으로 요약을 생성합니다</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
          >
            녹음 시작
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50"
          >
            녹음 중지
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Recording Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">녹음 제어</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span>{isRecording ? '녹음 중...' : '대기 중'}</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={simulateTranscription}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  실시간 전사 시뮬레이션
                </button>
                <button
                  onClick={generateSummary}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                  요약 생성
                </button>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">최근 회의</h2>
            <div className="space-y-3">
              {sessions && sessions.length > 0 ? (
                sessions.map((session: any) => (
                  <div key={session.id} className="border rounded-lg p-3">
                    <h3 className="font-medium">{session.title}</h3>
                    <p className="text-sm text-gray-600">{session.description}</p>
                    <p className="text-xs text-gray-500">
                      {session.startTime && new Date(session.startTime).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">최근 회의가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Transcript */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">실시간 전사</h2>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{transcript || "전사 내용이 여기에 표시됩니다..."}</pre>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">회의 요약</h2>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{summary || "요약이 여기에 표시됩니다..."}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Summaries */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">최근 요약</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries && summaries.length > 0 ? (
            summaries.map((summary: any) => (
              <div key={summary.id} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-medium mb-2">회의 요약</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{summary.summary}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {summary.created_at && new Date(summary.created_at).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500">최근 요약이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
} 