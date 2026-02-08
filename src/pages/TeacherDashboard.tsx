import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { QuizCard } from '@/components/QuizCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateRoomCode } from '@/lib/quizGenerator';
import { toast } from 'sonner';
import { QuizCreator } from '@/components/teacher/QuizCreator';
import {
  LogOut,
  Plus,
  Play,
  Copy,
  Users,
  Shuffle,
  Clock,
  GraduationCap,
  School,
  Hand,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Quiz {
  id: string;
  title: string;
  description: string;
  quiz_type: 'dynamic' | 'static';
  dynamic_subtype: string | null;
  question_count: number;
  time_limit_seconds: number | null;
}

interface Room {
  id: string;
  room_code: string;
  class_name: string | null;
  grade_level: number | null;
  is_active: boolean;
  quiz_id: string | null;
  created_at: string;
  question_mode: 'automatic' | 'manual';
  quizzes?: Quiz;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Room creation form
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<string>('');
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(true);
  const [useTimeLimit, setUseTimeLimit] = useState(true);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState(15);
  const [questionMode, setQuestionMode] = useState<'automatic' | 'manual'>('automatic');

  useEffect(() => {
    if (!user) {
      navigate('/teacher/login');
      return;
    }

    const init = async () => {
      setInitialLoading(true);
      await Promise.all([fetchQuizzes(), fetchRooms()]);
      setInitialLoading(false);
    };
    init();
  }, [user, navigate]);

  const fetchQuizzes = async () => {
    if (!user) return;
    const data = await QuizService.fetchQuizzes(user.id);
    setQuizzes(data as Quiz[]);
  };

  const fetchRooms = async () => {
    if (!user) return;
    const data = await QuizService.fetchRooms(user.id);
    setRooms(data as Room[]);
  };

  const handleCreateRoom = async () => {
    if (!selectedQuiz) {
      toast.error('Kérlek válassz egy kvízt!');
      return;
    }

    setLoading(true);
    const roomCode = generateRoomCode();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        teacher_id: user?.id,
        quiz_id: selectedQuiz.id,
        class_name: className || null,
        grade_level: gradeLevel ? parseInt(gradeLevel) : null,
        randomize_questions: randomizeQuestions,
        randomize_answers: randomizeAnswers,
        time_limit_per_question: useTimeLimit ? timeLimitPerQuestion : null,
        question_mode: questionMode,
      })
      .select()
      .single();

    if (error) {
      toast.error('Hiba történt a szoba létrehozásakor: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success(`Szoba létrehozva! Kód: ${roomCode}`);
    setShowCreateRoom(false);
    fetchRooms();
    setLoading(false);

    // Reset form
    setClassName('');
    setGradeLevel('');
    setSelectedQuiz(null);
    setQuestionMode('automatic');
  };

  const handleDeleteRoom = async (roomId: string) => {
    const success = await QuizService.deleteRoom(roomId);
    if (success) fetchRooms();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kód másolva a vágólapra!');
  };

  const handleStartRoom = async (room: Room) => {
    await supabase
      .from('rooms')
      .update({ started_at: new Date().toISOString() })
      .eq('id', room.id);

    navigate(`/teacher/room/${room.room_code}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (showQuizCreator) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-10">
        <QuizCreator
          onClose={() => setShowQuizCreator(false)}
          onRefresh={fetchQuizzes}
        />
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl font-medium font-fredoka">Műszerfal betöltése...</p>
        </div>
      </div>
    );
  }

  if (showQuizCreator) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-10">
        <QuizCreator
          onClose={() => setShowQuizCreator(false)}
          onRefresh={fetchQuizzes}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowQuizCreator(true)}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Saját kvíz készítése
            </Button>
            <span className="text-muted-foreground hidden md:block">
              <GraduationCap className="w-4 h-4 inline mr-1" />
              Tanári fiók
            </span>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Kilépés
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Create Room Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-fredoka">Új szoba létrehozása</h2>
            <Button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              variant={showCreateRoom ? 'outline' : 'default'}
            >
              <Plus className="w-4 h-4 mr-2" />
              {showCreateRoom ? 'Mégse' : 'Új szoba'}
            </Button>
          </div>

          {showCreateRoom && (
            <div className="quiz-card animate-fade-in">
              <h3 className="text-xl font-bold mb-6">Válassz kvízt</h3>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {quizzes.length === 0 ? (
                  <div className="col-span-full text-center py-10 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-primary opacity-50" />
                    <p className="font-medium">Még nincs saját kvízed.</p>
                    <p className="text-sm text-muted-foreground">Készíts egyet a fejlécben található gombbal!</p>
                  </div>
                ) : (
                  quizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      title={quiz.title}
                      description={quiz.description || ''}
                      type={quiz.quiz_type}
                      questionCount={quiz.question_count || 10}
                      timeLimit={quiz.time_limit_seconds || undefined}
                      onClick={() => setSelectedQuiz(quiz)}
                      selected={selectedQuiz?.id === quiz.id}
                    />
                  ))
                )}
              </div>

              {selectedQuiz && (
                <div className="border-t pt-6 mt-6 space-y-6 animate-fade-in">
                  <h3 className="text-xl font-bold">Szoba beállítások</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="className" className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        Osztály neve (opcionális)
                      </Label>
                      <Input
                        id="className"
                        placeholder="pl. 5.A"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gradeLevel" className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Évfolyam (opcionális)
                      </Label>
                      <Select value={gradeLevel} onValueChange={setGradeLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Válassz évfolyamot" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                            <SelectItem key={g} value={g.toString()}>
                              {g}. osztály
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                      <div className="flex items-center gap-3">
                        <Shuffle className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Kérdések keverése</p>
                          <p className="text-sm text-muted-foreground">
                            Véletlenszerű sorrend minden diáknak
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={randomizeQuestions}
                        onCheckedChange={setRandomizeQuestions}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                      <div className="flex items-center gap-3">
                        <Shuffle className="w-5 h-5 text-secondary" />
                        <div>
                          <p className="font-medium">Válaszok keverése</p>
                          <p className="text-sm text-muted-foreground">
                            A válaszlehetőségek véletlenszerű sorrendben
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={randomizeAnswers}
                        onCheckedChange={setRandomizeAnswers}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-medium">Időlimit</p>
                          <p className="text-sm text-muted-foreground">
                            {useTimeLimit ? `${timeLimitPerQuestion} másodperc kérdésenként` : 'Nincs időlimit'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {useTimeLimit && (
                          <Input
                            type="number"
                            value={timeLimitPerQuestion}
                            onChange={(e) => setTimeLimitPerQuestion(parseInt(e.target.value) || 15)}
                            className="w-20"
                            min={5}
                            max={120}
                          />
                        )}
                        <Switch
                          checked={useTimeLimit}
                          onCheckedChange={setUseTimeLimit}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
                      <div className="flex items-center gap-3">
                        <Hand className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Kérdések kezelése</p>
                          <p className="text-sm text-muted-foreground">
                            {questionMode === 'automatic'
                              ? 'Automatikus: a diákok saját tempóban haladnak'
                              : 'Manuális: te indítod a kérdéseket egyesével'}
                          </p>
                        </div>
                      </div>
                      <Select value={questionMode} onValueChange={(v: 'automatic' | 'manual') => setQuestionMode(v)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">Automatikus</SelectItem>
                          <SelectItem value="manual">Manuális</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="w-full h-14 text-lg font-bold shadow-button"
                    size="lg"
                  >
                    {loading ? 'Létrehozás...' : 'Szoba létrehozása'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Active Rooms Section */}
        <section>
          <h2 className="text-2xl font-fredoka mb-6">Szobáim</h2>

          {rooms.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-3xl bg-muted/30 border-2 border-dashed border-muted">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Még nincs létrehozott szobád.</p>
              <p className="text-sm text-muted-foreground mt-1">Kattints az "Új szoba" gombra a kezdéshez!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room.id} className="quiz-card group relative">
                  {!room.is_active && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Törlés megerősítése</AlertDialogTitle>
                          <AlertDialogDescription>
                            Biztosan törölni szeretnéd ezt a szobát? Ez a művelet nem vonható vissza.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Mégse</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRoom(room.id)} className="bg-destructive hover:bg-destructive/90">
                            Törlés
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${room.is_active ? 'bg-success animate-pulse' : 'bg-muted'}`} />
                      <span className={`text-sm font-medium ${room.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                        {room.is_active ? 'Aktív' : 'Lezárt'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-tighter font-bold">Szoba kód</p>
                    <div className="relative inline-block">
                      <p className="text-4xl font-fredoka tracking-[0.2em] text-primary pl-[0.2em]">
                        {room.room_code}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -right-10 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => handleCopyCode(room.room_code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {room.quizzes && (
                      <div className="flex items-center gap-2 text-sm">
                        <Play className="w-4 h-4 text-primary" />
                        <span className="font-semibold truncate">{room.quizzes.title}</span>
                      </div>
                    )}
                    {(room.class_name || room.grade_level) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <School className="w-4 h-4" />
                        <span>
                          {room.class_name || ''}
                          {room.class_name && room.grade_level ? ' • ' : ''}
                          {room.grade_level ? `${room.grade_level}. osztály` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11"
                      onClick={() => navigate(`/teacher/results/${room.room_code}`)}
                    >
                      Eredmények
                    </Button>
                    <Button
                      className="flex-1 h-11 shadow-button"
                      disabled={!room.is_active}
                      onClick={() => handleStartRoom(room)}
                    >
                      <Hand className="w-4 h-4 mr-2" />
                      Irányítás
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
