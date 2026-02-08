-- Add teacher_id to quizzes to track ownership (if not already done)
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id);

-- Add teacher_id to rooms for better indexing (already exists but ensures indexing/consistency)
-- ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id);

-- Drop existing restricted policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can view quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Anyone can view static questions" ON public.static_questions;
DROP POLICY IF EXISTS "Teachers can delete their own rooms" ON public.rooms;

-- Better policies for Quizzes
CREATE POLICY "Anyone can view quizzes"
ON public.quizzes FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Teachers can insert their own quizzes"
ON public.quizzes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own quizzes"
ON public.quizzes FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own quizzes"
ON public.quizzes FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);

-- Better policies for Static Questions
CREATE POLICY "Anyone can view static questions"
ON public.static_questions FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Teachers can manage questions for their quizzes"
ON public.static_questions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE id = static_questions.quiz_id
    AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update their own questions"
ON public.static_questions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE id = static_questions.quiz_id
    AND teacher_id = auth.uid()
  )
);

-- Better policies for Rooms (including Deletion)
CREATE POLICY "Teachers can delete their own rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (auth.uid() = teacher_id);

-- Ensure realtime is enabled for all relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.static_questions;
