import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

interface TagCount {
    tag: string;
    count: number;
}

interface ReviewHighlightsProps {
    tags: string[][];
    title?: string;
    maxDisplay?: number;
}

export function ReviewHighlights({
    tags,
    title = "Principais Elogios",
    maxDisplay = 10
}: ReviewHighlightsProps) {
    // Aggregate tag counts
    const tagCounts: Record<string, number> = {};

    tags.forEach((tagArray) => {
        if (tagArray && Array.isArray(tagArray)) {
            tagArray.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    // Convert to array and sort by count (descending)
    const sortedTags: TagCount[] = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, maxDisplay);

    // Don't render if no tags
    if (sortedTags.length === 0) {
        return null;
    }

    return (
        <div className="mb-6 p-4 bg-muted/40 rounded-xl border border-border/60">
            <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {sortedTags.map(({ tag, count }) => (
                    <Badge
                        key={tag}
                        variant="secondary"
                        className="pl-3 pr-1.5 py-1 text-sm bg-white hover:bg-white/90 text-foreground border border-border/40 shadow-sm flex items-center gap-2 rounded-full transition-all"
                    >
                        <span className="font-medium text-foreground/90">{tag}</span>
                        <span className="flex items-center justify-center bg-muted text-muted-foreground h-5 min-w-[20px] rounded-full text-[10px] font-bold px-1.5">
                            {count}
                        </span>
                    </Badge>
                ))}
            </div>
        </div>
    );
}