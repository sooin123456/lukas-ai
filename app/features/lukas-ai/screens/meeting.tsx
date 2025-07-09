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

import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  Loader
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, useFetcher } from "react-router";

import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";
import { Input } from "~/core/components/ui/input";
import { Label } from "~/core/components/ui/label";
import { Textarea } from "~/core/components/ui/textarea";
import { Badge } from "~/core/components/ui/badge";
import { ScrollArea } from "~/core/components/ui/scroll-area";
import { requireDepartmentManager } from "~/core/lib/guards.server";
import makeServerClient from "~/core/lib/supa-client.server";

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

/**
 * Loader function for authentication and initial data
 */
export async function loader({ request }: Route.LoaderArgs) {
  const [client] = makeServerClient(request);
  await requireDepartmentManager(client);

  // TODO: Load user's meeting sessions and settings
  return {
    meetings: [],
    settings: {
      autoTranscribe: true,
      speakerIdentification: true,
      realTimeSummary: false,
    },
  };
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
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [summary, setSummary] = useState("");
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fetcher = useFetcher();

  /**
   * Start recording
   */
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
        // TODO: Send audio to server for processing
        console.log('Recording stopped, audio blob:', audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Simulate real-time transcription
      simulateTranscription();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  /**
   * Pause/Resume recording
   */
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        // Pause timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Generate summary
      generateSummary();
    }
  };

  /**
   * Simulate real-time transcription
   */
  const simulateTranscription = () => {
    const speakers = ['김부장', '이과장', '박대리', '정사원'];
    const sampleTexts = [
      '안녕하세요, 오늘 회의 시작하겠습니다.',
      '네, 지난 주 진행상황부터 말씀드리겠습니다.',
      '매출이 예상보다 좋네요.',
      '다음 주까지 마무리하겠습니다.',
      '혹시 추가로 논의할 사항 있으신가요?',
      '네, 그럼 회의 마무리하겠습니다.'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (!isRecording) {
        clearInterval(interval);
        return;
      }

      const speaker = speakers[Math.floor(Math.random() * speakers.length)];
      const text = sampleTexts[index % sampleTexts.length];
      
      const newTranscript: Transcript = {
        id: Date.now().toString(),
        speakerName: speaker,
        content: text,
        timestamp: new Date(),
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
      };

      setTranscripts(prev => [...prev, newTranscript]);
      setCurrentSpeaker(speaker);
      index++;
    }, 3000);
  };

  /**
   * Generate meeting summary
   */
  const generateSummary = async () => {
    if (transcripts.length === 0) return;

    // Simulate AI summary generation
    setSummary("회의에서 주요 논의사항과 결정사항을 정리한 요약입니다.");
    
    // Simulate action items extraction
    setActionItems([
      "다음 주까지 프로젝트 마무리",
      "팀 회의 일정 조율",
      "예산 검토 및 보고서 작성"
    ]);
  };

  /**
   * Format time in MM:SS
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">실시간 회의</h1>
          <p className="text-muted-foreground">
            AI가 실시간으로 회의를 기록하고 요약합니다
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Meeting Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Meeting Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                회의 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meeting-title">회의 제목</Label>
                <Input
                  id="meeting-title"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="회의 제목을 입력하세요"
                />
              </div>
              <div>
                <Label htmlFor="participants">참석자</Label>
                <Textarea
                  id="participants"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="참석자 이름을 입력하세요 (쉼표로 구분)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Recording Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                녹음 제어
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">녹음 시간</span>
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
              </div>
              
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording} 
                    className="flex-1"
                    disabled={!meetingTitle}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    녹음 시작
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={togglePause} 
                      variant="outline"
                      className="flex-1"
                    >
                      {isPaused ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          재개
                        </>
                      ) : (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          일시정지
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={stopRecording} 
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      녹음 종료
                    </Button>
                  </>
                )}
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>현재 녹음 중...</span>
                  {currentSpeaker && (
                    <Badge variant="secondary">
                      현재 화자: {currentSpeaker}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                실시간 상태
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">음성 인식</span>
                <Badge variant="outline" className="bg-green-50">
                  활성
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">화자 구분</span>
                <Badge variant="outline" className="bg-blue-50">
                  활성
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">실시간 요약</span>
                <Badge variant="outline" className="bg-yellow-50">
                  대기
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Transcript */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                실시간 회의록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {transcripts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Mic className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>녹음을 시작하면 실시간 회의록이 표시됩니다.</p>
                    </div>
                  ) : (
                    transcripts.map((transcript) => (
                      <div key={transcript.id} className="flex gap-3">
                        <div className="flex-shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {transcript.speakerName}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{transcript.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {transcript.timestamp.toLocaleTimeString()} 
                            (신뢰도: {transcript.confidence}%)
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Section */}
      {(summary || actionItems.length > 0) && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                회의 요약
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {summary && (
                <div>
                  <h4 className="font-semibold mb-2">회의 요약</h4>
                  <p className="text-sm text-muted-foreground">{summary}</p>
                </div>
              )}
              
              {actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">액션 아이템</h4>
                  <ul className="space-y-2">
                    {actionItems.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 