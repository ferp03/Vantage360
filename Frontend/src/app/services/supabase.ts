import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/envs/environment';

export const Supabase = createClient(
  environment.supabaseUrl,
  environment.supabaseKey
);
