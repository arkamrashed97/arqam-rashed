/**
 * Public site configuration. Everything a site owner may want to change lives here.
 *
 * Notice: Only public/publishable keys live here. The Supabase service_role key is stored
 * exclusively as an encrypted secret inside Cloudflare Pages Functions (functions/api/leaderboard.js).
 */
export const CONFIG = {
  enableFishingGame: false, // Set to true to re-enable Act V cyber-lagoon fishing game
  email: 'me@arqamrashed.com',
  whatsapp: '201016843477',
  formEndpoint: 'https://formsubmit.co/ajax/arkamrashed@gmail.com',
  cvUrl: 'assets/docs/Arqam-Rashed-CV.pdf',
  vcardUrl: 'assets/docs/Arqam-Rashed.vcf',
  leaderboardApiUrl: 'https://arqam-rashed.pages.dev/api/leaderboard',
  supabaseUrl: 'https://qsbuqfkkevrbdxrebsln.supabase.co',
  supabasePublishableKey: 'sb_publishable_rmdQ2iW5kaFlBZwp_e3g6g_fEJ7mpn9'
};
