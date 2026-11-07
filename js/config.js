/**
 * Public site configuration. Everything a site owner may want to change lives here.
 *
 * Notice: Only public/publishable keys live here. The Supabase service_role key is stored
 * exclusively as an encrypted secret inside Cloudflare Pages Functions (functions/api/leaderboard.js).
 */
export const CONFIG = {
  email: 'arkam2014a@gmail.com',
  whatsapp: '201016843477',
  formEndpoint: 'https://formsubmit.co/ajax/arkam2014a@gmail.com',
  cvUrl: 'assets/docs/Arqam-Rashed-CV.pdf',
  vcardUrl: 'assets/docs/Arqam-Rashed.vcf',
  leaderboardApiUrl: 'https://arqamrashed.com/api/leaderboard',
  supabaseUrl: 'https://qsbuqfkkevrbdxrebsln.supabase.co',
  supabasePublishableKey: 'sb_publishable_rmdQ2iW5kaFlBZwp_e3g6g_fEJ7mpn9'
};
