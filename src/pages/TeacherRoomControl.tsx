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
  const [questions, setQuestions] = useState<any[]>([]);
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

    // Get questions
    if (room.quizzes.quiz_type === 'static') {
      const { data: qData } = await supabase
        .from('static_questions')
        .select('*')
        .eq('quiz_id', room.quiz_id)
        .order('order_index');

      setQuestions(qData || []);
      setTotalQuestions(qData?.length || 0);
    } else {
      // For dynamic, we might need a way to share the seed or generated list
      // For now, let's just set the count
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
          <p className="text-muted-foreground mb-2 text-sm uppercase font-bold tracking-wider">Szoba kód</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-6xl md:text-8xl font-fredoka tracking-[0.2em] text-primary pl-[0.2em]">
              {code}
            </p>
            <Button variant="ghost" size="icon" onClick={handleCopyCode} className="h-12 w-12">
              <Copy className="w-6 h-6" />
            </Button>
          </div>
          {roomData?.quizzes && (
            <p className="mt-4 text-2xl font-fredoka text-muted-foreground">{roomData.quizzes.title}</p>
          )}
          <div className="mt-4">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${isManualMode
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-secondary/10 text-secondary border border-secondary/20'
              }`}>
              {isManualMode ? '🖐️ MANUÁLIS MÓD' : '⚡ AUTOMATIKUS MÓD'}
            </span>
          </div>
        </div>

        {isManualMode ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Question Controls Section */}
              <div className="quiz-card">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Kérdések irányítása
                </h3>

                {totalQuestions > 0 && (
                  <div className="mb-8 border-b pb-6 border-muted/30">
                    <ProgressBar
                      current={hasStarted ? (currentQuestionIndex ?? 0) + 1 : 0}
                      total={totalQuestions}
                    />
                    <div className="flex justify-between mt-3 text-sm font-bold">
                      <span className="text-muted-foreground">Haladás: {(hasStarted ? (currentQuestionIndex ?? 0) + 1 : 0)} / {totalQuestions}</span>
                      <span className="text-primary">{Math.round(((hasStarted ? (currentQuestionIndex ?? 0) + 1 : 0) / totalQuestions) * 100)}%</span>
                    </div>
                  </div>
                )}

                {!hasStarted ? (
                  <div className="text-center py-10">
                    <Button
                      onClick={() => handleStartQuestion(0)}
                      size="lg"
                      className="w-full md:w-auto h-20 px-12 text-2xl font-fredoka bg-success hover:bg-success/90 shadow-xl animate-bounce-subtle"
                    >
                      <Play className="w-8 h-8 mr-4" />
                      KVÍZ INDÍTÁSA
                    </Button>
                    <p className="mt-4 text-muted-foreground">Indítsd el az első kérdést!</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Teacher Visibility: Question & Answers */}
                    {questions[currentQuestionIndex ?? 0] && (
                      <div className="p-6 rounded-3xl bg-primary/5 border-2 border-primary/10 animate-fade-in shadow-inner">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-black text-primary uppercase tracking-widest">Aktuális kérdés</p>
                          <span className="text-xs font-bold px-2 py-1 bg-primary/10 rounded-lg text-primary">
                            {questions[currentQuestionIndex ?? 0].quiz_type === 'dynamic' ? 'Dinamikus' : 'Statikus'}
                          </span>
                        </div>
                        <h4 className="text-2xl md:text-3xl font-fredoka mb-6 leading-tight">
                          {questions[currentQuestionIndex ?? 0].question_text}
                        </h4>

                        <div className="grid md:grid-cols-2 gap-4">
                          {questions[currentQuestionIndex ?? 0].wrong_answers && (
                            [...questions[currentQuestionIndex ?? 0].wrong_answers, questions[currentQuestionIndex ?? 0].correct_answer]
                              .sort()
                              .map((ans: string, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${ans === questions[currentQuestionIndex ?? 0].correct_answer
                                      ? 'bg-success/10 border-success text-success font-bold'
                                      : 'bg-background border-muted/50 text-muted-foreground'
                                    }`}
                                >
                                  {ans === questions[currentQuestionIndex ?? 0].correct_answer && <CheckCircle className="w-5 h-5 text-success" />}
                                  {ans}
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      {roomData?.show_results ? (
                        <Button
                          onClick={handleHideResults}
                          variant="outline"
                          size="lg"
                          className="flex-1 h-14 font-bold border-2"
                        >
                          <EyeOff className="w-5 h-5 mr-2" />
                          Eredmények elrejtése
                        </Button>
                      ) : (
                        <Button
                          onClick={handleShowResults}
                          variant="secondary"
                          size="lg"
                          className="flex-1 h-14 font-bold shadow-md hover:translate-y-[-2px] transition-transform"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Eredmények mutatása
                        </Button>
                      )}
                      <Button
                        onClick={handleNextQuestion}
                        disabled={(currentQuestionIndex ?? 0) >= totalQuestions - 1}
                        size="lg"
                        className="flex-1 h-14 font-fredoka text-xl shadow-button"
                      >
                        Következő kérdés
                        <SkipForward className="w-6 h-6 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Interaction Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="quiz-card group flex flex-col items-center justify-center p-8 bg-primary/5 border-primary/10 transition-all hover:bg-primary/10">
                  <Users className="w-10 h-10 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-5xl font-fredoka text-primary">{participants.length}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Csatlakozott</p>
                </div>
                <div className="quiz-card group flex flex-col items-center justify-center p-8 bg-success/5 border-success/10 transition-all hover:bg-success/10">
                  <CheckCircle className="w-10 h-10 text-success mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-5xl font-fredoka text-success">{finishedCount}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Befejezett</p>
                </div>
              </div>
            </div>

            {/* Participants Sidebar */}
            <aside className="lg:col-span-1">
              <div className="quiz-card h-full flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-fredoka font-bold">Résztvevők</h3>
                  <Button variant="ghost" size="sm" onClick={loadRoom} className="h-10 w-10 p-0 rounded-full hover:bg-muted">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {participants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30 py-12">
                      <Users className="w-16 h-16 mb-4" />
                      <p className="font-medium">Várakozás diákokra...</p>
                    </div>
                  ) : (
                    participants.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-muted/50 group hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shadow-inner">
                            {participant.student_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight">{participant.student_name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${participant.finished_at ? 'bg-success' : 'bg-orange-400 animate-pulse'}`} />
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                {participant.finished_at ? 'Befejezte' : 'Válaszra vár'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {participant.finished_at && (
                          <div className="bg-success/10 p-1.5 rounded-full">
                            <CheckCircle className="w-5 h-5 text-success" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Automatic Mode - Standard View */
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="quiz-card p-8 flex flex-col items-center justify-center">
                <Users className="w-10 h-10 text-primary mb-3" />
                <p className="text-4xl font-fredoka text-primary">{participants.length}</p>
                <p className="text-sm font-bold text-muted-foreground uppercase">Csatlakozott</p>
              </div>
              <div className="quiz-card p-8 flex flex-col items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success mb-3" />
                <p className="text-4xl font-fredoka text-success">{finishedCount}</p>
                <p className="text-sm font-bold text-muted-foreground uppercase">Befejezett</p>
              </div>
            </div>

            <div className="quiz-card">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-fredoka">Résztvevők listája</h2>
                <Button variant="outline" onClick={loadRoom} className="rounded-full">
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Frissítés
                </Button>
              </div>

              {participants.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                  <Users className="w-20 h-20 mx-auto mb-4 opacity-10" />
                  <p className="text-xl font-medium text-muted-foreground">Várakozás a diákokra...</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-5 rounded-2xl bg-card border-2 shadow-sm hover:border-primary/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                          {participant.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{participant.student_name}</p>
                          <p className={`text-xs font-bold uppercase ${participant.finished_at ? 'text-success' : 'text-orange-400'}`}>
                            {participant.finished_at ? 'Kész' : 'Kitöltés alatt...'}
                          </p>
                        </div>
                      </div>
                      {participant.finished_at && (
                        <CheckCircle className="w-6 h-6 text-success" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
