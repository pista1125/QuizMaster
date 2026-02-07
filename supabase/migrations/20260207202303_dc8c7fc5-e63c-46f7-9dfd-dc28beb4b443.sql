-- Enum a kvíz típusokhoz
CREATE TYPE quiz_type AS ENUM ('dynamic', 'static');

-- Enum a dinamikus kvíz altípusokhoz
CREATE TYPE dynamic_quiz_subtype AS ENUM ('addition_single', 'addition_double', 'fractions', 'angles');

-- Tanári profilok tábla
CREATE TABLE public.teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kvízek tábla (előre gyártott kvízek)
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quiz_type quiz_type NOT NULL DEFAULT 'static',
  dynamic_subtype dynamic_quiz_subtype,
  question_count INTEGER DEFAULT 10,
  time_limit_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Statikus kérdések tábla
CREATE TABLE public.static_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answers TEXT[] NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Szobák tábla
CREATE TABLE public.rooms (
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
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Diák résztvevők tábla
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Válaszok tábla
CREATE TABLE public.answers (
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

-- RLS engedélyezése
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Teacher profiles policies
CREATE POLICY "Teachers can view their own profile"
ON public.teacher_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can insert their own profile"
ON public.teacher_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update their own profile"
ON public.teacher_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Quizzes policies (mindenki láthatja)
CREATE POLICY "Anyone can view quizzes"
ON public.quizzes FOR SELECT
TO authenticated
USING (true);

-- Static questions policies
CREATE POLICY "Anyone can view static questions"
ON public.static_questions FOR SELECT
TO authenticated
USING (true);

-- Rooms policies
CREATE POLICY "Teachers can create rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their own rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);

-- Participants policies (diákok bejelentkezhetnek név nélkül is)
CREATE POLICY "Anyone can join as participant"
ON public.participants FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view participants in a room"
ON public.participants FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Participants can update their own record"
ON public.participants FOR UPDATE
TO anon, authenticated
USING (true);

-- Answers policies
CREATE POLICY "Participants can insert answers"
ON public.answers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view answers"
ON public.answers FOR SELECT
TO anon, authenticated
USING (true);

-- Előre gyártott kvízek beszúrása
INSERT INTO public.quizzes (title, description, quiz_type, dynamic_subtype, question_count, time_limit_seconds) VALUES
('Egyjegyű számok összeadása', 'Gyakorold az 1-9 közötti számok összeadását!', 'dynamic', 'addition_single', 10, 15),
('Kétjegyű számok összeadása', 'Gyakorold a 10-99 közötti számok összeadását!', 'dynamic', 'addition_double', 10, 20),
('Törtek alapjai', 'Válaszd ki a helyes törtszámokat!', 'static', NULL, 8, 25),
('Szögek felismerése', 'Hegyesszög, tompaszög vagy derékszög?', 'static', NULL, 10, 20);

-- Statikus kérdések a törtek kvízhez
INSERT INTO public.static_questions (quiz_id, question_text, correct_answer, wrong_answers, order_index)
SELECT q.id, questions.question_text, questions.correct_answer, questions.wrong_answers, questions.order_index
FROM public.quizzes q
CROSS JOIN (VALUES
  ('Melyik a nagyobb: 1/2 vagy 1/4?', '1/2', ARRAY['1/4', '1/3', 'Egyenlőek'], 1),
  ('Hány negyed van egy egészben?', '4', ARRAY['2', '3', '8'], 2),
  ('Mi a fele a 10-nek törtben?', '10/2 = 5', ARRAY['10/3 = 3', '10/4 = 2', '10/5 = 2'], 3),
  ('1/2 + 1/2 = ?', '1 egész', ARRAY['2/4', '1/4', '2/2'], 4),
  ('Melyik az egyszerűsített alakja a 2/4-nek?', '1/2', ARRAY['1/4', '2/8', '4/8'], 5),
  ('Hány fél van egy egészben?', '2', ARRAY['1', '4', '3'], 6),
  ('3/4 nagyobb vagy kisebb mint 1/2?', 'Nagyobb', ARRAY['Kisebb', 'Egyenlő', 'Nem összehasonlítható'], 7),
  ('Mi a negyede a 8-nak?', '2', ARRAY['4', '1', '3'], 8)
) AS questions(question_text, correct_answer, wrong_answers, order_index)
WHERE q.title = 'Törtek alapjai';

-- Statikus kérdések a szögek kvízhez
INSERT INTO public.static_questions (quiz_id, question_text, correct_answer, wrong_answers, order_index)
SELECT q.id, questions.question_text, questions.correct_answer, questions.wrong_answers, questions.order_index
FROM public.quizzes q
CROSS JOIN (VALUES
  ('Hány fokos a derékszög?', '90°', ARRAY['45°', '180°', '360°'], 1),
  ('Hogyan nevezzük a 45°-os szöget?', 'Hegyesszög', ARRAY['Tompaszög', 'Derékszög', 'Egyenesszög'], 2),
  ('Melyik a tompaszög?', '120°', ARRAY['30°', '90°', '180°'], 3),
  ('Hány fokos az egyenesszög?', '180°', ARRAY['90°', '360°', '270°'], 4),
  ('A 60°-os szög milyen típusú?', 'Hegyesszög', ARRAY['Derékszög', 'Tompaszög', 'Egyenesszög'], 5),
  ('Melyik szög a legnagyobb?', '150°', ARRAY['90°', '45°', '85°'], 6),
  ('Hogyan nevezzük a 90°-nál nagyobb szöget?', 'Tompaszög', ARRAY['Hegyesszög', 'Derékszög', 'Teljesszög'], 7),
  ('Hány fokos a teljesszög?', '360°', ARRAY['180°', '270°', '90°'], 8),
  ('A háromszög szögeinek összege?', '180°', ARRAY['360°', '90°', '270°'], 9),
  ('Melyik szög kisebb 90°-nál?', 'Hegyesszög', ARRAY['Tompaszög', 'Derékszög', 'Egyenesszög'], 10)
) AS questions(question_text, correct_answer, wrong_answers, order_index)
WHERE q.title = 'Szögek felismerése';

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for teacher_profiles
CREATE TRIGGER update_teacher_profiles_updated_at
BEFORE UPDATE ON public.teacher_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime engedélyezése a szobákhoz és résztvevőkhöz
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;