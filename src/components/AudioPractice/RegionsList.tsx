export type RegionItem = {
  id: string;
  start: number; // seconds
  end: number;   // seconds
  label?: string;
};

type Props = {
  regions: RegionItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function RegionsList({ regions, activeId, onSelect, onDelete }: Props) {
  if (!regions.length) {
    return <div className="text-sm text-gray-600">No regions yet. (Click‑drag on waveform to add one later.)</div>;
  }

  return (
    <div className="space-y-2">
      {regions.map(r => (
        <div
          key={r.id}
          className={`flex items-center justify-between rounded-lg border p-2 text-gray-900 ${r.id === activeId ? 'bg-brand-3' : 'bg-white'}`}
        >
          <button
            className="text-left"
            onClick={() => onSelect(r.id)}
            title="Select region"
          >
            <div className="font-medium text-gray-800">{r.label ?? 'Region'}</div>
            <div className="text-sm text-gray-600">{fmt(r.start)} – {fmt(r.end)}</div>
          </button>

          <button
            className="px-2 py-1 rounded-lg bg-gray-100 text-gray-900"
            onClick={() => onDelete(r.id)}
            aria-label="Delete region"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
