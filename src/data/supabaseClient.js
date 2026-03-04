// ============================================================================
// ATB-SMS: Supabase Client
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://veambvvyzkixccxmxtaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYW1idnZ5emtpeGNjeG14dGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTI4NzMsImV4cCI6MjA4ODIyODg3M30.5aQb4EPd5LyMdOcWOrZLrqNZ0t4ui8Uk6Av_SVXJVb8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
