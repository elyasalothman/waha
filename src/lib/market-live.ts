/**
 * Public «هدوء السوق» TV stream, as documented in market.alhajda.com/live.js.
 * The page itself sends X-Frame-Options: SAMEORIGIN, so Waha must not iframe it.
 * tv.alhajda.com does not send Access-Control-Allow-Origin, so a script player
 * on another origin cannot fetch the playlist. Native HLS (Safari / iOS) may.
 */
export const MARKET_LIVE_PAGE = "https://market.alhajda.com/live";
export const MARKET_LIVE_PLAYLIST = "https://tv.alhajda.com/hls/tv.m3u8";

export const AVC_AAC_MIME = 'video/mp4; codecs="avc1.4d401f,mp4a.40.2"';

export function browserCanPlayHls(video: { canPlayType: (type: string) => string }): boolean {
  const native =
    video.canPlayType("application/vnd.apple.mpegurl") ||
    video.canPlayType("application/x-mpegURL");
  return native === "probably" || native === "maybe";
}

/** mse reads the playlist in JavaScript and needs CORS. native is the video element alone. */
export function playbackPlan(input: {
  playlistReadable: boolean;
  mse: boolean;
  nativeHls: boolean;
}): "mse" | "native" | "unavailable" {
  if (input.playlistReadable && input.mse) return "mse";
  if (input.nativeHls) return "native";
  return "unavailable";
}

/**
 * Success is a picture that keeps moving. A playlist response or a single frame is not enough.
 * `marked` is currentTime at the first decoded frame.
 */
export function pictureHeld(
  marked: number | null,
  now: { time: number; width: number },
  elapsedMs: number,
): "wait" | "playing" | "failed" {
  if (!(now.width > 0) || !(now.time > 0)) return elapsedMs >= 12000 ? "failed" : "wait";
  if (marked == null) return elapsedMs >= 12000 ? "failed" : "wait";
  if (now.time - marked >= 2) return "playing";
  return elapsedMs >= 12000 ? "failed" : "wait";
}
