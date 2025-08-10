type Props = {
  onSelect: (file: File | null, urlFromInput?: string) => void;
};

export default function FileLoader({ onSelect }: Props) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onSelect(f || null);
  };

  const handleUrl = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const url = String(form.get('url') || '').trim();
    if (url) onSelect(null, url);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div>
        <label className="block text-sm mb-1">Upload audio</label>
        <input type="file" accept="audio/*" onChange={handleFile} />
      </div>

      <form onSubmit={handleUrl} className="flex items-end gap-2">
        <div>
          <label className="block text-sm mb-1">or paste URL</label>
          <input
            name="url"
            type="url"
            placeholder="https://example.com/song.mp3"
            className="border rounded-lg px-3 py-2 w-72"
          />
        </div>
        <button className="px-3 py-2 rounded-xl bg-brand-1 text-white shadow" type="submit">
          Load
        </button>
      </form>
    </div>
  );
}
