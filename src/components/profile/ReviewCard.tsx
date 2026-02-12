
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ReviewCardProps {
    reviewer: {
        id: string;
        name: string;
        avatarUrl?: string | null;
    };
    rating: number;
    date: string;
    subtitle: string;
    comment?: string;
    tags?: string[] | null;
    expandLabel: string;
}

export function ReviewCard({
    reviewer,
    rating,
    date,
    subtitle,
    comment,
    tags,
    expandLabel,
}: ReviewCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasTags = tags && tags.length > 0;

    return (
        <div className="p-4 border rounded-lg bg-background">
            <div className="flex items-start gap-3">
                <Link to={`/perfil/${reviewer.id}`}>
                    <Avatar className="h-10 w-10">
                        {reviewer.avatarUrl ? (
                            <AvatarImage src={reviewer.avatarUrl} alt={reviewer.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {reviewer.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <Link
                            to={`/perfil/${reviewer.id}`}
                            className="font-medium hover:text-primary transition-colors"
                        >
                            {reviewer.name}
                        </Link>
                        <StarRating rating={rating} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                        {subtitle} • {date}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment}
                    </p>

                    {hasTags && (
                        <div className="mt-3">
                            {isExpanded ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="px-2 py-1 font-normal">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto px-0 py-1 text-muted-foreground hover:text-foreground"
                                        onClick={() => setIsExpanded(false)}
                                    >
                                        Ocultar
                                        <ChevronUp className="ml-1 h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto px-0 py-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsExpanded(true)}
                                >
                                    {expandLabel}
                                    <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
