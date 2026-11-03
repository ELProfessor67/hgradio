// All tunables come from the environment so the same image runs against prod
// and staging. Defaults are the production platform as of Oct 2026.
//
// This module is imported first, before @livekit/rtc-node: that SDK logs at
// debug level unless NODE_ENV=production, which would bury our JSONL lines.
process.env.NODE_ENV ??= 'production';
const env = (k, d) => (process.env[k] ?? d);
const num = (k, d) => Number(env(k, d));

export const config = {
  stationId: env('STATION_ID', '655347b59c00a7409d9181c3'),
  socketUrl: env('SOCKET_URL', 'https://backend.hgdjlive.com'),
  panelUrl: env('PANEL_URL', 'https://hgdjlive.com'),
  icecastUrl: env('ICECAST_URL', 'https://icecast.hgdjlive.com'),
  websiteUrl: env('WEBSITE_URL', 'https://hgcradio.org'),
  // Optional. With these the probe (a) joins LiveKit under a recognisable
  // identity with canPublish=false and (b) reads server-side room truth.
  livekitUrl: env('LIVEKIT_URL', ''),
  livekitApiKey: env('LIVEKIT_API_KEY', ''),
  livekitApiSecret: env('LIVEKIT_API_SECRET', ''),
  // Backend ops endpoints (added by ops/backend-patches). Optional.
  backendOpsToken: env('BACKEND_OPS_TOKEN', ''),

  probeId: env('PROBE_ID', 'synthetic-listener'),
  tickSeconds: num('TICK_SECONDS', 60),
  // "listener hears the right audio within N s of any state change"
  deadlineSeconds: num('STATE_CHANGE_DEADLINE_SECONDS', 10),
  // Below this the received PCM counts as silence.
  silenceDbfs: num('AUDIO_SILENCE_DBFS', -50),
  // Icecast: expect at least this fraction of the advertised bitrate.
  icecastMinBitrateFraction: num('ICECAST_MIN_BITRATE_FRACTION', 0.7),
  icecastSampleSeconds: num('ICECAST_SAMPLE_SECONDS', 4),
  // Auto DJ metadata older than song end + this many seconds is "stale".
  metadataStaleGraceSeconds: num('METADATA_STALE_GRACE_SECONDS', 180),
  // Minutes into a scheduled slot before "no DJ went live" is raised.
  scheduledNoDjMinutes: num('SCHEDULED_NO_DJ_MINUTES', 5),
  // Optional: path to ffmpeg for Icecast silence detection.
  ffmpegPath: env('FFMPEG_PATH', ''),

  metricsPort: num('METRICS_PORT', 9101),
  logDir: env('LOG_DIR', './logs'),

  alerts: {
    telegramToken: env('ALERT_TELEGRAM_BOT_TOKEN', ''),
    telegramChatId: env('ALERT_TELEGRAM_CHAT_ID', ''),
    discordWebhook: env('ALERT_DISCORD_WEBHOOK', ''),
    slackWebhook: env('ALERT_SLACK_WEBHOOK', ''),
    genericWebhook: env('ALERT_WEBHOOK_URL', ''),
    uptimeKumaPush: env('UPTIME_KUMA_PUSH_URL', ''),
    remindMinutes: num('ALERT_REMIND_MINUTES', 15),
  },
};
