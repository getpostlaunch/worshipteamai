type Props = {
  ready: boolean;
  isPlaying: boolean;
  bpm: number;
  selectedRegionId: string | null;
  loopOn: boolean;
  loopRegionId: string | null;

  onPlayToggle: () => void;
  onAddRegion: () => void;
  onToggleLoop: () => void;
  onClearRegions: () => void;
  onToggleMetronome: () => void;
  onBpmChange: (v: number) => void;
};

export default function ControlsBar({
  ready,
  isPlaying,
  bpm,
  selectedRegionId,
  loopOn,
  loopRegionId,

  onPlayToggle,
  onAddRegion,
  onToggleLoop,
  onClearRegions,
  onToggleMetronome,
  onBpmChange,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={onPlayToggle} disabled={!ready}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <button onClick={onAddRegion} disabled={!ready}>
        Create region
      </button>

      <button onClick={onToggleLoop} disabled={!ready || !selectedRegionId}>
        {loopOn && loopRegionId === selectedRegionId ? 'Stop Loop' : 'Loop Selected'}
      </button>

      <button onClick={onClearRegions} disabled={!ready}>
        Clear Regions
      </button>

      <label>
        BPM
        <input
          type="number"
          min={20}
          max={280}
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value || '100', 10))}
          style={{ width: 72, marginLeft: 6 }}
        />
      </label>

      <button onClick={onToggleMetronome}>
        {loopOn ? 'Stop Metronome' : 'Start Metronome'}
      </button>
    </div>
  );
}
