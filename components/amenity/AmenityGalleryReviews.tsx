'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useCommunityTimeZone } from '@/components/providers/community-branding-provider';
import { formatDateInTimeZone } from '@/lib/timezone';

interface AmenityGalleryReviewsProps {
  amenityId: string;
  amenityName: string;
  imageUrl?: string;
  gallery?: string[];
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userName: string;
  userEmail: string;
  createdAtLabel: string;
}

export default function AmenityGalleryReviews({ amenityId, amenityName, imageUrl, gallery = [] }: AmenityGalleryReviewsProps) {
  const { data: session } = useSession();
  const timeZone = useCommunityTimeZone();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const formatReviewDate = (date: Date) => formatDateInTimeZone(date, timeZone, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const images = useMemo(() => {
    const deduped = Array.from(new Set([...(gallery || []), imageUrl || ''].filter(Boolean)));
    return deduped.length ? deduped : ['https://images.pexels.com/photos/296282/pexels-photo-296282.jpeg?auto=compress&cs=tinysrgb&w=1200'];
  }, [gallery, imageUrl]);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'reviews'), where('amenityId', '==', amenityId)));
        const parsed = snap.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data() as any;
            const created = data?.createdAt?.toDate ? data.createdAt.toDate() : null;
            return {
              id: docSnapshot.id,
              rating: Number(data.rating || 0),
              comment: String(data.comment || ''),
              userName: String(data.userName || 'Resident'),
              userEmail: String(data.userEmail || ''),
              createdAtLabel: created ? formatReviewDate(created) : 'Recently',
            } satisfies Review;
          })
          .sort((a, b) => b.createdAtLabel.localeCompare(a.createdAtLabel));

        setReviews(parsed);

        const email = session?.user?.email;
        if (email) {
          setHasReviewed(parsed.some((review) => review.userEmail === email));
        }
      } catch (error) {
        console.warn('Reviews are not accessible with current Firestore rules:', error);
        setReviews([]);
        setHasReviewed(false);
      }
    };

    void loadReviews();
  }, [amenityId, session?.user?.email]);

  useEffect(() => {
    const checkReviewEligibility = async () => {
      const userEmail = session?.user?.email;
      if (!userEmail) {
        setCanReview(false);
        return;
      }

      try {
        const snap = await getDocs(query(collection(db, 'bookings'), where('amenityId', '==', amenityId)));
        const eligible = snap.docs.some((docSnapshot) => {
          const data = docSnapshot.data() as any;
          return data.userEmail === userEmail && data.status === 'completed';
        });

        setCanReview(eligible);
      } catch (error) {
        console.warn('Review eligibility check blocked by Firestore rules:', error);
        setCanReview(false);
      }
    };

    void checkReviewEligibility();
  }, [amenityId, session?.user?.email]);

  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const submitReview = async () => {
    if (!session?.user?.email || !comment.trim()) {
      toast.error('Please add a review comment first.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        amenityId,
        amenityName,
        rating,
        comment: comment.trim(),
        userEmail: session.user.email,
        userName: session.user.name || 'Resident',
        createdAt: serverTimestamp(),
      });

      toast.success('Thanks! Your review has been posted.');
      setComment('');
      setHasReviewed(true);

      const updated = await getDocs(query(collection(db, 'reviews'), where('amenityId', '==', amenityId)));
      const list = updated.docs.map((docSnapshot) => {
        const data = docSnapshot.data() as any;
        const created = data?.createdAt?.toDate ? data.createdAt.toDate() : null;
        return {
          id: docSnapshot.id,
          rating: Number(data.rating || 0),
          comment: String(data.comment || ''),
          userName: String(data.userName || 'Resident'),
          userEmail: String(data.userEmail || ''),
          createdAtLabel: created ? formatReviewDate(created) : 'Recently',
        } satisfies Review;
      });
      setReviews(list);
    } catch (error: any) {
      if (String(error?.code || '').includes('permission-denied')) {
        toast.error('Review permissions are not enabled yet for this project.');
      } else {
        toast.error('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Photo Gallery</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{images.length} photos</span>
        </div>
        <Carousel opts={{ align: 'start', loop: images.length > 1 }}>
          <CarouselContent>
            {images.map((src, index) => (
              <CarouselItem key={`${src}-${index}`}>
                <img src={src} alt={`${amenityName} ${index + 1}`} className="h-56 w-full rounded-lg object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Resident Reviews</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Average rating {averageRating} / 5 from {reviews.length} review(s)</p>
          </div>
        </div>

        {canReview && !hasReviewed && (
          <div className="mb-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <Label className="text-xs text-slate-600 dark:text-slate-300">Rate your experience</Label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)}>
                  <Star className={`h-5 w-5 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <Textarea
              className="mt-3"
              rows={3}
              placeholder="Share what you liked and how this amenity can improve..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <Button onClick={submitReview} disabled={submitting || !comment.trim()} className="mt-3 h-9">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet. Be the first to share your experience.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{review.userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{review.createdAtLabel}</p>
                </div>
                <div className="mb-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star key={value} className={`h-3.5 w-3.5 ${value <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
