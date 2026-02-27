export default function IterationBadge({ iteration }) {
  if (!iteration || iteration < 1) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
      v{iteration}
    </span>
  );
}
