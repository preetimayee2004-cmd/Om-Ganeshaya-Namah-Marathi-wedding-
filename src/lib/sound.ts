import { useSyncExternalStore } from "react";
import { weddingAudio } from "../components/Countdown/weddingAudio";

/**
 * One sound switch for the whole site (top-left speaker button) plus the intro's Skip hook.
 *  - Background music: /audio/bgm.mp3 if that file exists, otherwise none.
 *  - Muting also silences every sound effect (temple bell, scratch, shehnai, party popper).
 * Music can only start from a tap (browser autoplay rules): the door tap, Skip, or the speaker button.
 */

const MUSIC_FILE = "/audio/bgm.mp3";

type State = { muted: boolean; started: boolean; introActive: boolean };
let state: State = { muted: false, started: false, introActive: true };
const subs = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
};

let fileAudio: HTMLAudioElement | null = null;
let hasFile = false;
// checked up front so the later play() still runs inside the tap (iOS needs that)
if (typeof window !== "undefined") {
  fetch(MUSIC_FILE, { method: "HEAD" })
    .then((r) => {
      hasFile = r.ok && (r.headers.get("content-type") ?? "").startsWith("audio");
    })
    .catch(() => {});
}

function playMusic() {
  if (hasFile) {
    if (!fileAudio) {
      fileAudio = new Audio(MUSIC_FILE);
      fileAudio.loop = true;
      fileAudio.volume = 0.5;
    }
    void fileAudio.play().catch(() => {});
  }
  // no music file: stay silent (the synthesized tanpura drone was removed on request)
}

function pauseMusic() {
  fileAudio?.pause();
  weddingAudio.stopDrone();
}

let skipIntro: (() => void) | null = null;

export const sound = {
  isMuted: () => state.muted,
  /** first tap: start the music (unless the guest muted it already) */
  start() {
    if (state.started) return;
    set({ started: true });
    if (!state.muted) playMusic();
  },
  toggle() {
    if (!state.started) {
      // first press of the speaker button means "play"
      set({ started: true, muted: false });
      weddingAudio.setMuted(false);
      playMusic();
      return;
    }
    const muted = !state.muted;
    weddingAudio.setMuted(muted);
    if (muted) pauseMusic();
    else playMusic();
    set({ muted });
  },
  /** Intro registers its skip() and whether the opening animation is still running */
  registerIntro(skip: () => void) {
    skipIntro = skip;
  },
  setIntroActive(introActive: boolean) {
    if (state.introActive !== introActive) set({ introActive });
  },
  skipIntro() {
    sound.start();
    skipIntro?.();
  },
};

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
export const useSoundState = () => useSyncExternalStore(subscribe, () => state);
