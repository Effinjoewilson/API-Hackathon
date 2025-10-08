interface TypeBadgeProps {
  type: string;
  size?: 'xs' | 'sm';
  className?: string;
}

export default function TypeBadge({ type, size = 'sm', className = '' }: TypeBadgeProps) {
  const getTypeColor = (t: string) => {
    t = t.toLowerCase();
    if (t.includes('string') || t.includes('char') || t.includes('text')) return 'bg-blue-100 text-blue-700';
    if (t.includes('int') || t.includes('number') || t.includes('numeric')) return 'bg-green-100 text-green-700';
    if (t.includes('float') || t.includes('decimal') || t.includes('double')) return 'bg-emerald-100 text-emerald-700';
    if (t.includes('bool')) return 'bg-purple-100 text-purple-700';
    if (t.includes('date') || t.includes('time')) return 'bg-orange-100 text-orange-700';
    if (t.includes('json') || t.includes('object')) return 'bg-indigo-100 text-indigo-700';
    if (t.includes('array') || t.includes('list')) return 'bg-pink-100 text-pink-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getDisplayType = (t: string) => {
    if (t === 'object') return 'json';
    if (t.includes('character varying')) return 'varchar';
    return t.toLowerCase();
  };

  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5'
  };

  return (
    <span className={`inline-flex items-center rounded font-medium ${sizeClasses[size]} ${getTypeColor(type)} ${className}`}>
      {getDisplayType(type)}
    </span>
  );
}