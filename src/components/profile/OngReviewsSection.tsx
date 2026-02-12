import { Link } from 'react-router-dom';
import type { OngReview, OngReviewStats } from '@/hooks/useOngReviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StarRating } from '@/components/ui/star-rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare } from 'lucide-react';
import { ReviewCard } from './ReviewCard';

interface OngReviewsSectionProps {
  reviews: OngReview[];
  stats: OngReviewStats;
  isLoading: boolean;
}

export function OngReviewsSection({ reviews, stats, isLoading }: OngReviewsSectionProps) {
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
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
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
          Avaliações da ONG
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats.totalReviews > 0 ? (
          <>
            <div className="flex flex-col md:flex-row gap-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-5xl font-bold text-warning">
                  {stats.avgRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(stats.avgRating)} size="md" />
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.totalReviews}{' '}
                  {stats.totalReviews === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              <div className="flex-1 space-y-2">
                {stats.distribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8 flex items-center gap-1">
                      {stars} <Star className="h-3 w-3 fill-warning text-warning" />
                    </span>
                    <Progress
                      value={percentage}
                      className="flex-1 h-2.5"
                      indicatorClassName="bg-warning"
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários dos Voluntários
              </h4>

              {reviews.filter((r) => r.feedback_voluntario?.trim()).length > 0 ? (
                reviews
                  .filter((r) => r.feedback_voluntario?.trim())
                  .map((review) => (
                    <ReviewCard
                      key={review.id}
                      reviewer={{
                        id: review.voluntario_id,
                        name: review.voluntario?.nome ?? 'Voluntário',
                        avatarUrl: review.voluntario?.avatar_url,
                      }}
                      rating={review.rating_voluntario}
                      date={new Date(review.updated_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      subtitle={`Participou de: ${review.opportunity?.titulo ?? 'Oportunidade'}`}
                      comment={review.feedback_voluntario}
                      tags={review.tags_voluntario}
                      expandLabel="Ver pontos fortes"
                    />
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
            <p>Esta ONG ainda não possui avaliações.</p>
            <p className="text-sm mt-1">
              As avaliações aparecem quando voluntários concluem experiências e avaliam a organização.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
