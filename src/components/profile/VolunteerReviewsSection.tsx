import { Link } from 'react-router-dom';
import { ReviewData, ReviewStats } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { StarRating } from '@/components/ui/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare } from 'lucide-react';

interface VolunteerReviewsSectionProps {
  reviews: ReviewData[];
  stats: ReviewStats;
  isLoading: boolean;
}

export function VolunteerReviewsSection({ reviews, stats, isLoading }: VolunteerReviewsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-8">
            <Skeleton className="h-24 w-24" />
            <div className="flex-1 space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" />
          Avaliações e Impacto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary Box */}
        {stats.totalReviews > 0 ? (
          <>
            <div className="flex flex-col md:flex-row gap-6 p-4 bg-muted/50 rounded-lg">
              {/* Average Rating */}
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-5xl font-bold text-warning">
                  {stats.avgRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(stats.avgRating)} size="md" />
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews} {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              {/* Distribution Bars */}
              <div className="flex-1 space-y-2">
                {stats.distribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8 flex items-center gap-1">
                      {stars} <Star className="h-3 w-3 fill-warning text-warning" />
                    </span>
                    <Progress 
                      value={percentage} 
                      className="flex-1 h-2.5"
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários das ONGs
              </h4>
              
              {reviews.filter(r => r.comment).length > 0 ? (
                reviews
                  .filter(r => r.comment)
                  .map(review => (
                    <div
                      key={review.id}
                      className="p-4 border rounded-lg bg-background"
                    >
                      <div className="flex items-start gap-3">
                        <Link to={`/perfil/${review.reviewer.id}`}>
                          <Avatar className="h-10 w-10">
                            {review.reviewer.avatar_url ? (
                              <AvatarImage src={review.reviewer.avatar_url} alt={review.reviewer.nome} />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {review.reviewer.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Link 
                              to={`/perfil/${review.reviewer.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {review.reviewer.nome}
                            </Link>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {new Date(review.created_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm leading-relaxed">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum comentário escrito ainda.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Este voluntário ainda não possui avaliações.</p>
            <p className="text-sm mt-1">
              As avaliações aparecem após a conclusão de projetos voluntários.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
