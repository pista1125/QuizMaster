import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  Download, 
  CheckCircle, 
  XCircle,
  Clock,
  Medal
} from 'lucide-react';

interface Participant {
  id: string;
  student_name: string;
  joined_at: string;
  finished_at: string | null;
  answers: Answer[];
}

interface Answer {
  question_index: number;
  question_text: string;
  given_answer: string;
  correct_answer: string;
  is_correct: boolean;
  time_taken_seconds: number | null;
}

export default function TeacherResults() {
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
    loadResults();
  }, [user, code]);

  const loadResults = async () => {
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
      .select('*, answers(*)')
      .eq('room_id', room.id)
      .order('joined_at');

    if (participantsData) {
      setParticipants(participantsData as unknown as Participant[]);
    }

    setLoading(false);
  };

  const getScore = (participant: Participant) => {
    return participant.answers.filter((a) => a.is_correct).length;
  };

  const getTotalQuestions = (participant: Participant) => {
    return participant.answers.length;
  };

  const getPercentage = (participant: Participant) => {
    const total = getTotalQuestions(participant);
    if (total === 0) return 0;
    return Math.round((getScore(participant) / total) * 100);
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = getScore(a);
    const scoreB = getScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    
    const timeA = a.answers.reduce((sum, ans) => sum + (ans.time_taken_seconds || 0), 0);
    const timeB = b.answers.reduce((sum, ans) => sum + (ans.time_taken_seconds || 0), 0);
    return timeA - timeB;
  });

  const exportResults = () => {
    let csv = 'Név,Pontszám,Összesen,Százalék,Összes idő\n';
    
    sortedParticipants.forEach((p) => {
      const totalTime = p.answers.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);
      csv += `"${p.student_name}",${getScore(p)},${getTotalQuestions(p)},${getPercentage(p)}%,${totalTime}mp\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eredmenyek_${code}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
          <Button onClick={exportResults}>
            <Download className="w-4 h-4 mr-2" />
            Exportálás CSV
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Room Info */}
        <div className="quiz-card mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Szoba kód</p>
              <p className="text-3xl font-fredoka text-primary tracking-widest">{code}</p>
            </div>
            {roomData?.quizzes && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Kvíz</p>
                <p className="text-xl font-bold">{roomData.quizzes.title}</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="quiz-card text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-3xl font-bold">{participants.length}</p>
            <p className="text-muted-foreground">Résztvevő</p>
          </div>
          <div className="quiz-card text-center">
            <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {participants.length > 0
                ? Math.round(
                    participants.reduce((sum, p) => sum + getPercentage(p), 0) /
                      participants.length
                  )
                : 0}
              %
            </p>
            <p className="text-muted-foreground">Átlag pontszám</p>
          </div>
          <div className="quiz-card text-center">
            <Trophy className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {participants.filter((p) => p.finished_at).length}
            </p>
            <p className="text-muted-foreground">Befejezett</p>
          </div>
        </div>

        {/* Leaderboard */}
        <h2 className="text-2xl font-fredoka mb-4">Ranglista</h2>
        
        {sortedParticipants.length === 0 ? (
          <div className="quiz-card text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Még nincs résztvevő.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className={`quiz-card flex items-center gap-4 ${
                  index < 3 ? 'border-2 border-accent' : ''
                }`}
              >
                <div className="flex-shrink-0 w-12 text-center">
                  {index === 0 ? (
                    <Medal className="w-8 h-8 text-yellow-500 mx-auto" />
                  ) : index === 1 ? (
                    <Medal className="w-8 h-8 text-gray-400 mx-auto" />
                  ) : index === 2 ? (
                    <Medal className="w-8 h-8 text-orange-500 mx-auto" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-bold text-lg">{participant.student_name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                      {getScore(participant)} helyes
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-destructive" />
                      {getTotalQuestions(participant) - getScore(participant)} hibás
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {participant.answers.reduce(
                        (sum, a) => sum + (a.time_taken_seconds || 0),
                        0
                      )}
                      mp
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-fredoka text-primary">
                    {getPercentage(participant)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getScore(participant)}/{getTotalQuestions(participant)}
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
