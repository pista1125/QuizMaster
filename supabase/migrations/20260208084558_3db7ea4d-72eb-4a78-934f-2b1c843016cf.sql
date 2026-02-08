-- FIX: Diákok is tudják olvasni az aktív szobákat
CREATE POLICY "Anyone can view active rooms"
ON public.rooms FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Új enum a kérdések kezelési módjához
CREATE TYPE question_mode AS ENUM ('automatic', 'manual');

-- Új enum a kérdés típusokhoz (jövőbeli fejlesztéshez)
CREATE TYPE question_type AS ENUM ('multiple_choice', 'free_text');

-- Új oszlopok a rooms táblához
ALTER TABLE public.rooms 
ADD COLUMN question_mode question_mode NOT NULL DEFAULT 'automatic',
ADD COLUMN current_question_index INTEGER DEFAULT NULL,
ADD COLUMN question_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN show_results BOOLEAN DEFAULT false;

-- Új oszlop a static_questions táblához a típushoz
ALTER TABLE public.static_questions
ADD COLUMN question_type question_type NOT NULL DEFAULT 'multiple_choice';

-- Realtime frissítés engedélyezése a rooms táblához (ha még nincs)
-- Ez fontos a manuális módhoz, hogy a diákok lássák a kérdésváltást