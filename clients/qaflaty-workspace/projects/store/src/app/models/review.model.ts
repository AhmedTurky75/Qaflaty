export interface ReviewMedia {
  url: string;
  type: 'Image' | 'Video';
  sortOrder: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  isPinned: boolean;
  helpfulCount: number;
  createdAt: string;
  media: ReviewMedia[];
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  totalVerified: number;
  // keyed by star (1-5)
  distributionCounts: Record<number, number>;
  distributionPercentages: Record<number, number>;
}

export interface ProductReviewList {
  summary: ReviewSummary;
  items: ProductReview[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
}

export interface SubmitReviewRequest {
  rating: number;
  title?: string | null;
  comment?: string | null;
  media?: { url: string; type: 'Image' | 'Video' }[];
}

export interface UpdateReviewRequest {
  rating: number;
  title?: string | null;
  comment?: string | null;
}

export type ReviewSortBy = 'recent' | 'helpful' | 'highest' | 'lowest';
