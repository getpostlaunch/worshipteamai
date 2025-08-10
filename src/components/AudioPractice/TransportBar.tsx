type Props = {
  isPlaying: boolean;
  currentTime: number; // seconds
  duration: number;    // seconds
  onPlayToggle: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
};

const format = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function TransportBar({
  isPlaying, currentTime, duration, onPlayToggle, onStop, onSeek,
}: Props) {
  const handleRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onSeek(val);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        className="px-3 py-1.5 rounded-xl bg-brand-1 text-white shadow"
        onClick={onPlayToggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-900"
        onClick={onStop}
      >
        Stop
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm tabular-nums">{format(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={Math.min(currentTime, duration || 0)}
          onChange={handleRange}
          className="w-full"
        />
        <span className="text-sm tabular-nums">{format(duration)}</span>
      </div>
    </div>
  );
}
