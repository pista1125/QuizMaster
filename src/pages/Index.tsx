import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { RoomCodeInput } from '@/components/RoomCodeInput';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) {
      setError('Kérlek írd be a 6 jegyű szoba kódot!');
      return;
    }

    setLoading(true);
    setError('');

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single();

    if (roomError || !room) {
      setError('Ez a szoba nem található vagy már lezárult.');
      setLoading(false);
      return;
    }

    navigate(`/join/${roomCode}`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="hero-gradient min-h-[60vh] flex flex-col">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Logo size="md" />
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/login')}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            Tanári belépés
          </Button>
        </header>

        <main className="flex-1 container mx-auto px-4 flex flex-col items-center justify-center text-center">
          <div className="animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-white/80" />
              <span className="text-white/80 font-semibold">Interaktív tanulás</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-fredoka text-white mb-6 drop-shadow-lg">
              Tanulj játékosan!
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Csatlakozz az osztályodhoz és versenyezz társaiddal izgalmas kvízeken!
            </p>
          </div>

          {/* Join Room Card */}
          <div className="glass-card p-8 md:p-10 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                Csatlakozás szobához
              </h2>
            </div>

            <RoomCodeInput value={roomCode} onChange={setRoomCode} error={error} />

            <Button
              onClick={handleJoinRoom}
              disabled={loading || roomCode.length !== 6}
              className="w-full mt-6 h-14 text-lg font-bold shadow-button hover:shadow-lg transition-all duration-300"
              size="lg"
            >
              {loading ? (
                <span className="animate-pulse">Keresés...</span>
              ) : (
                <>
                  Belépés
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-fredoka text-center mb-12">
          Miért válaszd a QuizMaster-t?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="quiz-card text-center">
            <div className="w-16 h-16 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Dinamikus kérdések</h3>
            <p className="text-muted-foreground">
              Végtelen számú egyedi kérdés generálva valós időben.
            </p>
          </div>

          <div className="quiz-card text-center">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Osztálytermi élmény</h3>
            <p className="text-muted-foreground">
              Könnyű csatlakozás 6 jegyű kóddal, nincs regisztráció.
            </p>
          </div>

          <div className="quiz-card text-center">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Eredmények követése</h3>
            <p className="text-muted-foreground">
              Részletes eredmények és statisztikák tanároknak.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <Logo size="sm" />
          <p className="mt-4">© 2024 QuizMaster. Készült tanároknak és diákoknak.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
