import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

export default function JoinRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [roomData, setRoomData] = useState<any>(null);

  useEffect(() => {
    checkRoom();
  }, [code]);

  const checkRoom = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, quizzes(*)')
      .eq('room_code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      setRoomExists(false);
      return;
    }

    setRoomExists(true);
    setRoomData(data);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      toast.error('Kérlek írd be a neved!');
      return;
    }

    setLoading(true);

    const { data: participant, error } = await supabase
      .from('participants')
      .insert({
        room_id: roomData.id,
        student_name: studentName.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Hiba történt a csatlakozás során!');
      setLoading(false);
      return;
    }

    // Store participant info in session
    sessionStorage.setItem('participantId', participant.id);
    sessionStorage.setItem('participantName', studentName.trim());

    navigate(`/quiz/${code}`);
  };

  if (roomExists === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (roomExists === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-fredoka text-destructive mb-4">
            Szoba nem található
          </h1>
          <p className="text-muted-foreground mb-6">
            Ez a szoba nem létezik vagy már lezárult.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a főoldalra
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <Logo size="md" />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="glass-card p-8 md:p-10 w-full max-w-md animate-scale-in">
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-2">Csatlakozás a szobához</p>
            <p className="text-4xl font-fredoka tracking-widest text-primary mb-2">
              {code}
            </p>
            {roomData.quizzes && (
              <p className="text-lg font-medium text-foreground">
                {roomData.quizzes.title}
              </p>
            )}
            {roomData.class_name && (
              <p className="text-muted-foreground">{roomData.class_name}</p>
            )}
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg">
                Mi a neved?
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Írd be a neved..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="pl-11 h-14 text-lg"
                  autoFocus
                  maxLength={50}
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                A neved látható lesz a tanár számára az eredményeknél.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold shadow-button"
              disabled={loading || !studentName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Csatlakozás...
                </>
              ) : (
                <>
                  Kvíz indítása
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
