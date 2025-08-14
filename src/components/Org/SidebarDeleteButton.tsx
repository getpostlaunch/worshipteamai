'use client';

type Props = {
  orgId: string;
  isOwner: boolean;
  className?: string;
};

export default function SidebarDeleteButton({ orgId, isOwner, className = '' }: Props) {
  const onClick = async () => {
    if (!isOwner) return;
    if (!confirm('Really delete this org? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/orgs/${orgId}/delete`, { method: 'POST' });
      if (res.ok) {
        window.location.href = '/app/orgs';
      } else {
        const j = await res.json().catch(() => ({}));
        alert(j.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    }
  };

  const base = 'w-full text-left rounded-lg px-3 py-2 text-sm transition border';
  const danger =
    'border-red-600/60 text-red-400 hover:border-red-500 hover:text-red-300';
  const off = 'border-slate-800 text-slate-500 cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={isOwner ? onClick : undefined}
      disabled={!isOwner}
      title={isOwner ? 'Delete this org' : 'Owners only'}
      className={`${base} ${isOwner ? danger : off} ${className}`}
    >
      Delete org
    </button>
  );
}
