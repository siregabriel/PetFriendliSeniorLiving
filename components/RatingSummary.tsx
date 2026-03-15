interface RatingSummaryProps {
  average: number;
  count: number;
  size?: 'sm' | 'md';
}

export default function RatingSummary({ average, count, size = 'md' }: RatingSummaryProps) {
  if (count === 0) return null;

  const textClass = size === 'sm' ? 'text-sm' : 'text-base';
  const starClass = size === 'sm' ? 'text-yellow-400 text-sm' : 'text-yellow-400 text-lg';

  return (
    <span className={`inline-flex items-center gap-1 ${textClass} text-gray-700`}>
      <span className={starClass}>★</span>
      <span>{average.toFixed(1)}</span>
      <span className="text-gray-400">·</span>
      <span>{count} {count === 1 ? 'review' : 'reviews'}</span>
    </span>
  );
}
