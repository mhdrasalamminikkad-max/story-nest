import { Badge } from "@/components/ui/badge";

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryChips({ categories, selectedCategory, onSelectCategory }: CategoryChipsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-4">
      <div className="flex gap-2 px-4 pb-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer flex-shrink-0 px-4 py-2 text-sm rounded-full toggle-elevate"
            onClick={() => onSelectCategory(category)}
            data-testid={`category-${category.toLowerCase()}`}
          >
            {category}
          </Badge>
        ))}
      </div>
    </div>
  );
}
