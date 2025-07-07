import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import PostsSidebar from "@/components/PostsSidebar";
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Filter, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  title: string;
  description: string;
  name: string;
  severity: string;
  city: string;
  state: string;
  photo_url: string | null;
  created_at: string;
  upvote_count?: number;
  comment_count?: number;
  user_upvoted?: boolean;
}

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ severity?: string; location?: string }>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const navigate = useNavigate();

  const getUserSession = () => {
    let session = localStorage.getItem('user_session');
    if (!session) {
      session = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session', session);
    }
    return session;
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*');

      // Apply filters
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data: postsData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!postsData) {
        setPosts([]);
        return;
      }

      // Get upvote counts for all posts
      const { data: upvoteCounts } = await supabase
        .from('post_upvotes')
        .select('post_id')
        .in('post_id', postsData.map(p => p.id));

      // Get comment counts for all posts
      const { data: commentCounts } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postsData.map(p => p.id));

      // Get user's upvotes
      const userSession = getUserSession();
      const { data: userUpvotes } = await supabase
        .from('post_upvotes')
        .select('post_id')
        .eq('user_session', userSession)
        .in('post_id', postsData.map(p => p.id));

      // Create count maps
      const upvoteCountMap = new Map<string, number>();
      const commentCountMap = new Map<string, number>();
      const upvotedPostIds = new Set(userUpvotes?.map(u => u.post_id) || []);

      // Count upvotes per post
      upvoteCounts?.forEach(upvote => {
        const count = upvoteCountMap.get(upvote.post_id) || 0;
        upvoteCountMap.set(upvote.post_id, count + 1);
      });

      // Count comments per post
      commentCounts?.forEach(comment => {
        const count = commentCountMap.get(comment.post_id) || 0;
        commentCountMap.set(comment.post_id, count + 1);
      });

      // Process posts with counts and user upvote status
      const processedPosts: Post[] = postsData.map(post => ({
        ...post,
        upvote_count: upvoteCountMap.get(post.id) || 0,
        comment_count: commentCountMap.get(post.id) || 0,
        user_upvoted: upvotedPostIds.has(post.id)
      }));

      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filters.severity, filters.location, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleFilterChange = useCallback((newFilters: { severity?: string; location?: string }) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const HeroSection = () => (
    <div className="bg-primary text-primary-foreground py-12 px-4 mb-8 rounded-xl shadow-lg">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Report Bad Roads</h1>
            <p className="text-lg opacity-90 mb-6">
              Help your community by reporting dangerous road conditions.
              Together we can make our streets safer for everyone.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={() => navigate('/create-post')}
              >
                <Plus className="mr-2 h-5 w-5" />
                Report an Issue
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white/10"
                onClick={() => window.scrollTo({
                  top: document.getElementById('posts-section')?.offsetTop ?? 0,
                  behavior: 'smooth',
                })}
              >
                View Reports
              </Button>
            </div>
          </div>
          <div className="hidden md:block w-64 h-64 relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute inset-4 bg-white/30 rounded-full"></div>
            <div className="absolute inset-10 bg-white/40 rounded-full flex items-center justify-center">
              <MapPin className="w-20 h-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg text-muted-foreground">Loading reports...</p>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No reports found</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {searchQuery || Object.keys(filters).length > 0
          ? "Try adjusting your search or filters"
          : "Be the first to report a road issue in your community!"
        }
      </p>
      <Button 
        onClick={() => navigate('/create-post')}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Plus className="mr-2 h-4 w-4" />
        Report First Issue
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-6">
        <HeroSection />
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 pb-16" id="posts-section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Community Reports
              {searchQuery && <span className="ml-2 text-lg font-normal text-muted-foreground">for "{searchQuery}"</span>}
            </h2>
            <p className="text-muted-foreground">
              {posts.length} {posts.length === 1 ? 'report' : 'reports'} found
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPosts()}
              className="hidden md:flex"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={viewMode === 'list' ? 'bg-muted' : ''}
              onClick={() => setViewMode('list')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </Button>
            <Button
              variant="outline" 
              size="sm"
              className={viewMode === 'grid' ? 'bg-muted' : ''}
              onClick={() => setViewMode('grid')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </Button>
          </div>
        </div>
        
        <Separator className="mb-6" />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <PostsSidebar onFilterChange={handleFilterChange} />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <LoadingState />
            ) : posts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6' 
                : 'space-y-6'
              }>
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    layout={viewMode}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;