'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import Regions from 'wavesurfer.js/dist/plugins/regions.esm.js';
import * as Tone from 'tone';
import Waveform from './Waveform';
import ControlsBar from './ControlsBar';

type Props = { src?: string };

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
    event: 'region-clicked' | 'region-removed' | 'region-updated' | 'region-created',
    cb: (region: Region, e?: any) => void
  ) => void;
};

const COLOR_DEFAULT = 'rgba(240,79,35,0.15)';
const COLOR_ACTIVE  = 'rgba(240,79,35,0.28)';

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

  // timeupdate loop handler
  const loopHandlerRef = useRef<((t: number) => void) | null>(null);
  const unlockedRef = useRef(false);

  // mirror state in refs to read inside DOM handlers
  const loopOnRef = useRef(false);
  const loopRegionIdRef = useRef<string | null>(null);
  useEffect(() => { loopOnRef.current = loopOn; }, [loopOn]);
  useEffect(() => { loopRegionIdRef.current = loopRegionId; }, [loopRegionId]);

  async function ensureAudioUnlocked() {
    if (unlockedRef.current) return;
    await Tone.start();
    const ws: any = wsRef.current;
    const ac: AudioContext | undefined =
      ws?.backend?.ac || ws?._backend?.ac || ws?.audioContext || ws?._audioContext;
    if (ac && ac.state === 'suspended') await ac.resume();
    unlockedRef.current = true;
  }

  // Helper to reset all loop buttons visually (used from multiple places)
  const resetAllLoopButtons = () => {
    document.querySelectorAll<HTMLButtonElement>('.ap-loop-btn').forEach((b) => {
      b.style.borderColor = '#eee';
      b.style.boxShadow = '0 1px 2px rgba(0,0,0,.05)';
      b.style.background = '#fff';
      b.textContent = 'Loop';
    });
  };

  // --- Wavesurfer mount ---
  useEffect(() => {
    if (!containerRef.current || !src) return;

    const regionsPluginInstance = (Regions as any).create();
    const regions = regionsPluginInstance as unknown as RegionsPlugin;

    const VISUAL_OPTS = {
      height: 128,
      splitChannels: false,
      normalize: false,
      waveColor: '#8c928fff',
      progressColor: '#09f7f7ff',
      cursorColor: '#dfdee2ff',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 30,
      minPxPerSec: 1,
      fillParent: true,
      interact: true,
      dragToSeek: true,
      hideScrollbar: false,
      autoScroll: true,
      autoCenter: true,
    };
    const visualKey = JSON.stringify(VISUAL_OPTS);

  const ws = WaveSurfer.create({
  container: containerRef.current,
  url: src,
  plugins: [regionsPluginInstance],
  ...VISUAL_OPTS,
  } as any);

    // Playback rate from your JSON (audioRate)
    ws.setPlaybackRate(1);

    ws.on('ready', () => setReady(true));
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    // Selection
    regions.on('region-clicked', (r: Region, e?: MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedRegionId(r.id);
      applyRegionColors();
    });

    // If a region is removed and it was looping, stop looping immediately
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

    // Ensure unlock on first interaction
    const el = containerRef.current;
    el?.addEventListener('pointerdown', async () => { await ensureAudioUnlocked(); }, { once: true });

    return () => {
      if (loopHandlerRef.current) ws.un('timeupdate', loopHandlerRef.current as any);
      ws.destroy();
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

  useEffect(() => {
    if (loopOn) {
      const transport = (Tone as any).getTransport ? (Tone as any).getTransport() : Tone.Transport;
      transport.bpm.value = bpm;
    }
  }, [bpm, loopOn]);

  // ---------- helpers ----------
  const getRegionEl = (region: Region) =>
    (region as any).element as HTMLElement ||
    (document.querySelector(`.wavesurfer-region[data-id="${region.id}"]`) as HTMLElement | null);

  const applyRegionColors = () => {
    const regions = regionsRef.current?.getRegions() ?? [];
    regions.forEach((r) => {
      const active = r.id === selectedRegionId || (loopOnRef.current && r.id === loopRegionIdRef.current);
      r.setOptions({ color: active ? COLOR_ACTIVE : COLOR_DEFAULT });
    });
  };

  // Editable label + hover controls (Loop / ×)
  const makeContentEl = (region: Region, initialText: string) => {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '0.2em 0.4em',
      background: 'transparent',
      pointerEvents: 'auto',
    } as CSSStyleDeclaration);

    // label
    const label = document.createElement('span');
    label.textContent = initialText;
    Object.assign(label.style, {
      font: '12px system-ui',
      background: '#fff',
      padding: '2px 6px',
      border: '1px solid #eee',
      borderRadius: '6px',
      boxShadow: '0 1px 2px rgba(0,0,0,.05)',
      whiteSpace: 'nowrap',
      userSelect: 'text',
      cursor: 'text',
    } as CSSStyleDeclaration);
    label.title = 'Double‑click to rename';

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
      if (e.key === 'Enter') { e.preventDefault(); commit(); label.blur(); }
      e.stopPropagation();
    });
    label.addEventListener('click', (e) => e.stopPropagation());
    label.addEventListener('blur', commit);

    // loop button
    const loopBtn = document.createElement('button');
    loopBtn.textContent = 'Loop';
    loopBtn.title = 'Loop this region';
    loopBtn.className = 'ap-loop-btn';
    loopBtn.dataset.regionId = region.id;
    Object.assign(loopBtn.style, {
      fontSize: '11px',
      padding: '2px 8px',
      border: '1px solid #eee',
      borderRadius: '6px',
      background: '#fff',
      cursor: 'pointer',
      display: 'none',
      transition: 'background 120ms, box-shadow 120ms, border-color 120ms',
    } as CSSStyleDeclaration);

    const setLoopBtnActive = (on: boolean) => {
      loopBtn.style.borderColor = on ? '#f04f23' : '#eee';
      loopBtn.style.boxShadow = on ? '0 0 0 1px rgba(240,79,35,0.25) inset' : '0 1px 2px rgba(0,0,0,.05)';
      loopBtn.style.background = on ? 'rgba(240,79,35,0.10)' : '#fff';
      loopBtn.textContent = on ? 'Looping' : 'Loop';
    };
    setLoopBtnActive(loopOnRef.current && loopRegionIdRef.current === region.id);

    loopBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await ensureAudioUnlocked();
      const ws = wsRef.current;
      if (!ws) return;

      const isActive = loopOnRef.current && loopRegionIdRef.current === region.id;

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
    Object.assign(delBtn.style, {
      width: '18px',
      height: '18px',
      lineHeight: '16px',
      fontSize: '14px',
      border: '1px solid #eee',
      borderRadius: '9px',
      background: '#fff',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,.05)',
      display: 'none',
    } as CSSStyleDeclaration);

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
        loopBtn.style.display = 'inline-block';
        delBtn.style.display = 'inline-block';
      });
      regionEl.addEventListener('mouseleave', () => {
        loopBtn.style.display = 'none';
        delBtn.style.display = 'none';
      });
    }

    wrap.appendChild(label);
    wrap.appendChild(loopBtn);
    wrap.appendChild(delBtn);
    return wrap;
  };

  // ----- Controls -----
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

  const toggleLoop = async () => {
    await ensureAudioUnlocked();
    if (!wsRef.current || !regionsRef.current || !selectedRegionId) return;

    const r = regionsRef.current.getRegions().find((x) => x.id === selectedRegionId);
    if (!r) return;

    const ws = wsRef.current;
    if (!ws) return;

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

    if (loopOn) {
      transport.stop();
      setLoopOn(false);
    } else {
      transport.start();
      setLoopOn(true);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Waveform containerRef={containerRef} />
      <ControlsBar
        ready={ready}
        isPlaying={isPlaying}
        bpm={bpm}
        selectedRegionId={selectedRegionId}
        loopOn={loopOn}
        loopRegionId={loopRegionId}
        onPlayToggle={togglePlay}
        onAddRegion={addRegion}
        onToggleLoop={toggleLoop}
        onClearRegions={clearRegions}
        onToggleMetronome={toggleMetronome}
        onBpmChange={setBpm}
      />
    </div>
  );
}
