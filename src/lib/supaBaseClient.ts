import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wibhzswcdtrttyhetahp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpYmh6c3djZHRydHR5aGV0YWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5OTAzNDEsImV4cCI6MjA0NzU2NjM0MX0.DnGN6culb5Vty6eiJ4KsOPCeBNk-6yaio9iKiEUUtls'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)