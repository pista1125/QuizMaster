import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Users,
  Copy,
  StopCircle,
  RefreshCw,
  CheckCircle,
  Play,
  SkipForward,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { ProgressBar } from '@/components/ProgressBar';

interface Participant {
  id: string;
  student_name: string;
  joined_at: string;
  finished_at: string | null;
}

interface RoomData {
  id: string;
  room_code: string;
  quiz_id: string;
  question_mode: 'automatic' | 'manual';
  current_question_index: number | null;
  question_started_at: string | null;
  show_results: boolean;
  time_limit_per_question: number | null;
  is_active: boolean;
  quizzes: {
    id: string;
    title: string;
    quiz_type: 'dynamic' | 'static';
    question_count: number;
  };
}

export default function TeacherRoomControl() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/teacher/login');
      return;
    }
    loadRoom();
    const unsubscribe = subscribeToParticipants();
    return () => {
      unsubscribe();
    };
  }, [user, code]);

  const loadRoom = async () => {
    const { data: room } = await supabase
      .from('rooms')
      .select('*, quizzes(*)')
      .eq('room_code', code)
      .single();

    if (!room) {
      navigate('/teacher/dashboard');
      return;
    }

    setRoomData(room as unknown as RoomData);

    // Get total questions count
    if (room.quizzes.quiz_type === 'static') {
      const { count } = await supabase
        .from('static_questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', room.quiz_id);
      setTotalQuestions(count || 0);
    } else {
      setTotalQuestions(room.quizzes.question_count || 10);
    }

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('room_id', room.id)
      .order('joined_at');

    if (participantsData) {
      setParticipants(participantsData);
    }

    setLoading(false);
  };

  const subscribeToParticipants = useCallback(() => {
    const channel = supabase
      .channel('participants-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        () => {
          loadRoom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code || '');
    toast.success('Kód másolva a vágólapra!');
  };

  const handleEndRoom = async () => {
    await supabase
      .from('rooms')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('room_code', code);

    toast.success('Szoba lezárva!');
    navigate(`/teacher/results/${code}`);
  };

  // Manual mode controls
  const handleStartQuestion = async (questionIndex: number) => {
    const { error } = await supabase
      .from('rooms')
      .update({
        current_question_index: questionIndex,
        question_started_at: new Date().toISOString(),
        show_results: false
      })
      .eq('room_code', code);

    if (error) {
      console.error("Error starting question:", error);
      toast.error("Hiba történt a kérdés indításakor: " + error.message);
      return;
    }

    toast.success(`${questionIndex + 1}. kérdés elindítva!`);
    loadRoom();
  };

  const handleShowResults = async () => {
    const { error } = await supabase
      .from('rooms')
      .update({ show_results: true })
      .eq('room_code', code);

    if (error) {
      toast.error("Hiba történt az eredmények mutatása közben: " + error.message);
      return;
    }

    toast.success('Eredmények megjelenítve!');
    loadRoom();
  };

  const handleHideResults = async () => {
    const { error } = await supabase
      .from('rooms')
      .update({ show_results: false })
      .eq('room_code', code);

    if (error) {
      toast.error("Hiba történt: " + error.message);
      return;
    }

    loadRoom();
  };

  const handleNextQuestion = async () => {
    const nextIndex = (roomData?.current_question_index ?? -1) + 1;
    if (nextIndex < totalQuestions) {
      await handleStartQuestion(nextIndex);
    } else {
      toast.info('Ez volt az utolsó kérdés!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const finishedCount = participants.filter((p) => p.finished_at).length;
  const isManualMode = roomData?.question_mode === 'manual';
  const currentQuestionIndex = roomData?.current_question_index;
  const hasStarted = currentQuestionIndex !== null && currentQuestionIndex >= 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/teacher/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/teacher/results/${code}`)}>
              Eredmények
            </Button>
            <Button variant="destructive" onClick={handleEndRoom}>
              <StopCircle className="w-4 h-4 mr-2" />
              Kvíz lezárása
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Room Code Display */}
        <div className="quiz-card text-center mb-8">
          <p className="text-muted-foreground mb-2">Szoba kód - írd fel a táblára!</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-6xl md:text-8xl font-fredoka tracking-widest text-primary">
              {code}
            </p>
            <Button variant="outline" size="lg" onClick={handleCopyCode}>
              <Copy className="w-5 h-5" />
            </Button>
          </div>
          {roomData?.quizzes && (
            <p className="mt-4 text-xl">{roomData.quizzes.title}</p>
          )}
          <div className="mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isManualMode
              ? 'bg-primary/10 text-primary'
              : 'bg-secondary/10 text-secondary'
              }`}>
              {isManualMode ? '🖐️ Manuális mód' : '⚡ Automatikus mód'}
            </span>
          </div>
        </div>

        {/* Manual Mode Controls */}
        {isManualMode && (
          <div className="quiz-card mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Kérdések irányítása
            </h3>

            {totalQuestions > 0 && (
              <div className="mb-4">
                <ProgressBar
                  current={hasStarted ? currentQuestionIndex + 1 : 0}
                  total={totalQuestions}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {!hasStarted ? (
                <Button
                  onClick={() => handleStartQuestion(0)}
                  size="lg"
                  className="w-full md:w-auto h-16 text-xl font-bold bg-success hover:bg-success/90 shadow-lg animate-bounce-subtle"
                >
                  <Play className="w-6 h-6 mr-3" />
                  KVÍZ INDÍTÁSA
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex >= totalQuestions - 1}
                    size="lg"
                    className="flex-1 md:flex-none h-14 text-lg font-semibold"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Következő kérdés ({currentQuestionIndex + 2}/{totalQuestions})
                  </Button>

                  {roomData?.show_results ? (
                    <Button
                      onClick={handleHideResults}
                      variant="outline"
                      size="lg"
                      className="h-14"
                    >
                      <EyeOff className="w-5 h-5 mr-2" />
                      Eredmények elrejtése
                    </Button>
                  ) : (
                    <Button
                      onClick={handleShowResults}
                      variant="secondary"
                      size="lg"
                      className="h-14"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Eredmények mutatása
                    </Button>
                  )}
                </>
              )}
            </div>

            {hasStarted && (
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Aktuális folyamat: <strong>{currentQuestionIndex + 1}</strong> / {totalQuestions} kérdés
                  {roomData?.show_results && (
                    <span className="ml-auto text-success font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Eredmények láthatók a diákoknál
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="quiz-card text-center">
            <Users className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-4xl font-bold">{participants.length}</p>
            <p className="text-muted-foreground">Csatlakozott</p>
          </div>
          <div className="quiz-card text-center">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-4xl font-bold">{finishedCount}</p>
            <p className="text-muted-foreground">Befejezett</p>
          </div>
        </div>

        {/* Participants List */}
        <h2 className="text-2xl font-fredoka mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Résztvevők
          <RefreshCw
            className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={loadRoom}
          />
        </h2>

        {participants.length === 0 ? (
          <div className="quiz-card text-center py-12">
            <div className="animate-pulse">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-xl text-muted-foreground">Várakozás a diákokra...</p>
              <p className="text-sm text-muted-foreground mt-2">
                A diákok a főoldalon tudnak csatlakozni a kóddal
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className={`quiz-card flex items-center gap-3 ${participant.finished_at ? 'border-2 border-success' : ''
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${participant.finished_at
                    ? 'bg-success text-success-foreground'
                    : 'hero-gradient text-primary-foreground'
                    }`}
                >
                  {participant.student_name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{participant.student_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {participant.finished_at ? 'Befejezett ✓' : 'Kitöltés alatt...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
