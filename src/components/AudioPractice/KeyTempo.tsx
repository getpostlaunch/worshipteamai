type Props = {
  semitones: number;             // -12 .. +12 (recommend)
  tempo: number;                  // 0.5 .. 2.0
  onSemitonesChange: (v: number) => void;
  onTempoChange: (v: number) => void;
};

export default function KeyTempo({ semitones, tempo, onSemitonesChange, onTempoChange }: Props) {
  return (
    <div className="grid gap-4">
      <div>
        <label className="block text-sm mb-1">Pitch (semitones)</label>
        <input
          type="range"
          min={-12}
          max={12}
          step={1}
          value={semitones}
          onChange={(e) => onSemitonesChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-gray-700 mt-1">{semitones} st</div>
      </div>

      <div>
        <label className="block text-sm mb-1">Tempo (playback rate)</label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-gray-700 mt-1">{(tempo * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}
