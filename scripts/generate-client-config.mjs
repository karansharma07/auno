/** Emit publishable browser settings for a live-alpha static deployment.
 *  Run as Cloudflare Pages build command. Never put a service_role key here. */
import {writeFileSync} from 'node:fs';
const url=process.env.SUPABASE_URL||'';
const key=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(url)){
  console.error('SUPABASE_URL must be the HTTPS URL of your Supabase project');process.exit(1);
}
if(!key || key.length<20 || /service_role/i.test(key)){
  console.error('SUPABASE_PUBLISHABLE_KEY must be a valid client/publishable key (never service_role)');process.exit(1);
}
writeFileSync(new URL('../live/config.js',import.meta.url),
  '/* Public browser configuration. Security is enforced by Supabase RLS. */\n'+
  'window.AUNO_CONFIG = '+JSON.stringify({supabaseUrl:url,supabaseAnonKey:key})+';\n',{mode:0o644});
console.log('Generated live/config.js for public Supabase client initialization');
