-- ========================================================
-- QUIZMASTER FULL DATABASE SETUP (CONSOLIDATED)
-- Run this script in a fresh Supabase SQL Editor tab.
-- ========================================================

-- 1. ENUMS (Create if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
        CREATE TYPE quiz_type AS ENUM ('dynamic', 'static');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dynamic_quiz_subtype') THEN
        CREATE TYPE dynamic_quiz_subtype AS ENUM ('addition_single', 'addition_double', 'fractions', 'angles');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_mode') THEN
        CREATE TYPE question_mode AS ENUM ('automatic', 'manual');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE question_type AS ENUM ('multiple_choice', 'free_text');
    END IF;
END $$;

-- 2. TABLES
-- Tanári profilok
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kvízek
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quiz_type quiz_type NOT NULL DEFAULT 'static',
  dynamic_subtype dynamic_quiz_subtype,
  question_count INTEGER DEFAULT 10,
  time_limit_seconds INTEGER,
  teacher_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Statikus kérdések
CREATE TABLE IF NOT EXISTS public.static_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answers TEXT[] NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Szobák
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  class_name TEXT,
  grade_level INTEGER,
  is_active BOOLEAN DEFAULT true,
  randomize_questions BOOLEAN DEFAULT false,
  randomize_answers BOOLEAN DEFAULT false,
  time_limit_per_question INTEGER,
  question_mode question_mode NOT NULL DEFAULT 'automatic',
  current_question_index INTEGER DEFAULT NULL,
  question_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  show_results BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Résztvevők
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Válaszok
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  given_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. RLS ENABLE
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Drop and Recreate)
-- Quizzes
DROP POLICY IF EXISTS "Anyone can view quizzes" ON public.quizzes;
CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Teachers can insert their own quizzes" ON public.quizzes;
CREATE POLICY "Teachers can insert their own quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update their own quizzes" ON public.quizzes;
CREATE POLICY "Teachers can update their own quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can delete their own quizzes" ON public.quizzes;
CREATE POLICY "Teachers can delete their own quizzes" ON public.quizzes FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- Static Questions
DROP POLICY IF EXISTS "Anyone can view static questions" ON public.static_questions;
CREATE POLICY "Anyone can view static questions" ON public.static_questions FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Teachers can manage questions for their quizzes" ON public.static_questions;
CREATE POLICY "Teachers can manage questions for their quizzes" ON public.static_questions FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes WHERE id = static_questions.quiz_id AND teacher_id = auth.uid()));

-- Rooms
DROP POLICY IF EXISTS "Teachers can create rooms" ON public.rooms;
CREATE POLICY "Teachers can create rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can view their own rooms" ON public.rooms;
CREATE POLICY "Teachers can view their own rooms" ON public.rooms FOR SELECT TO authenticated USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update their own rooms" ON public.rooms;
CREATE POLICY "Teachers can update their own rooms" ON public.rooms FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Anyone can view active rooms" ON public.rooms;
CREATE POLICY "Anyone can view active rooms" ON public.rooms FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Teachers can delete their own rooms" ON public.rooms;
CREATE POLICY "Teachers can delete their own rooms" ON public.rooms FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

-- Participants/Answers
DROP POLICY IF EXISTS "Anyone can join as participant" ON public.participants;
CREATE POLICY "Anyone can join as participant" ON public.participants FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view participants" ON public.participants;
CREATE POLICY "Anyone can view participants" ON public.participants FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Participants can update their own record" ON public.participants;
CREATE POLICY "Participants can update their own record" ON public.participants FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Participants can insert answers" ON public.answers;
CREATE POLICY "Participants can insert answers" ON public.answers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view answers" ON public.answers;
CREATE POLICY "Anyone can view answers" ON public.answers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Teachers can delete answers for their rooms" ON public.answers;
CREATE POLICY "Teachers can delete answers for their rooms" ON public.answers FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.participants p JOIN public.rooms r ON p.room_id = r.id WHERE p.id = answers.participant_id AND r.teacher_id = auth.uid()));

-- 5. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.teacher_profiles (user_id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'display_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. REALTIME (Safe handling)
DO $$ 
BEGIN
    -- Check if publication exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to publication (ignoring errors if already added is tricky, 
-- but we can just drop and recreate it for simplicity in setup)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.rooms, public.participants, public.quizzes, public.static_questions;

-- 7. SEED DATA
INSERT INTO public.quizzes (title, description, quiz_type, dynamic_subtype, question_count, time_limit_seconds) 
SELECT 'Egyjegyű számok összeadása', 'Gyakorold az 1-9 közötti számok összeadását!', 'dynamic', 'addition_single', 10, 15
WHERE NOT EXISTS (SELECT 1 FROM public.quizzes WHERE title = 'Egyjegyű számok összeadása');

INSERT INTO public.quizzes (title, description, quiz_type, dynamic_subtype, question_count, time_limit_seconds) 
SELECT 'Kétjegyű számok összeadása', 'Gyakorold a 10-99 közötti számok összeadását!', 'dynamic', 'addition_double', 10, 20
WHERE NOT EXISTS (SELECT 1 FROM public.quizzes WHERE title = 'Kétjegyű számok összeadása');
