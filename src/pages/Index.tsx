import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import PostsSidebar from "@/components/PostsSidebar";
import { supabase } from '@/integrations/supabase/client';

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
        .select(`
          *,
          post_upvotes(count),
          post_comments(count)
        `);

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

      // Get user's upvotes
      const userSession = getUserSession();
      const { data: userUpvotes } = await supabase
        .from('post_upvotes')
        .select('post_id')
        .eq('user_session', userSession);

      const upvotedPostIds = new Set(userUpvotes?.map(u => u.post_id) || []);

      // Process posts with counts and user upvote status
      const processedPosts: Post[] = postsData?.map(post => ({
        ...post,
        upvote_count: post.post_upvotes?.[0]?.count || 0,
        comment_count: post.post_comments?.[0]?.count || 0,
        user_upvoted: upvotedPostIds.has(post.id)
      })) || [];

      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleFilterChange = useCallback((newFilters: { severity?: string; location?: string }) => {
    setFilters(newFilters);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearch={handleSearch} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading posts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <PostsSidebar onFilterChange={handleFilterChange} />
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || Object.keys(filters).length > 0
                    ? "Try adjusting your search or filters"
                    : "Be the first to report a road issue!"
                  }
                </p>
                <a 
                  href="/create-post"
                  className="inline-flex items-center justify-center h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                >
                  Report First Issue
                </a>
              </div>
            ) : (
              <div>
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    onUpvoteChange={fetchPosts}
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
