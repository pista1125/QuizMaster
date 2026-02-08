import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class QuizService {
    static async fetchQuizzes(userId: string) {
        try {
            const { data, error } = await supabase
                .from('quizzes')
                .select('*')
                .or(`teacher_id.eq.${userId},teacher_id.is.null`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error fetching quizzes:', error);
            toast.error('Hiba történt a kvízek betöltésekor: ' + error.message);
            return [];
        }
    }

    static async fetchRooms(userId: string) {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*, quizzes(*)')
                .eq('teacher_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Error fetching rooms:', error);
            toast.error('Hiba történt a szobák betöltésekor: ' + error.message);
            return [];
        }
    }

    static async deleteRoom(roomId: string) {
        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);

            if (error) throw error;
            toast.success('Szoba sikeresen törölve');
            return true;
        } catch (error: any) {
            console.error('Error deleting room:', error);
            toast.error('Hiba történt a szoba törlésekor: ' + error.message);
            return false;
        }
    }

    static async closeRoom(roomId: string) {
        try {
            const { error } = await supabase
                .from('rooms')
                .update({ is_active: false, ended_at: new Date().toISOString() })
                .eq('id', roomId);

            if (error) throw error;
            toast.success('Szoba lezárva');
            return true;
        } catch (error: any) {
            console.error('Error closing room:', error);
            toast.error('Hiba történt a szoba lezárásakor: ' + error.message);
            return false;
        }
    }
}
