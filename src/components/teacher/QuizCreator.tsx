import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, ArrowLeft, BookOpen, Trash, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AIGenerator } from './AIGenerator';

interface QuestionDraft {
    question_text: string;
    correct_answer: string;
    wrong_answers: string[];
}

interface QuizCreatorProps {
    onClose: () => void;
    onRefresh: () => void;
}

export function QuizCreator({ onClose, onRefresh }: QuizCreatorProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([
        { question_text: '', correct_answer: '', wrong_answers: ['', '', ''] }
    ]);
    const [loading, setLoading] = useState(false);

    const addQuestion = () => {
        setQuestions([...questions, { question_text: '', correct_answer: '', wrong_answers: ['', '', ''] }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index: number, field: keyof QuestionDraft, value: string) => {
        const newQuestions = [...questions];
        if (field === 'question_text' || field === 'correct_answer') {
            newQuestions[index][field] = value;
        }
        setQuestions(newQuestions);
    };

    const updateWrongAnswer = (qIndex: number, aIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].wrong_answers[aIndex] = value;
        setQuestions(newQuestions);
    };

    const handleAISuccess = (generated: QuestionDraft[]) => {
        // Ha az első kérdés üres, cseréljük le, különben adjuk hozzá
        if (questions.length === 1 && !questions[0].question_text) {
            setQuestions(generated);
        } else {
            setQuestions([...questions, ...generated]);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('Kérlek adj meg egy címet!');
            return;
        }

        if (questions.some(q => !q.question_text.trim() || !q.correct_answer.trim())) {
            toast.error('Minden kérdésnél töltsd ki a szöveget és a helyes választ!');
            return;
        }

        setLoading(true);

        try {
            // 1. Kvíz mentése
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title,
                    description,
                    quiz_type: 'static',
                    question_count: questions.length
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // 2. Kérdések mentése
            const questionsToSave = questions.map((q, index) => ({
                quiz_id: quiz.id,
                question_text: q.question_text,
                correct_answer: q.correct_answer,
                wrong_answers: q.wrong_answers,
                order_index: index,
                question_type: 'multiple_choice' as const
            }));

            const { error: qError } = await supabase
                .from('static_questions')
                .insert(questionsToSave);

            if (qError) throw qError;

            toast.success('Kvíz sikeresen elmentve!');
            onRefresh();
            onClose();
        } catch (error: any) {
            console.error('Error saving quiz:', error);
            toast.error('Hiba történt a mentés során: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onClose}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Vissza a műszerfalra
                </Button>
                <h2 className="text-3xl font-fredoka flex items-center gap-2">
                    <BookOpen className="w-8 h-8 text-primary" />
                    Új Statikus Kvíz
                </h2>
                <Button onClick={handleSave} disabled={loading} className="shadow-button">
                    <Save className="w-4 h-4 mr-2" />
                    Kvíz mentése
                </Button>
            </div>

            <div className="quiz-card space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Kvíz címe</Label>
                        <Input
                            id="title"
                            placeholder="pl. Matek alapok"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Leírás (opcionális)</Label>
                        <Textarea
                            id="desc"
                            placeholder="Miről szól a kvíz?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <AIGenerator onQuestionsGenerated={handleAISuccess} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Kérdések listája</h3>
                    <Button onClick={addQuestion} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Új kérdés
                    </Button>
                </div>

                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="quiz-card space-y-4 relative group animate-scale-in">
                        <button
                            onClick={() => removeQuestion(qIndex)}
                            className="absolute -right-2 -top-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-2">
                            <Label>Kérdés {qIndex + 1}</Label>
                            <Input
                                placeholder="Írd be a kérdést..."
                                value={q.question_text}
                                onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-success flex items-center gap-1">
                                    <Check className="w-4 h-4" /> Helyes válasz
                                </Label>
                                <Input
                                    placeholder="A helyes válasz..."
                                    value={q.correct_answer}
                                    onChange={(e) => updateQuestion(qIndex, 'correct_answer', e.target.value)}
                                    className="border-success/50 focus-visible:ring-success"
                                />
                            </div>

                            {q.wrong_answers.map((wa, waIndex) => (
                                <div key={waIndex} className="space-y-2">
                                    <Label className="text-destructive flex items-center gap-1">
                                        <Trash className="w-3 h-3" /> Rossz válasz {waIndex + 1}
                                    </Label>
                                    <Input
                                        placeholder="Rossz válasz..."
                                        value={wa}
                                        onChange={(e) => updateWrongAnswer(qIndex, waIndex, e.target.value)}
                                        className="border-destructive/30"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <Button onClick={addQuestion} variant="outline" className="w-full border-dashed border-2 py-8 group">
                    <Plus className="w-6 h-6 mr-2 group-hover:scale-125 transition-transform" />
                    Új kérdés hozzáadása
                </Button>
            </div>

            <div className="flex justify-center pb-10">
                <Button onClick={handleSave} disabled={loading} size="lg" className="px-10 py-8 text-xl font-bold shadow-button">
                    {loading ? 'Mentés...' : 'Kvíz véglegesítése és mentése'}
                </Button>
            </div>
        </div>
    );
}
