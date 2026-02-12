
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { ChevronDown, ChevronUp, Briefcase } from 'lucide-react';

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
    const hasComment = comment && comment.trim().length > 0;

    return (
        <div className="group bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
            {/* Header: Avatar, Info, Rating */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Link to={`/perfil/${reviewer.id}`} className="shrink-0">
                        <Avatar className="h-12 w-12 border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                            {reviewer.avatarUrl ? (
                                <AvatarImage src={reviewer.avatarUrl} alt={reviewer.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {reviewer.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link
                            to={`/perfil/${reviewer.id}`}
                            className="font-semibold text-foreground hover:text-primary transition-colors block leading-tight"
                        >
                            {reviewer.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">
                            {date}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-lg border border-border/30">
                    <span className="font-bold text-foreground text-sm">{rating.toFixed(1)}</span>
                    <StarRating rating={rating} size="sm" />
                </div>
            </div>

            {/* Comment Body */}
            {hasComment && (
                <div className="pl-4 border-l-2 border-primary/20 mb-4">
                    <p className="text-sm leading-relaxed text-foreground/90 italic whitespace-pre-wrap">
                        {comment}
                    </p>
                </div>
            )}

            {!hasComment && (
                <p className="text-sm text-muted-foreground italic mb-4 pl-4 border-l-2 border-border/50">
                    Sem comentário escrito.
                </p>
            )}

            {/* Tags Section */}
            {hasTags && (
                <div className="mb-4">
                    {isExpanded ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex flex-wrap gap-2 pt-2">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="pl-2 pr-2 py-0.5 text-xs font-medium border border-border/50 bg-secondary/50 hover:bg-secondary transition-colors"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => setIsExpanded(false)}
                            >
                                <span className="flex items-center gap-1">
                                    Ocultar <ChevronUp className="h-3 w-3" />
                                </span>
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setIsExpanded(true)}
                        >
                            <span className="flex items-center gap-1">
                                {expandLabel} <ChevronDown className="h-3 w-3" />
                            </span>
                        </Button>
                    )}
                </div>
            )}

            {/* Footer: Opportunity Context */}
            <div className="flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto">
                <Briefcase className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium truncate">
                    {subtitle}
                </span>
            </div>
        </div>
    );
}
