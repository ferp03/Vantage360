const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Clave pública
const SUPABASE_SERVICE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY; // Clave de servicio

// Instancia para operaciones normales (clave pública)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_KEY);

// Instancia para operaciones administrativas (clave de servicio)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports =  { supabaseAnon, supabaseAdmin };