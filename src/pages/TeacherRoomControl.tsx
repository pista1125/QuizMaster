import { useState, useEffect } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
  id: string;
  student_name: string;
  joined_at: string;
  finished_at: string | null;
}

export default function TeacherRoomControl() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/teacher/login');
      return;
    }
    loadRoom();
    subscribeToParticipants();
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

    setRoomData(room);

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

  const subscribeToParticipants = () => {
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
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const finishedCount = participants.filter((p) => p.finished_at).length;

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
        </div>

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
                className={`quiz-card flex items-center gap-3 ${
                  participant.finished_at ? 'border-2 border-success' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    participant.finished_at
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
