/**
 * Public «هدوء السوق» TV stream, as documented in market.alhajda.com/live.js.
 * The page itself sends X-Frame-Options: SAMEORIGIN, so Waha must not iframe it.
 * tv.alhajda.com does not send Access-Control-Allow-Origin, so a script player
 * on another origin cannot fetch the playlist. Native HLS (Safari / iOS) may.
 */
export const MARKET_LIVE_PAGE = "https://market.alhajda.com/live";
export const MARKET_LIVE_PLAYLIST = "https://tv.alhajda.com/hls/tv.m3u8";

export function browserCanPlayHls(video: { canPlayType: (type: string) => string }): boolean {
  const native =
    video.canPlayType("application/vnd.apple.mpegurl") ||
    video.canPlayType("application/x-mpegURL");
  return native === "probably" || native === "maybe";
}
