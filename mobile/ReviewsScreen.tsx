// Reviews feature temporarily disabled - file not currently in use
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  review_photos: string[] | null;
  customer_name: string;
  customer_photo: string | null;
  service_name: string | null;
  scheduled_date: string | null;
  created_at: string;
}

interface ReviewStats {
  totalReviews: number;
  avgRating: string;
  ratingCounts: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsScreenProps {
  navigation: any;
  businessId?: string; // Pass business ID as prop or get from auth context
}

const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ navigation, businessId }) => {
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(businessId || null);

  useEffect(() => {
    // Get current business ID if not provided
    if (!currentBusinessId) {
      getCurrentBusinessId();
    }
  }, []);

  useEffect(() => {
    if (currentBusinessId) {
      loadReviews();
    }
  }, [filter, currentBusinessId]);

  const getCurrentBusinessId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Get business ID for current user
      const { data: business, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching business:', error);
        return;
      }

      if (business) {
        setCurrentBusinessId(business.id);
      }
    } catch (error) {
      console.error('Error getting business ID:', error);
    }
  };

  const loadReviews = async () => {
    if (!currentBusinessId) {
      console.error('No business ID available');
      return;
    }

    setLoading(true);

    try {
      // Fetch reviews from Supabase
      let query = supabase
        .from('marketplace_reviews')
        .select('*')
        .eq('business_id', currentBusinessId)
        .eq('status', 'published') // Only show published reviews
        .order('created_at', { ascending: false });

      // Apply rating filter if not 'all'
      if (filter !== 'all') {
        query = query.eq('rating', parseInt(filter));
      }

      const { data: reviewsData, error } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }

      // Filter by rating if needed (client-side fallback)
      const filtered = filter === 'all'
        ? reviewsData || []
        : (reviewsData || []).filter(r => r.rating === parseInt(filter));

      setReviews(filtered as Review[]);

      // Calculate stats from all reviews (not filtered)
      const allReviews = reviewsData || [];
      const totalReviews = allReviews.length;

      if (totalReviews > 0) {
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
        const ratingCounts = {
          5: allReviews.filter(r => r.rating === 5).length,
          4: allReviews.filter(r => r.rating === 4).length,
          3: allReviews.filter(r => r.rating === 3).length,
          2: allReviews.filter(r => r.rating === 2).length,
          1: allReviews.filter(r => r.rating === 1).length,
        };

        setStats({
          totalReviews,
          avgRating: avgRating.toFixed(1),
          ratingCounts,
        });
      } else {
        setStats({
          totalReviews: 0,
          avgRating: '0.0',
          ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        });
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Set empty state on error
      setReviews([]);
      setStats({
        totalReviews: 0,
        avgRating: '0.0',
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getRatingPercentage = (rating: keyof ReviewStats['ratingCounts']): number => {
    if (!stats || stats.totalReviews === 0) return 0;
    return Math.round((stats.ratingCounts[rating] / stats.totalReviews) * 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reviews</Text>
        </View>

        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statsLeft}>
              <Text style={styles.avgRating}>{stats.avgRating}</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(parseFloat(stats.avgRating)) ? 'star' : 'star-outline'}
                    size={20}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text style={styles.totalReviews}>{stats.totalReviews} reviews</Text>
            </View>

            <View style={styles.statsRight}>
              {([5, 4, 3, 2, 1] as const).map((rating) => (
                <View key={rating} style={styles.ratingRow}>
                  <Text style={styles.ratingNumber}>{rating}</Text>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <View style={styles.ratingBar}>
                    <View
                      style={[
                        styles.ratingBarFill,
                        { width: `${getRatingPercentage(rating)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.ratingCount}>{stats.ratingCounts[rating]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {(['5', '4', '3', '2', '1'] as const).map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[styles.filterTab, filter === rating && styles.filterTabActive]}
              onPress={() => setFilter(rating)}
            >
              <Ionicons
                name="star"
                size={14}
                color={filter === rating ? '#fff' : '#FFD700'}
              />
              <Text style={[styles.filterText, filter === rating && styles.filterTextActive]}>
                {rating}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>
                {filter === 'all'
                  ? 'Your reviews will appear here'
                  : `No ${filter}-star reviews`}
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} formatDate={formatDate} />
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Review Card Component
interface ReviewCardProps {
  review: Review;
  formatDate: (dateString: string) => string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, formatDate }) => {
  return (
    <View style={styles.reviewCard}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewCustomer}>
          <View style={styles.customerAvatar}>
            {review.customer_photo ? (
              <Image source={{ uri: review.customer_photo }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#999" />
            )}
          </View>
          <View>
            <Text style={styles.customerName}>{review.customer_name}</Text>
            <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= review.rating ? 'star' : 'star-outline'}
              size={16}
              color="#FFD700"
            />
          ))}
        </View>
      </View>

      {/* Service Info */}
      {review.service_name && (
        <View style={styles.serviceTag}>
          <Ionicons name="sparkles" size={12} color="#666" />
          <Text style={styles.serviceText}>{review.service_name}</Text>
        </View>
      )}

      {/* Review Text */}
      {review.review_text && (
        <Text style={styles.reviewText}>{review.review_text}</Text>
      )}

      {/* Review Photos */}
      {review.review_photos && review.review_photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosContainer}
        >
          {review.review_photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.reviewPhoto} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  avgRating: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 13,
    color: '#666',
  },
  statsRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    width: 12,
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  ratingBarFill: {
    height: 6,
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  ratingCount: {
    fontSize: 12,
    color: '#999',
    width: 30,
    textAlign: 'right',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: '#000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  reviewsList: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  photosContainer: {
    marginTop: 4,
  },
  reviewPhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ReviewsScreen;
