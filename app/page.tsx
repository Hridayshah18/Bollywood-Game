"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bolt,
  ChevronRight,
  Clock3,
  Flame,
  Gamepad2,
  HelpCircle,
  Home,
  Infinity as InfinityIcon,
  LockKeyhole,
  Menu,
  Music2,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { type Challenge } from "@/lib/game-data";
import {
  SessionContentBlacklist,
  validateContentCatalog,
} from "@/lib/content-engine";
import {
  MASTER_CONTENT_MANAGER,
  difficultyForXp,
} from "@/lib/master-content-manager";

type Screen = "home" | "game" | "result";
type SaveData = { xp: number; coins: number; streak: number; highScore: number };

const defaultSave: SaveData = { xp: 640, coins: 340, streak: 7, highScore: 0 };

validateContentCatalog(MASTER_CONTENT_MANAGER.all());

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function playTone(kind: "tap" | "correct" | "wrong", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext;
  if (!AudioContextCtor) return;
  const ctx = new AudioContextCtor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  if (kind === "correct") {
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
  } else if (kind === "wrong") {
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.18);
  } else {
    osc.frequency.setValueAtTime(350, now);
  }
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
  osc.start(now);
  osc.stop(now + 0.25);
}

export default function BollyVerse() {
  const [screen, setScreen] = useState<Screen>("home");
  const [save, setSave] = useState<SaveData>(defaultSave);
  const [sound, setSound] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rounds, setRounds] = useState<Challenge[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [answers, setAnswers] = useState(0);
  const contentBlacklist = useRef(new SessionContentBlacklist());

  useEffect(() => {
    const raw = localStorage.getItem("bollyverse-save");
    if (raw) setSave({ ...defaultSave, ...JSON.parse(raw) });
    const blacklist = sessionStorage.getItem("bollyverse-content-blacklist");
    if (blacklist) {
      try {
        contentBlacklist.current = new SessionContentBlacklist(JSON.parse(blacklist));
      } catch {
        sessionStorage.removeItem("bollyverse-content-blacklist");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bollyverse-save", JSON.stringify(save));
  }, [save]);

  useEffect(() => {
    const current = rounds[roundIndex];
    if (screen !== "game" || !current) return;
    contentBlacklist.current.add(current);
    sessionStorage.setItem(
      "bollyverse-content-blacklist",
      JSON.stringify(contentBlacklist.current.snapshot()),
    );
  }, [roundIndex, rounds, screen]);

  const startGame = (mode?: string) => {
    playTone("tap", sound);
    const chosen = MASTER_CONTENT_MANAGER.selectSession({
      count: 5,
      blacklist: contentBlacklist.current,
      preferredType: mode as Challenge["type"] | undefined,
      preferredDifficulty: difficultyForXp(save.xp),
      filters: { minQualityScore: 0.6 },
    });
    if (chosen.length < 5) {
      throw new Error("Content catalog exhausted before the 50-question blacklist window expired.");
    }
    setRounds(chosen);
    setRoundIndex(0);
    setScore(0);
    setCombo(0);
    setAnswers(0);
    setScreen("game");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishAnswer = (correct: boolean, points: number) => {
    const nextCombo = correct ? combo + 1 : 0;
    if (correct) setScore((current) => current + points + combo * 50);
    setCombo(nextCombo);
    setAnswers((current) => current + (correct ? 1 : 0));
  };

  const nextRound = () => {
    if (roundIndex === rounds.length - 1) {
      const earnedXp = Math.round(score / 10) + answers * 20;
      const earnedCoins = answers * 12;
      setSave((current) => ({
        ...current,
        xp: current.xp + earnedXp,
        coins: current.coins + earnedCoins,
        highScore: Math.max(current.highScore, score),
      }));
      setScreen("result");
    } else {
      setRoundIndex((current) => current + 1);
    }
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Header
        screen={screen}
        save={save}
        sound={sound}
        menuOpen={menuOpen}
        onSound={() => setSound((value) => !value)}
        onMenu={() => setMenuOpen((value) => !value)}
        onHome={() => setScreen("home")}
      />
      <AnimatePresence mode="wait">
        {screen === "home" && <HomeScreen key="home" save={save} onPlay={startGame} />}
        {screen === "game" && rounds[roundIndex] && (
          <GameScreen
            key={`${roundIndex}-${rounds[roundIndex].question_id}`}
            challenge={rounds[roundIndex]}
            index={roundIndex}
            total={rounds.length}
            score={score}
            combo={combo}
            sound={sound}
            onAnswered={finishAnswer}
            onNext={nextRound}
            onExit={() => setScreen("home")}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            key="result"
            score={score}
            correct={answers}
            best={Math.max(save.highScore, score)}
            onAgain={() => startGame()}
            onHome={() => setScreen("home")}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function Header({ screen, save, sound, menuOpen, onSound, onMenu, onHome }: {
  screen: Screen; save: SaveData; sound: boolean; menuOpen: boolean;
  onSound: () => void; onMenu: () => void; onHome: () => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={onHome} aria-label="BollyVerse home">
        <span className="brand-mark">B<span>★</span></span>
        <span><strong>BOLLY</strong>VERSE<small>The ultimate Bollywood challenge</small></span>
      </button>
      <nav className={menuOpen ? "nav-open" : ""} aria-label="Primary navigation">
        <button className={screen === "home" ? "active" : ""} onClick={onHome}><Home size={17} /> Home</button>
        <button onClick={() => document.getElementById("games")?.scrollIntoView({ behavior: "smooth" })}><Gamepad2 size={17} /> Games</button>
        <button onClick={() => document.getElementById("daily")?.scrollIntoView({ behavior: "smooth" })}><Target size={17} /> Daily</button>
        <button><Trophy size={17} /> Leaderboard</button>
      </nav>
      <div className="header-actions">
        <div className="streak-pill"><Flame size={17} fill="currentColor" /> {save.streak}</div>
        <div className="coin-pill"><span>●</span> {save.coins}</div>
        <button className="icon-button" onClick={onSound} aria-label={sound ? "Mute sounds" : "Enable sounds"}>
          {sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
        <button className="avatar" aria-label="Profile">MK</button>
        <button className="menu-button" onClick={onMenu} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}

function HomeScreen({ save, onPlay }: { save: SaveData; onPlay: (mode?: string) => void }) {
  const xpPercent = ((save.xp % 1000) / 1000) * 100;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <section className="hero-section">
        <div className="hero-art" aria-hidden="true" />
        <div className="hero-shade" />
        <motion.div className="hero-copy" initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }}>
          <div className="eyebrow"><Sparkles size={15} /> आज की फ़िल्मी महफ़िल</div>
          <h1>Filmon ki<br /><em>Baazi!</em></h1>
          <p>Iconic dialogues, yaadgaar filmein, aur apni Bollywood wali yaadein—kitne bade filmy ho aap?</p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={() => onPlay()}><Play size={18} fill="currentColor" /> Start Playing <ArrowRight size={18} /></button>
            <button className="secondary-button" onClick={() => document.getElementById("games")?.scrollIntoView({ behavior: "smooth" })}><Gamepad2 size={18} /> Explore Games</button>
          </div>
          <div className="hero-meta"><span><span className="online-dot" /> 2,847 playing now</span><span>•</span><span>No sign-up needed</span></div>
        </motion.div>
        <motion.div className="floating-score" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <span className="score-icon"><Award size={22} /></span>
          <span><small>Your rank</small><strong>Movie Buff</strong></span>
          <span className="level">LVL 4</span>
        </motion.div>
        <div className="scroll-cue"><span>SCROLL TO EXPLORE</span><i /></div>
      </section>

      <section className="content-wrap dashboard-row" id="daily">
        <motion.article className="daily-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="daily-glow" />
          <div className="daily-icon"><Target size={30} /></div>
          <div className="daily-copy">
            <span className="section-kicker">TODAY&apos;S CHALLENGE</span>
            <h2>The Filmy Five</h2>
            <p>5 questions. One shot. Double XP.</p>
            <div className="reward-tags"><span><Zap size={13} fill="currentColor" /> 2× XP</span><span>🪙 +50</span></div>
          </div>
          <div className="daily-action">
            <div className="timer"><Clock3 size={15} /> Resets in 08:42:16</div>
            <button onClick={() => onPlay()}>PLAY NOW <ChevronRight size={17} /></button>
          </div>
        </motion.article>

        <article className="progress-card">
          <div className="progress-head"><span><span className="level-badge">4</span><strong>Movie Buff</strong></span><span>{save.xp % 1000} / 1,000 XP</span></div>
          <div className="xp-track"><motion.i initial={{ width: 0 }} whileInView={{ width: `${Math.max(12, xpPercent)}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div>
          <div className="next-rank"><span>Next rank</span><strong>Dialogue Expert</strong></div>
        </article>
      </section>

      <section className="content-wrap games-section" id="games">
        <div className="section-title">
          <div><span className="section-kicker">PICK YOUR CHALLENGE</span><h2>Your stage awaits</h2></div>
          <button>View all games <ArrowRight size={16} /></button>
        </div>
        <div className="game-grid">
          <GameCard number="01" title="Dialogue Duel" text="Match the line. Name the movie. Own the moment." label="Crowd favourite" color="coral" icon={<Bolt />} onClick={() => onPlay("dialogue")} />
          <GameCard number="02" title="Movie Pyramid" text="Unlock clues. Guess early. Score big." label="Brain teaser" color="violet" icon={<InfinityIcon />} onClick={() => onPlay("pyramid")} />
          <GameCard number="03" title="Finish the Line" text="You know the setup. Can you land the punchline?" label="Nostalgia hit" color="gold" icon={<Music2 />} onClick={() => onPlay("finish")} />
          <GameCard number="04" title="Who Said It?" text="Four stars. One iconic voice. Choose wisely." label="Star power" color="pink" icon={<UserRound />} onClick={() => onPlay("actor")} />
        </div>
      </section>

      <section className="content-wrap coming-row">
        <div className="speed-banner">
          <div className="speed-mark"><Zap size={32} fill="currentColor" /></div>
          <div><span className="section-kicker">FEELING QUICK?</span><h3>30 Second Speed Round</h3><p>Rapid-fire questions. Massive combo multipliers.</p></div>
          <button onClick={() => onPlay()}><Play size={17} fill="currentColor" /> Start the clock</button>
        </div>
        <div className="locked-card"><LockKeyhole /><div><span>COMING SOON</span><strong>Movie Merge</strong><small>A puzzling new way to play</small></div></div>
      </section>
      <footer><div className="footer-brand">B<span>★</span></div><p>Made with <span>♥</span> for every Bollywood fan.</p><small>Original fan game • No movie assets used</small></footer>
    </motion.div>
  );
}

function GameCard({ number, title, text, label, color, icon, onClick }: {
  number: string; title: string; text: string; label: string; color: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <motion.button className={`game-card ${color}`} onClick={onClick} whileHover={{ y: -7 }} whileTap={{ scale: 0.98 }}>
      <span className="game-number">{number}</span><span className="game-icon">{icon}</span>
      <span className="game-label">{label}</span><h3>{title}</h3><p>{text}</p>
      <span className="play-link">PLAY NOW <ArrowRight size={16} /></span>
    </motion.button>
  );
}

function GameScreen({ challenge, index, total, score, combo, sound, onAnswered, onNext, onExit }: {
  challenge: Challenge; index: number; total: number; score: number; combo: number; sound: boolean;
  onAnswered: (correct: boolean, points: number) => void; onNext: () => void; onExit: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealedClues, setRevealedClues] = useState(challenge.type === "pyramid" ? 1 : 0);
  const [locked, setLocked] = useState(false);
  const options = useMemo(() => shuffle(challenge.options), [challenge.question_id]);
  const answered = selected !== null;
  const correct = selected === challenge.answer;
  const potentialPoints = Math.max(300, challenge.points - (revealedClues - 1) * 150);

  const answer = (option: string) => {
    if (locked) return;
    const isCorrect = option === challenge.answer;
    setSelected(option);
    setLocked(true);
    playTone(isCorrect ? "correct" : "wrong", sound);
    onAnswered(isCorrect, potentialPoints);
  };

  return (
    <motion.section className="play-screen" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <div className="play-topline">
        <button className="quit-button" onClick={onExit}><X size={18} /> Exit</button>
        <div className="round-progress"><span>ROUND {index + 1} OF {total}</span><div>{Array.from({ length: total }).map((_, i) => <i key={i} className={i <= index ? "done" : ""} />)}</div></div>
        <div className="score-live"><Star size={17} fill="currentColor" /> {score.toLocaleString()} {combo > 1 && <b>×{combo}</b>}</div>
      </div>

      <div className="play-stage">
        <div className="mode-chip">{modeName(challenge.type)}</div>
        <motion.div className="question-card" layout>
          <div className={`question-art ${challenge.type}`}>
            <span>{challenge.emoji}</span>
            <div className="rings" />
          </div>
          <div className="question-body">
            <span className="question-prompt">{challenge.prompt}</span>
            <h1>{challenge.question}</h1>
            {challenge.type === "pyramid" && challenge.clues && (
              <div className="clue-list">
                {challenge.clues.slice(0, revealedClues).map((clue, i) => <motion.span key={clue} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}><b>0{i + 1}</b>{clue}</motion.span>)}
              </div>
            )}
            {!answered && challenge.type === "pyramid" && challenge.clues && revealedClues < challenge.clues.length && (
              <button className="clue-button" onClick={() => setRevealedClues((value) => value + 1)}><HelpCircle size={17} /> Reveal another clue <small>−150 pts</small></button>
            )}
            <div className={`answers ${challenge.type === "actor" ? "actor-answers" : ""}`}>
              {options.map((option, i) => {
                const state = answered ? option === challenge.answer ? "correct" : option === selected ? "wrong" : "muted" : "";
                return <motion.button key={option} className={state} onClick={() => answer(option)} whileHover={!answered ? { y: -3 } : {}} whileTap={!answered ? { scale: 0.98 } : {}}><span className="answer-key">{String.fromCharCode(65 + i)}</span>{challenge.type === "actor" && <i>{option.split(" ").map((word) => word[0]).slice(0, 2).join("")}</i>}<strong>{option}</strong>{state === "correct" && <span className="answer-result">✓</span>}{state === "wrong" && <span className="answer-result">×</span>}</motion.button>;
              })}
            </div>
          </div>
        </motion.div>
        <AnimatePresence>
          {answered && (
            <motion.div className={`reveal-bar ${correct ? "success" : "miss"}`} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
              {correct && <Confetti />}
              <div className="reveal-icon">{correct ? "✓" : "!"}</div>
              <div><span>{correct ? (combo >= 2 ? `${combo + 1}× COMBO!` : "BLOCKBUSTER!") : "SO CLOSE!"}</span><strong>{correct ? `+${potentialPoints + combo * 50} points` : `It was “${challenge.answer}”`}</strong><small>{challenge.fact}</small></div>
              <button onClick={onNext}>{index === total - 1 ? "See results" : "Next challenge"}<ArrowRight size={18} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function Confetti() {
  return <div className="confetti" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}</div>;
}

function ResultScreen({ score, correct, best, onAgain, onHome }: { score: number; correct: number; best: number; onAgain: () => void; onHome: () => void }) {
  const title = correct === 5 ? "Bollywood Superstar" : correct >= 3 ? "Dialogue Dynamo" : "Rising Movie Buff";
  return (
    <motion.section className="result-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Confetti />
      <motion.div className="result-card" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 16 }}>
        <div className="result-crown"><Trophy size={42} /></div>
        <span className="section-kicker">SHOW&apos;S OVER. SCORE&apos;S IN.</span>
        <h1>{title}</h1>
        <p>You brought the drama, the dialogue, and the filmi knowledge.</p>
        <div className="final-score"><span>FINAL SCORE</span><strong>{score.toLocaleString()}</strong>{score >= best && score > 0 && <small>NEW PERSONAL BEST</small>}</div>
        <div className="result-stats"><span><strong>{correct}/5</strong>Correct</span><span><strong>+{Math.round(score / 10) + correct * 20}</strong>XP earned</span><span><strong>+{correct * 12}</strong>Coins</span></div>
        <div className="personality"><Sparkles /><span>Your BollyVerse personality<strong>{correct >= 4 ? "The Movie Detective" : "The Mass Entertainer"}</strong></span></div>
        <div className="result-actions"><button className="primary-button" onClick={onAgain}><RotateCcw size={18} /> One more round</button><button className="secondary-button" onClick={onHome}><Home size={18} /> Back home</button></div>
      </motion.div>
    </motion.section>
  );
}

function modeName(type: Challenge["type"]) {
  return ({ dialogue: "Dialogue Duel", pyramid: "Movie Pyramid", finish: "Finish the Line", actor: "Who Said It?" } as const)[type];
}
