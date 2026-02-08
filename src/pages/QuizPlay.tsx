import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnswerButton } from '@/components/AnswerButton';
import { Timer } from '@/components/Timer';
import { ProgressBar } from '@/components/ProgressBar';
import { Logo } from '@/components/Logo';
import { supabase } from '@/integrations/supabase/client';
import { generateQuestions, shuffleAnswers } from '@/lib/quizGenerator';
import { CheckCircle, XCircle, Trophy, Star, Loader2, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Question {
  question: string;
  correctAnswer: string;
  answers: string[];
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
  randomize_questions: boolean;
  randomize_answers: boolean;
  quizzes: {
    id: string;
    title: string;
    quiz_type: 'dynamic' | 'static';
    dynamic_subtype: string | null;
    question_count: number;
  };
}

export default function QuizPlay() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Manual mode states
  const [waitingForQuestion, setWaitingForQuestion] = useState(false);
  const [waitingForResults, setWaitingForResults] = useState(false);
  const [questionResults, setQuestionResults] = useState<{ correct: number, total: number } | null>(null);

  useEffect(() => {
    const participantId = sessionStorage.getItem('participantId');
    if (!participantId) {
      navigate(`/join/${code}`);
      return;
    }

    loadQuiz();
  }, [code, navigate]);

  // Subscribe to room changes for manual mode
  useEffect(() => {
    if (!roomData || roomData.question_mode !== 'manual') return;

    const channel = supabase
      .channel('room-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `room_code=eq.${code}`,
        },
        (payload) => {
          const newRoom = payload.new as any;
          setRoomData(prev => prev ? { ...prev, ...newRoom } : prev);

          // Check if new question started
          const isNewQuestion = newRoom.current_question_index !== null &&
            (newRoom.current_question_index !== currentIndex || waitingForQuestion);

          if (isNewQuestion && !showResult) {
            setCurrentIndex(newRoom.current_question_index);
            setSelectedAnswer(null);
            setShowResult(false);
            setWaitingForQuestion(false);
            setWaitingForResults(false);
            setStartTime(Date.now());
          }

          // Check if results should be shown
          if (newRoom.show_results && waitingForResults) {
            loadQuestionResults(newRoom.current_question_index);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomData, code, currentIndex, showResult, waitingForResults]);

  const loadQuiz = async () => {
    const { data: room, error } = await supabase
      .from('rooms')
      .select('*, quizzes(*)')
      .eq('room_code', code)
      .single();

    if (error || !room) {
      navigate('/');
      return;
    }

    setRoomData(room as unknown as RoomData);
    setTimeLimit(room.time_limit_per_question);

    const quiz = room.quizzes;
    let loadedQuestions: Question[] = [];

    if (quiz.quiz_type === 'dynamic') {
      const generated = generateQuestions(
        quiz.dynamic_subtype as any,
        quiz.question_count || 10
      );

      loadedQuestions = generated.map((q) => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        answers: shuffleAnswers(q.correctAnswer, q.wrongAnswers),
      }));
    } else {
      const { data: staticQuestions, error: staticError } = await supabase
        .from('static_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index');

      if (staticError) {
        console.error('Error loading questions:', staticError);
        toast.error('Hiba történt a kérdések betöltésekor!');
        navigate('/');
        return;
      }

      if (staticQuestions) {
        loadedQuestions = staticQuestions.map((q) => ({
          question: q.question_text,
          correctAnswer: q.correct_answer,
          answers: room.randomize_answers
            ? shuffleAnswers(q.correct_answer, q.wrong_answers)
            : [q.correct_answer, ...q.wrong_answers],
        }));
      }
    }

    if (room.randomize_questions) {
      loadedQuestions = [...loadedQuestions].sort(() => Math.random() - 0.5);
    }

    if (loadedQuestions.length === 0) {
      toast.error('Ez a kvíz nem tartalmaz kérdéseket!');
      navigate('/');
      return;
    }

    setQuestions(loadedQuestions);

    // For manual mode, check if quiz has started
    if (room.question_mode === 'manual') {
      if (room.current_question_index === null) {
        setWaitingForQuestion(true);
      } else {
        setCurrentIndex(room.current_question_index);
      }
    }

    setStartTime(Date.now());
    setLoading(false);
  };

  const loadQuestionResults = async (questionIndex: number) => {
    if (!roomData) return;

    const { data: answers } = await supabase
      .from('answers')
      .select('is_correct')
      .eq('question_index', questionIndex);

    if (answers) {
      const correct = answers.filter(a => a.is_correct).length;
      setQuestionResults({ correct, total: answers.length });
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult) return;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setSelectedAnswer(answer);
    setShowResult(true);

    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    const participantId = sessionStorage.getItem('participantId');
    await supabase.from('answers').insert({
      participant_id: participantId,
      question_index: currentIndex,
      question_text: currentQuestion.question,
      given_answer: answer,
      correct_answer: currentQuestion.correctAnswer,
      is_correct: isCorrect,
      time_taken_seconds: timeTaken,
    });

    // For automatic mode, move to next question after delay
    if (roomData?.question_mode === 'automatic') {
      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setShowResult(false);
          setStartTime(Date.now());
        } else {
          finishQuiz();
        }
      }, 1500);
    } else {
      // Manual mode - wait for teacher to show results or next question
      setWaitingForResults(true);
    }
  };

  const handleTimeUp = useCallback(() => {
    if (!showResult && questions[currentIndex]) {
      handleAnswer('');
    }
  }, [showResult, questions, currentIndex]);

  const finishQuiz = async () => {
    const participantId = sessionStorage.getItem('participantId');
    await supabase
      .from('participants')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', participantId);

    setIsFinished(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl font-medium">Kvíz betöltése...</p>
        </div>
      </div>
    );
  }

  // Waiting for teacher to start in manual mode
  if (waitingForQuestion && roomData?.question_mode === 'manual') {
    return (
      <div className="min-h-screen hero-gradient flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 md:p-12 max-w-lg w-full text-center">
          <Clock className="w-16 h-16 text-primary mx-auto mb-6 floating-animation" />
          <h1 className="text-3xl font-fredoka mb-4">Várakozás a tanárra...</h1>
          <p className="text-muted-foreground mb-6">
            A tanár hamarosan elindítja az első kérdést.
          </p>
          <div className="animate-pulse">
            <div className="w-12 h-2 bg-primary/30 rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen hero-gradient flex flex-col items-center justify-center p-4">
        <div className="glass-card p-8 md:p-12 max-w-lg w-full text-center animate-scale-in">
          <div className="mb-6">
            <Trophy className="w-20 h-20 text-accent mx-auto floating-animation" />
          </div>

          <h1 className="text-4xl font-fredoka mb-4">Kvíz vége!</h1>

          <div className="mb-8">
            <p className="text-6xl font-fredoka text-primary mb-2">
              {score}/{questions.length}
            </p>
            <p className="text-xl text-muted-foreground">
              {percentage}% helyes válasz
            </p>
          </div>

          <div className="flex justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-8 h-8 ${i < Math.ceil(percentage / 20)
                  ? 'text-accent fill-accent'
                  : 'text-muted'
                  }`}
              />
            ))}
          </div>

          <p className="text-muted-foreground mb-6">
            {percentage >= 80
              ? '🎉 Kiváló munka!'
              : percentage >= 60
                ? '👍 Szép teljesítmény!'
                : percentage >= 40
                  ? '💪 Jó próbálkozás!'
                  : '📚 Gyakorolj még!'}
          </p>

          <Button onClick={() => navigate('/')} size="lg" className="shadow-button">
            Vissza a főoldalra
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Manual mode: Show results screen when teacher enables it
  if (roomData?.question_mode === 'manual' && roomData?.show_results && showResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Logo size="sm" />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pontszám</p>
              <p className="text-2xl font-bold text-primary">{score}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
          <div className="quiz-card max-w-2xl w-full text-center animate-scale-in">
            <h2 className="text-2xl font-fredoka mb-6">Eredmények</h2>

            <div className="mb-6">
              <p className="text-muted-foreground mb-2">Kérdés:</p>
              <p className="text-xl font-medium">{currentQuestion.question}</p>
            </div>

            <div className={`p-6 rounded-xl mb-6 ${selectedAnswer === currentQuestion.correctAnswer
              ? 'bg-success/10 border-2 border-success'
              : 'bg-destructive/10 border-2 border-destructive'
              }`}>
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="w-10 h-10 text-success" />
                  <span className="text-2xl font-bold text-success">Helyes!</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <XCircle className="w-10 h-10 text-destructive" />
                    <span className="text-2xl font-bold text-destructive">Helytelen</span>
                  </div>
                  <p className="text-muted-foreground">
                    Helyes válasz: <span className="font-bold text-success">{currentQuestion.correctAnswer}</span>
                  </p>
                </div>
              )}
            </div>

            {questionResults && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span>
                  {questionResults.correct} / {questionResults.total} diák válaszolt helyesen
                </span>
              </div>
            )}

            <p className="mt-6 text-muted-foreground animate-pulse">
              Várakozás a következő kérdésre...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pontszám</p>
              <p className="text-2xl font-bold text-primary">{score}</p>
            </div>
            {timeLimit && !showResult && (
              <Timer
                seconds={timeLimit}
                onTimeUp={handleTimeUp}
                isActive={!showResult}
              />
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <ProgressBar current={currentIndex + 1} total={questions.length} />
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <div className="quiz-card mb-8 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">
            Kérdés {currentIndex + 1}/{questions.length}
          </p>
          <h2 className="text-2xl md:text-4xl font-fredoka">
            {currentQuestion.question}
          </h2>
        </div>

        {showResult && (
          <div className={`text-center mb-6 animate-scale-in ${selectedAnswer === currentQuestion.correctAnswer
            ? 'text-success'
            : 'text-destructive'
            }`}>
            {selectedAnswer === currentQuestion.correctAnswer ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-8 h-8" />
                <span className="text-2xl font-bold">Helyes!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <XCircle className="w-8 h-8" />
                <span className="text-2xl font-bold">
                  {selectedAnswer ? 'Helytelen!' : 'Lejárt az idő!'}
                </span>
              </div>
            )}

            {roomData?.question_mode === 'manual' && (
              <p className="mt-2 text-muted-foreground text-sm animate-pulse">
                Várakozás a tanárra...
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 flex-1">
          {currentQuestion.answers.map((answer, index) => (
            <AnswerButton
              key={index}
              answer={answer}
              index={index}
              onClick={() => handleAnswer(answer)}
              disabled={showResult}
              selected={selectedAnswer === answer}
              isCorrect={answer === currentQuestion.correctAnswer}
              showResult={showResult}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
