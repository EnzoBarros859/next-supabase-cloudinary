import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const saveMediaToSupabase = async (mediaData: {
  title: string;
  type: 'image' | 'video';
  cloudinary_url: string;
  cloudinary_public_id: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .insert([mediaData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    throw error;
  }
};

export const getMediaFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    throw error;
  }
}; 