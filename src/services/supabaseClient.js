import { supabase as officialClient } from '../integrations/supabase/client';

/**
 * BachatKaro Supabase Client Singleton
 * This file re-exports the official TypeScript client to ensure 
 * consistent auth state and single GoTrueClient instance across JS/TS modules.
 */
export const supabase = officialClient;
