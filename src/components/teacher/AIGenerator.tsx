import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedQS {
    question_text: string;
    correct_answer: string;
    wrong_answers: string[];
}

interface AIGeneratorProps {
    onQuestionsGenerated: (questions: GeneratedQS[]) => void;
}

export function AIGenerator({ onQuestionsGenerated }: AIGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState<GeneratedQS[]>([]);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            toast.error('Kérlek adj meg egy témát!');
            return;
        }

        setLoading(true);
        // Szimulált AI generálás - Később OpenAI/Supabase Edge Function-re cserélhető
        setTimeout(() => {
            const mockQuestions: GeneratedQS[] = [
                {
                    question_text: `Mi a legfontosabb jellemzője a következő témának: ${topic}?`,
                    correct_answer: "A pontos meghatározása",
                    wrong_answers: ["Nem létezik", "Mindig változik", "Nincs jelentősége"]
                },
                {
                    question_text: `Melyik állítás igaz a(z) ${topic} kapcsán?`,
                    correct_answer: "Ez egy alapvető tudományos fogalom",
                    wrong_answers: ["Csak elméletben létezik", "Már elavult", "Senki sem tudja"]
                },
                {
                    question_text: `Mikor találkoztunk először a(z) ${topic} jelenséggel a történelemben?`,
                    correct_answer: "Az újkori felfedezések idején",
                    wrong_answers: ["Az ókorban", "A jövőben", "Tegnap"]
                },
                {
                    question_text: `Melyik eszköz szükséges a(z) ${topic} vizsgálatához?`,
                    correct_answer: "Logikus gondolkodás",
                    wrong_answers: ["Távcső", "Mikroszkóp", "Semmi"]
                },
                {
                    question_text: `Hogyan befolyásolja a(z) ${topic} a mindennapi életünket?`,
                    correct_answer: "Segít jobban megérteni a világot",
                    wrong_answers: ["Nincs hatással rá", "Megnehezíti azt", "Csak a tudósokat érdekli"]
                }
            ];

            setGenerated(mockQuestions);
            setLoading(false);
            toast.success('Kérdések sikeresen generálva!');
        }, 2000);
    };

    const handleAddAll = () => {
        onQuestionsGenerated(generated);
        setGenerated([]);
        setTopic('');
    };

    return (
        <div className="space-y-6 p-4 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">AI Kérdés Generátor</h3>
            </div>

            <div className="space-y-2">
                <Label htmlFor="topic">Téma vagy kulcsszó</Label>
                <div className="flex gap-2">
                    <Input
                        id="topic"
                        placeholder="pl. Newton törvényei, Magyarország folyói..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={loading}
                    />
                    <Button onClick={handleGenerate} disabled={loading || !topic}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generálás'}
                    </Button>
                </div>
            </div>

            {generated.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-background rounded-lg border">
                        {generated.map((q, i) => (
                            <div key={i} className="text-sm p-2 border-b last:border-0">
                                <p className="font-medium text-primary">{i + 1}. {q.question_text}</p>
                                <p className="text-success text-xs">✓ {q.correct_answer}</p>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleAddAll} className="w-full bg-success hover:bg-success/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Összes hozzáadása a kvízhez
                    </Button>
                </div>
            )}
        </div>
    );
}
