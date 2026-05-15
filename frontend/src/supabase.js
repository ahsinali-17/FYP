import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
	import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_KEY).'
	);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const getSupabaseUser = async () => {
	const { data: { user } } = await supabase.auth.getUser();
	return user;
};
export { getSupabaseUser, supabase };