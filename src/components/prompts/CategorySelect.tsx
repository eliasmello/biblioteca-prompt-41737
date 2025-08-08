import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { usePrompts } from '@/hooks/usePrompts';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function CategorySelect({ value, onChange, placeholder, id = 'category' }: CategorySelectProps) {
  const { prompts } = usePrompts();

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of prompts) {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [prompts]);

  return (
    <div>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={`${id}-options`}
      />
      <datalist id={`${id}-options`}>
        {categories.map((cat) => (
          <option key={cat} value={cat} />
        ))}
      </datalist>
    </div>
  );
}
