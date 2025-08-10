'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js';
import * as Tone from 'tone';

type Props = { src?: string };

// Narrow types for the regions plugin
type Region = {
  id: string;
  start: number;
  end: number;
  remove: () => void;
  setOptions: (opts: any) => void;
  data?: Record<string, any>;
};
type RegionsPlugin = {
  addRegion: (opts: {
    start: number;
    end: number;
    color?: string;
    drag?: boolean;
    resize?: boolean;
    content?: string | HTMLElement;
  }) => Region;
  getRegions: () => Region[];
  on: (
    event:
      | 'region-clicked'
      | 'region-removed'
      | 'region-updated'
      | 'region-created',
    cb: (region: Region, e?: any) => void
  ) => void;
};

const COLOR_DEFAULT = 'rgba(240,79,35,0.25)'; // brand-1 orange on dark
const COLOR_ACTIVE = 'rgba(240,79,35,0.45)';

export default function AudioPractice({ src }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);

  const [ready, setReady] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);

  // selection + loop state
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [loopRegionId, setLoopRegionId] = useState<string | null>(null);
  const [loopOn, setLoopOn] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);

  // runtime refs for handlers
  const loopHandlerRef = useRef<((t: number) => void) | null>(null);
  const unlockedRef = useRef(false);
  const loopOnRef = useRef(false);
  const loopRegionIdRef = useRef<string | null>(null);

  useEffect(() => { loopOnRef.current = loopOn; }, [loopOn]);
  useEffect(() => { loopRegionIdRef.current = loopRegionId; }, [loopRegionId]);

  async function ensureAudioUnlocked() {
    if (unlockedRef.current) return;
    await Tone.start();
    const anyWs: any = wsRef.current;
    const ac: AudioContext | undefined =
      anyWs?.backend?.ac || anyWs?._backend?.ac || anyWs?.audioContext || anyWs?._audioContext;
    if (ac && ac.state === 'suspended') await ac.resume();
    unlockedRef.current = true;
  }

  // ---------- Wavesurfer mount ----------
  useEffect(() => {
    if (!containerRef.current || !src) return;

    const regionsPluginInstance = (Regions as any).create();
    const regions = regionsPluginInstance as unknown as RegionsPlugin;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 112,
      url: src,
      waveColor: '#4b5563',      // tailwind gray-600
      progressColor: '#e5e7eb',  // tailwind gray-200
      cursorColor: '#f04f23',    // brand-1
      cursorWidth: 2,
      interact: true,
      plugins: [regionsPluginInstance],
    });

    ws.on('ready', () => setReady(true));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    // Selection logic
    regions.on('region-clicked', (r: Region, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedRegionId(r.id);
      applyRegionColors();
    });

    // If a looping region is deleted, stop the loop immediately
    regions.on('region-removed', (r: Region) => {
      const wsLocal = wsRef.current;
      if (!wsLocal) return;

      if (loopOnRef.current && loopRegionIdRef.current === r.id) {
        if (loopHandlerRef.current) {
          wsLocal.un('timeupdate', loopHandlerRef.current as any);
          loopHandlerRef.current = null;
        }
        loopOnRef.current = false;
        loopRegionIdRef.current = null;
        setLoopOn(false);
        setLoopRegionId(null);
        resetAllLoopButtons();
        applyRegionColors();
      }
      setSelectedRegionId((prev) => (prev === r.id ? null : prev));
    });

    wsRef.current = ws;
    regionsRef.current = regions;

    // First interaction unlock
    const el = containerRef.current;
    const unlockOnce = async () => { await ensureAudioUnlocked(); };
    el?.addEventListener('pointerdown', unlockOnce, { once: true });

    return () => {
      if (loopHandlerRef.current) ws.un('timeupdate', loopHandlerRef.current as any);
      ws.destroy();
      el?.removeEventListener('pointerdown', unlockOnce);
      wsRef.current = null;
      regionsRef.current = null;
    };
  }, [src]);

  // Tone cleanup
  useEffect(() => {
    return () => {
      const transport = (Tone as any).getTransport ? (Tone as any).getTransport() : Tone.Transport;
      transport.stop();
      transport.cancel(0);
    };
  }, []);

  // Keep metronome tempo in sync
  useEffect(() => {
    if (!isMetronomeOn) return;
    const transport = (Tone as any).getTransport ? (Tone as any).getTransport() : Tone.Transport;
    transport.bpm.value = bpm;
  }, [bpm, isMetronomeOn]);

  // ---------- helpers ----------
  const getRegionEl = (region: Region) =>
    (region as any).element as HTMLElement ||
    (document.querySelector(`.wavesurfer-region[data-id="${region.id}"]`) as HTMLElement | null);

  const applyRegionColors = () => {
    const regions = regionsRef.current?.getRegions() ?? [];
    regions.forEach((r) => {
      const active =
        r.id === selectedRegionId || (loopOnRef.current && r.id === loopRegionIdRef.current);
      r.setOptions({ color: active ? COLOR_ACTIVE : COLOR_DEFAULT });
    });
  };

  // Build region controls element (label + Loop + Delete)
  const makeContentEl = (region: Region, initialText: string) => {
    const wrap = document.createElement('div');
    wrap.className = [
      // container
      'inline-flex items-center gap-2 pointer-events-auto select-none',
    ].join(' ');

    // label
    const label = document.createElement('span');
    label.textContent = initialText;
    label.title = 'Double‑click to rename';
    label.className = [
      'text-xs',
      'bg-neutral-800',
      'text-neutral-100',
      'px-2 py-0.5',
      'border border-neutral-700',
      'rounded-md',
      'whitespace-nowrap',
      'cursor-text',
    ].join(' ');

    const enableEdit = () => {
      label.contentEditable = 'true';
      label.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(label);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };
    const commit = () => {
      label.contentEditable = 'false';
      const name = (label.textContent || '').trim() || 'Region';
      label.textContent = name;
      region.data = { ...(region.data || {}), name };
    };
    label.addEventListener('dblclick', (e) => { e.stopPropagation(); enableEdit(); });
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commit();
        label.blur();
      }
      e.stopPropagation();
    });
    label.addEventListener('click', (e) => e.stopPropagation());
    label.addEventListener('blur', commit);

    // loop button
    const loopBtn = document.createElement('button');
    loopBtn.textContent = 'Loop';
    loopBtn.title = 'Loop this region';
    loopBtn.className = [
      'ap-loop-btn',
      'text-[11px]',
      'px-2 py-0.5',
      'border rounded-md',
      'bg-neutral-900',
      'border-neutral-700',
      'text-neutral-200',
      'hidden', // shown on hover
      'transition',
      'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[--ring-color]',
      'hover:bg-neutral-800',
      'active:scale-[0.98]',
    ].join(' ');
    loopBtn.setAttribute('data-region-id', region.id);

    const setLoopBtnActive = (on: boolean) => {
      if (on) {
        loopBtn.textContent = 'Looping';
        loopBtn.classList.add('ring-1');
        loopBtn.style.setProperty('--ring-color', 'rgba(240,79,35,0.45)');
        loopBtn.classList.remove('bg-neutral-900');
        loopBtn.classList.add('bg-neutral-800');
      } else {
        loopBtn.textContent = 'Loop';
        loopBtn.classList.remove('ring-1');
        loopBtn.style.removeProperty('--ring-color');
        loopBtn.classList.remove('bg-neutral-800');
        loopBtn.classList.add('bg-neutral-900');
      }
    };
    setLoopBtnActive(loopOnRef.current && loopRegionIdRef.current === region.id);

    loopBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await ensureAudioUnlocked();
      const ws = wsRef.current;
      if (!ws) return;

      const isActive = loopOnRef.current && loopRegionIdRef.current === region.id;

      // TURN OFF current loop
      if (isActive) {
        if (loopHandlerRef.current) {
          ws.un('timeupdate', loopHandlerRef.current as any);
          loopHandlerRef.current = null;
        }
        loopOnRef.current = false;
        loopRegionIdRef.current = null;
        setLoopOn(false);
        setLoopRegionId(null);
        resetAllLoopButtons();
        setLoopBtnActive(false);
        applyRegionColors();
        return;
      }

      // Turn off any previous handler
      if (loopHandlerRef.current) {
        ws.un('timeupdate', loopHandlerRef.current as any);
        loopHandlerRef.current = null;
      }

      loopRegionIdRef.current = region.id;
      loopOnRef.current = true;
      setLoopRegionId(region.id);
      setLoopOn(true);

      resetAllLoopButtons();
      setLoopBtnActive(true);

      ws.setTime(region.start);
      if (!ws.isPlaying()) ws.play();

      const handler = (t: number) => {
        if (t >= region.end) ws.setTime(region.start);
      };
      loopHandlerRef.current = handler;
      ws.on('timeupdate', handler);

      applyRegionColors();
    });

    // delete button
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Delete region';
    delBtn.className = [
      'w-[18px] h-[18px]',
      'leading-[16px]',
      'text-[14px]',
      'border rounded-full',
      'bg-neutral-900',
      'border-neutral-700',
      'text-neutral-200',
      'hidden', // shown on hover
      'transition',
      'hover:bg-neutral-800',
      'active:scale-[0.98]',
      'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-neutral-700',
      'text-center',
    ].join(' ');

    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ws = wsRef.current;

      if (ws && loopOnRef.current && loopRegionIdRef.current === region.id) {
        if (loopHandlerRef.current) {
          ws.un('timeupdate', loopHandlerRef.current as any);
          loopHandlerRef.current = null;
        }
        loopOnRef.current = false;
        loopRegionIdRef.current = null;
        setLoopOn(false);
        setLoopRegionId(null);
        resetAllLoopButtons();
        applyRegionColors();
      }

      if (selectedRegionId === region.id) setSelectedRegionId(null);
      region.remove();
    });

    // show buttons on region hover
    const regionEl = getRegionEl(region);
    if (regionEl) {
      regionEl.addEventListener('mouseenter', () => {
        loopBtn.classList.remove('hidden');
        delBtn.classList.remove('hidden');
      });
      regionEl.addEventListener('mouseleave', () => {
        loopBtn.classList.add('hidden');
        delBtn.classList.add('hidden');
      });
    }

    wrap.appendChild(label);
    wrap.appendChild(loopBtn);
    wrap.appendChild(delBtn);
    return wrap;
  };

  // Reset loop buttons visuals
  const resetAllLoopButtons = () => {
    document.querySelectorAll<HTMLButtonElement>('.ap-loop-btn').forEach((b) => {
      b.textContent = 'Loop';
      b.classList.remove('ring-1');
      b.style.removeProperty('--ring-color');
      b.classList.remove('bg-neutral-800');
      if (!b.classList.contains('bg-neutral-900')) b.classList.add('bg-neutral-900');
    });
  };

  // ---------- Controls ----------
  const togglePlay = async () => {
    await ensureAudioUnlocked();
    wsRef.current?.isPlaying() ? wsRef.current?.pause() : wsRef.current?.play();
  };

  const addRegion = () => {
    if (!wsRef.current || !regionsRef.current) return;
    const duration = wsRef.current.getDuration();
    const start = Math.max(0, wsRef.current.getCurrentTime() - 2);
    const end = Math.min(duration, start + 4);

    const region = regionsRef.current.addRegion({
      start,
      end,
      color: COLOR_DEFAULT,
      drag: true,
      resize: true,
    });

    const content = makeContentEl(region, 'Region');
    region.setOptions({ content });
    region.data = { ...(region.data || {}), name: 'Region' };
    setSelectedRegionId(region.id);
    applyRegionColors();
  };

  const deleteSelected = () => {
    if (!regionsRef.current || !selectedRegionId) return;
    const r = regionsRef.current.getRegions().find((x) => x.id === selectedRegionId);
    r?.remove(); // region-removed listener handles loop cleanup + selection reset
  };

  const clearRegions = () => {
    if (!regionsRef.current) return;
    regionsRef.current.getRegions().forEach((r) => r.remove());
    setSelectedRegionId(null);
    setLoopRegionId(null);
    if (loopHandlerRef.current && wsRef.current) {
      wsRef.current.un('timeupdate', loopHandlerRef.current as any);
      loopHandlerRef.current = null;
    }
    setLoopOn(false);
    resetAllLoopButtons();
    applyRegionColors();
  };

  const toggleLoopSelected = async () => {
    await ensureAudioUnlocked();
    if (!wsRef.current || !regionsRef.current || !selectedRegionId) return;

    const r = regionsRef.current.getRegions().find((x) => x.id === selectedRegionId);
    if (!r) return;

    const ws = wsRef.current!;
    // If already looping this region, turn off
    if (loopOn && loopRegionId === r.id) {
      if (loopHandlerRef.current) {
        ws.un('timeupdate', loopHandlerRef.current as any);
        loopHandlerRef.current = null;
      }
      setLoopOn(false);
      setLoopRegionId(null);
      resetAllLoopButtons();
      applyRegionColors();
      return;
    }

    // Turn off previous loop
    if (loopHandlerRef.current) {
      ws.un('timeupdate', loopHandlerRef.current as any);
      loopHandlerRef.current = null;
    }

    setLoopRegionId(r.id);
    setLoopOn(true);
    resetAllLoopButtons();

    ws.setTime(r.start);
    if (!ws.isPlaying()) ws.play();

    const handler = (t: number) => {
      if (t >= r.end) ws.setTime(r.start);
    };
    loopHandlerRef.current = handler;
    ws.on('timeupdate', handler);
    applyRegionColors();
  };

  const toggleMetronome = async () => {
    await ensureAudioUnlocked();

    const transport = (Tone as any).getTransport ? (Tone as any).getTransport() : Tone.Transport;
    transport.bpm.value = bpm;

    const synth = new Tone.MembraneSynth({ octaves: 10, pitchDecay: 0.001 }).toDestination();
    transport.cancel(0);
    transport.scheduleRepeat((time: number) => {
      synth.triggerAttackRelease('C4', 0.05, time);
    }, '4n', 0);

    if (isMetronomeOn) {
      transport.stop();
      setIsMetronomeOn(false);
    } else {
      transport.start();
      setIsMetronomeOn(true);
    }
  };

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        await togglePlay();
      }
      if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        addRegion();
      }
      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        await toggleLoopSelected();
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        await toggleMetronome();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedRegionId, loopOn, loopRegionId, isMetronomeOn, bpm]);

  // ---------- UI ----------
  return (
    <section className="w-full max-w-[1440px] mx-auto">
      {/* Stage: dark panel with rounded corners */}
      <div className="bg-neutral-900 p-4 md:p-6">
        {/* Waveform column: pure black background */}
        <div className="bg-black rounded-xl p-3 md:p-4">
          <div
            ref={containerRef}
            className="w-full h-[112px] select-none"
            aria-label="Waveform"
          />
        </div>

        {/* Transport + tools */}
        <div className="mt-4 flex flex-wrap items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-neutral-100 text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-neutral-300"
            aria-pressed={isPlaying}
          >
            {isPlaying ? 'Pause' : 'Play'}
            <span className="text-[10px] uppercase tracking-wide opacity-70">Space</span>
          </button>

          <button
            type="button"
            onClick={addRegion}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-neutral-200 text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-neutral-300"
            title="Create a 4s region around the playhead"
          >
            Create Region <span className="text-[10px] uppercase tracking-wide opacity-70">R</span>
          </button>

          <button
            type="button"
            onClick={toggleLoopSelected}
            disabled={!ready || !selectedRegionId}
            className={[
              'inline-flex items-center gap-2 rounded-xl px-3 py-2',
              loopOn && loopRegionId === selectedRegionId
                ? 'bg-[rgba(240,79,35,0.2)] text-neutral-100 ring-1 ring-[rgba(240,79,35,0.45)]'
                : 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
              'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]',
              'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-neutral-300',
            ].join(' ')}
          >
            {loopOn && loopRegionId === selectedRegionId ? 'Stop Loop' : 'Loop Selected'}
            <span className="text-[10px] uppercase tracking-wide opacity-70">L</span>
          </button>

          <button
            type="button"
            onClick={clearRegions}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-neutral-800 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-neutral-600"
            title="Remove all regions"
          >
            Clear Regions
          </button>

          <div className="h-6 w-px bg-neutral-700 mx-1" />

          <label className="inline-flex items-center gap-2 text-neutral-300">
            <span className="text-sm">BPM</span>
            <input
              type="number"
              min={20}
              max={280}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value || '100', 10))}
              className="w-20 rounded-lg bg-neutral-800 border border-neutral-700 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-600"
            />
          </label>

          <button
            type="button"
            onClick={toggleMetronome}
            className={[
              'inline-flex items-center gap-2 rounded-xl px-3 py-2',
              isMetronomeOn
                ? 'bg-neutral-700 text-neutral-100 ring-1 ring-neutral-500'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700',
              'active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-neutral-600',
            ].join(' ')}
            aria-pressed={isMetronomeOn}
            title="Toggle metronome"
          >
            {isMetronomeOn ? 'Stop Metronome' : 'Start Metronome'}
            <span className="text-[10px] uppercase tracking-wide opacity-70">M</span>
          </button>

          <div className="ml-auto text-xs text-neutral-500">
            Tip: Click a region to select • Hover to Loop/×
          </div>
        </div>
      </div>
    </section>
  );
}
