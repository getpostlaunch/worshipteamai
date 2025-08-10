type Props = {
  loopActive: boolean;
  canClear: boolean;
  onToggleLoop: () => void;
  onClearLoop: () => void;
};

export default function LoopControls({ loopActive, canClear, onToggleLoop, onClearLoop }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        className={`px-3 py-1.5 rounded-xl ${loopActive ? 'bg-brand-2 text-white' : 'bg-gray-200 text-gray-900'}`}
        onClick={onToggleLoop}
      >
        {loopActive ? 'Loop: ON' : 'Loop: OFF'}
      </button>
      <button
        className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-900 disabled:opacity-50"
        onClick={onClearLoop}
        disabled={!canClear}
        title={!canClear ? 'No active region' : 'Clear loop region'}
      >
        Clear Loop
      </button>
    </div>
  );
}
