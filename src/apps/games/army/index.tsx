import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Crosshair, Infinity as InfinityIcon, Lock, Pause, Play, RotateCcw, Users, Volume2, VolumeX, Coins, LayoutGrid, Sparkles, Home } from "lucide-react";
import { LEVELS, endlessStage } from "@/lib/army/levels";
import { coinsFor, startArmy, type GameState, type Upgrades } from "@/lib/army/engine";
import { UPGRADE_MAX, buyUpgrade, loadSave, upgradeCost, writeSave, type ArmySave } from "@/lib/army/save";
import { ArmyAudio } from "./audio";
import { ArmyRenderer } from "./renderer";
import "./army.css";

type Screen = "menu" | "levels" | "upgrades" | "play" | "pause" | "result";
type Result = { won: boolean; levelId: number; name: string; coins: number; survivors: number; progress: number; endless: boolean; stage: number };

const n = (x: number) => Math.max(0, Math.round(x)).toString();

function Coin() {
  return <span className="army-coin" aria-hidden />;
}

export function ArmyApp() {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ArmyRenderer | null>(null);
  const audioRef = useRef<ArmyAudio | null>(null);
  const saveRef = useRef<ArmySave>(loadSave());
  const playRef = useRef<{ levelId: number; endless: boolean; stage: number }>({ levelId: 1, endless: false, stage: 1 });
  const [save, setSave] = useState<ArmySave>(saveRef.current);
  const [screen, setScreen] = useState<Screen>("menu");
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [hint, setHint] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [levelName, setLevelName] = useState("");
  const [glFailed, setGlFailed] = useState(false);

  const commit = useCallback((next: ArmySave) => {
    saveRef.current = next;
    writeSave(next);
    setSave(next);
  }, []);

  const showToast = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 1400);
  }, []);

  const onEnd = useCallback(
    ({ state, won }: { state: GameState; won: boolean }) => {
      const s = saveRef.current;
      const p = playRef.current;
      const coins = coinsFor(state, s.upgrades);
      let next: ArmySave = { ...s, coins: s.coins + coins, bestArmy: Math.max(s.bestArmy, state.army.peak) };
      if (p.endless) {
        if (won) {
          // endless: carry the army straight into the next stage
          next = { ...next, endlessBest: Math.max(next.endlessBest, p.stage) };
          commit(next);
          p.stage += 1;
          const lvl = endlessStage(p.stage, state.army.n);
          rendererRef.current?.load(lvl, next.upgrades, { carry: { n: state.army.n, stacks: state.army.stacks } });
          setLevelName(`اللانهائي · ${lvl.name}`);
          showToast(`المرحلة ${p.stage} · +${n(coins)}`);
          return;
        }
        next = { ...next, endlessBest: Math.max(next.endlessBest, p.stage - 1) };
      } else if (won) {
        next = { ...next, unlocked: Math.max(next.unlocked, Math.min(11, p.levelId + 1)) };
      }
      commit(next);
      audioRef.current?.setMusicLevel(0.35);
      setResult({
        won,
        levelId: p.levelId,
        name: state.level.name,
        coins,
        survivors: state.army.n,
        progress: Math.round(Math.min(1, state.army.dist / state.level.length) * 100),
        endless: p.endless,
        stage: p.stage,
      });
      setScreen("result");
    },
    [commit, showToast],
  );

  // mount renderer once
  useEffect(() => {
    const host = hostRef.current;
    const labels = labelsRef.current;
    if (!host || !labels) return;
    const audio = new ArmyAudio();
    audioRef.current = audio;
    setMuted(audio.muted);
    let r: ArmyRenderer;
    try {
      r = new ArmyRenderer(host, labels, audio, {
        onEnd: (i) => onEndRef.current(i),
        onContextLost: () => setScreen((cur) => (cur === "play" ? "pause" : cur)),
        onProgress: (p) => {
          if (progRef.current) progRef.current.style.width = `${Math.round(p * 100)}%`;
        },
      });
    } catch {
      audio.dispose();
      setGlFailed(true);
      return;
    }
    rendererRef.current = r;
    r.load(LEVELS[0], { start: 4, rate: 4, income: 0 }, { demo: true });
    // QA hook for screenshot tests; cleared on unmount.
    const w = window as unknown as { __army?: ArmyRenderer };
    w.__army = r;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onVis = () => {
      if (document.hidden && playRef.current && rendererRef.current && !rendererRef.current.demo) {
        rendererRef.current.setPaused(true);
        setScreen((s) => (s === "play" ? "pause" : s));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.body.style.overflow = prevOverflow;
      if (w.__army === r) delete w.__army;
      r.dispose();
      audio.dispose();
      rendererRef.current = null;
    };
  }, []);

  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const start = useCallback(
    (levelId: number) => {
      const r = rendererRef.current;
      if (!r) return;
      audioRef.current?.unlock();
      audioRef.current?.startMusic();
      audioRef.current?.setMusicLevel(0.55);
      const endless = levelId > 10;
      playRef.current = { levelId, endless, stage: 1 };
      const u: Upgrades = saveRef.current.upgrades;
      const lvl = endless ? endlessStage(1, startArmy(u) * 3) : LEVELS[levelId - 1];
      r.load(lvl, u, endless ? { carry: { n: startArmy(u) * 3, stacks: 0 } } : {});
      setLevelName(endless ? `اللانهائي · ${lvl.name}` : `المرحلة ${lvl.id} · ${lvl.name}`);
      setResult(null);
      setScreen("play");
      if (levelId <= 2) {
        setHint(true);
        window.setTimeout(() => setHint(false), 3800);
      }
    },
    [],
  );

  const backToMenu = useCallback(() => {
    const r = rendererRef.current;
    if (r) r.load(LEVELS[Math.floor(Math.random() * 3)], { start: 4, rate: 4, income: 0 }, { demo: true });
    audioRef.current?.setMusicLevel(0.35);
    setScreen("menu");
  }, []);

  const pause = (p: boolean) => {
    rendererRef.current?.setPaused(p);
    audioRef.current?.tap();
    setScreen(p ? "pause" : "play");
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.setMuted(!a.muted);
    if (!a.muted && screen === "play") a.startMusic();
    setMuted(a.muted);
  };

  const buy = (k: keyof Upgrades) => {
    const next = buyUpgrade(saveRef.current, k);
    if (!next) return;
    audioRef.current?.unlock();
    audioRef.current?.coin();
    commit(next);
  };

  const nextLevel = Math.min(save.unlocked, 10);

  return (
    <div className="army-root" dir="rtl" lang="ar">
      <div ref={hostRef} className="army-canvas" onPointerDown={() => hint && setHint(false)} />
      <div ref={labelsRef} className="army-labels" />

      {glFailed && (
        <div className="army-screen">
          <div className="army-sheet">
            <h2>جهازك لا يدعم الرسوم ثلاثية الأبعاد</h2>
            <Link to="/games" className="army-btn">العودة إلى الألعاب</Link>
          </div>
        </div>
      )}

      {/* in-game HUD */}
      {(screen === "play" || screen === "pause") && (
        <div className="army-hud">
          <div className="army-top">
            <button type="button" className="army-icon-btn" aria-label="إيقاف مؤقت" onClick={() => pause(true)}>
              <Pause className="size-5" />
            </button>
            <div className="army-level-name">{levelName}</div>
            <span className="army-chip" dir="ltr">
              <Coin />
              {n(save.coins)}
            </span>
          </div>
          <div className="army-progress" aria-hidden>
            <div ref={progRef} style={{ width: "0%" }} />
          </div>
          {hint && (
            <div className="army-hint">
              <span className="army-hand" aria-hidden>👆</span>
              اسحب يمينًا ويسارًا لقيادة جيشك
            </div>
          )}
        </div>
      )}
      {toast && <div className="army-toast">{toast}</div>}

      {/* menu */}
      {(screen === "menu" || screen === "levels" || screen === "upgrades") && (
        <div className="army-screen">
          <div className="army-top">
            <Link to="/games" className="army-icon-btn" aria-label="رجوع إلى الألعاب">
              <ArrowRight className="size-5" />
            </Link>
            <span className="army-chip" dir="ltr">
              <Coin />
              {n(save.coins)}
            </span>
            <span style={{ flex: 1 }} />
            <button type="button" className="army-icon-btn" aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"} aria-pressed={!muted} onClick={toggleMute}>
              {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            </button>
          </div>

          {screen === "menu" && (
            <>
              <div className="army-logo">
                <h1>جيش الواحة</h1>
                <p>اجمع رماتك، اختر البوابة الرابحة، واهزم قطّاع الطرق حتى آخر حصن.</p>
              </div>
              <div className="army-sheet">
                <button type="button" className="army-btn" onClick={() => start(nextLevel)}>
                  <Play className="size-5" />
                  {save.unlocked > 10 ? "العب المرحلة 10" : `ابدأ المرحلة ${nextLevel}`}
                </button>
                <div className="army-row">
                  <button type="button" className="army-btn army-btn--ghost" onClick={() => setScreen("levels")}>
                    <LayoutGrid className="size-4" />
                    المراحل
                  </button>
                  <button type="button" className="army-btn army-btn--ghost" onClick={() => setScreen("upgrades")}>
                    <Sparkles className="size-4" />
                    التطويرات
                  </button>
                </div>
                <button
                  type="button"
                  className="army-btn army-btn--gold"
                  style={{ marginTop: "0.7rem" }}
                  disabled={save.unlocked <= 10}
                  onClick={() => start(11)}
                >
                  {save.unlocked > 10 ? <InfinityIcon className="size-5" /> : <Lock className="size-4" />}
                  {save.unlocked > 10 ? `الوضع اللانهائي${save.endlessBest ? ` · أفضل ${n(save.endlessBest)}` : ""}` : "اللانهائي يُفتح بعد المرحلة 10"}
                </button>
              </div>
            </>
          )}

          {screen === "levels" && (
            <div className="army-sheet">
              <h2>المراحل</h2>
              <div className="army-levels">
                {LEVELS.map((L) => {
                  const locked = L.id > save.unlocked;
                  const done = L.id < save.unlocked;
                  return (
                    <button
                      type="button"
                      key={L.id}
                      disabled={locked}
                      aria-label={`المرحلة ${L.id} ${L.name}${locked ? " مقفلة" : ""}`}
                      className={`army-tile ${locked ? "army-tile--locked" : done ? "army-tile--done" : "army-tile--next"}`}
                      onClick={() => start(L.id)}
                    >
                      {locked ? <Lock className="size-5" /> : <span dir="ltr">{L.id}</span>}
                      <small>{L.name}</small>
                    </button>
                  );
                })}
              </div>
              <button type="button" className="army-btn army-btn--ghost" style={{ marginTop: "0.8rem" }} onClick={() => setScreen("menu")}>
                رجوع
              </button>
            </div>
          )}

          {screen === "upgrades" && (
            <div className="army-sheet">
              <h2>التطويرات</h2>
              <Upgrade
                icon={<Users className="size-6" />}
                title="حجم الجيش عند البداية"
                desc={`تبدأ بـ ${startArmy(save.upgrades)} رماة${save.upgrades.start < UPGRADE_MAX.start ? ` ← ${startArmy({ ...save.upgrades, start: save.upgrades.start + 1 })}` : ""}`}
                level={save.upgrades.start}
                max={UPGRADE_MAX.start}
                cost={upgradeCost("start", save.upgrades.start)}
                coins={save.coins}
                onBuy={() => buy("start")}
              />
              <Upgrade
                icon={<Crosshair className="size-6" />}
                title="سرعة الرمي"
                desc={`+${save.upgrades.rate * 10}% الآن · كل مستوى +10%`}
                level={save.upgrades.rate}
                max={UPGRADE_MAX.rate}
                cost={upgradeCost("rate", save.upgrades.rate)}
                coins={save.coins}
                onBuy={() => buy("rate")}
              />
              <Upgrade
                icon={<Coins className="size-6" />}
                title="غنائم أكثر"
                desc={`+${save.upgrades.income * 15}% عملات · كل مستوى +15%`}
                level={save.upgrades.income}
                max={UPGRADE_MAX.income}
                cost={upgradeCost("income", save.upgrades.income)}
                coins={save.coins}
                onBuy={() => buy("income")}
              />
              <button type="button" className="army-btn army-btn--ghost" onClick={() => setScreen("menu")}>
                رجوع
              </button>
            </div>
          )}
        </div>
      )}

      {/* pause */}
      {screen === "pause" && (
        <div className="army-screen" style={{ background: "rgba(40,20,5,0.35)" }}>
          <div className="army-sheet" style={{ marginBlock: "auto" }}>
            <h2>استراحة المحارب</h2>
            <button type="button" className="army-btn" onClick={() => pause(false)}>
              <Play className="size-5" />
              متابعة
            </button>
            <div className="army-row">
              <button type="button" className="army-btn army-btn--ghost" onClick={() => start(playRef.current.levelId)}>
                <RotateCcw className="size-4" />
                إعادة
              </button>
              <button type="button" className="army-btn army-btn--ghost" onClick={backToMenu}>
                <Home className="size-4" />
                القائمة
              </button>
            </div>
            <button type="button" className="army-btn army-btn--ghost" style={{ marginTop: "0.6rem" }} onClick={toggleMute} aria-pressed={!muted}>
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {muted ? "الصوت مكتوم" : "الصوت يعمل"}
            </button>
          </div>
        </div>
      )}

      {/* result */}
      {screen === "result" && result && (
        <div className="army-screen" style={{ background: "rgba(40,20,5,0.3)" }}>
          <div className="army-sheet" style={{ marginBlock: "auto" }}>
            <div className={`army-result-big ${result.won ? "army-win" : "army-lose"}`}>
              {result.won ? "انتصار!" : result.endless ? "انتهت الحملة" : "هُزم الجيش"}
            </div>
            <p style={{ textAlign: "center", margin: 0, color: "#7a5a35", fontWeight: 700 }}>
              {result.endless ? `وصلت إلى المرحلة ${n(result.stage)} في الوضع اللانهائي` : `المرحلة ${result.levelId} · ${result.name}`}
            </p>
            <div className="army-stats">
              <div className="army-stat">
                <b dir="ltr">+{n(result.coins)}</b>
                <span>عملات</span>
              </div>
              <div className="army-stat">
                <b dir="ltr">{result.won ? n(result.survivors) : `${n(result.progress)}%`}</b>
                <span>{result.won ? "رماة نجوا" : "من الطريق"}</span>
              </div>
            </div>
            {result.won && !result.endless && result.levelId < 10 ? (
              <button type="button" className="army-btn" onClick={() => start(result.levelId + 1)}>
                <Play className="size-5" />
                المرحلة التالية
              </button>
            ) : result.won && result.levelId === 10 ? (
              <button type="button" className="army-btn army-btn--gold" onClick={() => start(11)}>
                <InfinityIcon className="size-5" />
                افتح الوضع اللانهائي
              </button>
            ) : (
              <button type="button" className="army-btn" onClick={() => start(result.levelId)}>
                <RotateCcw className="size-5" />
                حاول مجددًا
              </button>
            )}
            <div className="army-row">
              <button type="button" className="army-btn army-btn--ghost" onClick={() => { backToMenu(); setScreen("upgrades"); }}>
                <Sparkles className="size-4" />
                التطويرات
              </button>
              <button type="button" className="army-btn army-btn--ghost" onClick={backToMenu}>
                <Home className="size-4" />
                القائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Upgrade(props: { icon: React.ReactNode; title: string; desc: string; level: number; max: number; cost: number; coins: number; onBuy: () => void }) {
  const maxed = props.level >= props.max;
  return (
    <div className="army-upg">
      <div className="army-upg__icon">{props.icon}</div>
      <div className="army-upg__body">
        <b>{props.title}</b>
        <span>{props.desc}</span>
        <div className="army-pips" aria-label={`المستوى ${props.level} من ${props.max}`}>
          {Array.from({ length: props.max }, (_, i) => (
            <i key={i} className={i < props.level ? "on" : ""} />
          ))}
        </div>
      </div>
      <button type="button" className="army-buy" disabled={maxed || props.coins < props.cost} onClick={props.onBuy} dir="ltr">
        {maxed ? "الأقصى" : (
          <>
            <Coin />
            {n(props.cost)}
          </>
        )}
      </button>
    </div>
  );
}
