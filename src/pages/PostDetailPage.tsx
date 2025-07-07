import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PostCard from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  title: string;
  description: string;
  name: string;
  email: string | null;
  severity: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  upvote_count?: number;
  comment_count?: number;
  user_upvoted?: boolean;
}

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const getUserSession = () => {
    let session = localStorage.getItem('user_session');
    if (!session) {
      session = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session', session);
    }
    return session;
  };

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (postError) {
        if (postError.code === 'PGRST116') {
          toast({
            title: "Post not found",
            description: "The post you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        throw postError;
      }

      if (!postData) {
        toast({
          title: "Post not found",
          description: "The post you're looking for doesn't exist.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Get upvote count
      const { data: upvoteCounts } = await supabase
        .from('post_upvotes')
        .select('post_id')
        .eq('post_id', id);

      // Get comment count
      const { data: commentCounts } = await supabase
        .from('post_comments')
        .select('post_id')
        .eq('post_id', id);

      // Get user's upvote status
      const userSession = getUserSession();
      const { data: userUpvotes } = await supabase
        .from('post_upvotes')
        .select('post_id')
        .eq('user_session', userSession)
        .eq('post_id', id);

      // Process post with counts and user upvote status
      const processedPost: Post = {
        ...postData,
        upvote_count: upvoteCounts?.length || 0,
        comment_count: commentCounts?.length || 0,
        user_upvoted: (userUpvotes?.length || 0) > 0
      };

      setPost(processedPost);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertTriangle className="w-4 h-4" />;
      case 'low': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading post details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-3" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Post Details</h1>
            <p className="text-muted-foreground">View complete information about this road issue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <PostCard post={post} showFullContent={true} />
          </div>

          {/* Sidebar with Additional Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Post Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Issue Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Severity Level</span>
                  <Badge variant={getSeverityColor(post.severity) as "default" | "secondary" | "destructive"} className="flex items-center">
                    {getSeverityIcon(post.severity)}
                    <span className="ml-1">{post.severity.toUpperCase()}</span>
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Reported by</p>
                      <p className="text-sm text-muted-foreground">{post.name}</p>
                      {post.email && (
                        <p className="text-xs text-muted-foreground">{post.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{post.city}, {post.state}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Reported on</p>
                      <p className="text-sm text-muted-foreground">{formatDate(post.created_at)}</p>
                      {post.updated_at !== post.created_at && (
                        <p className="text-xs text-muted-foreground">
                          Updated: {formatDate(post.updated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Section */}
            {post.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Video Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video">
                    <iframe
                      src={post.video_url}
                      className="w-full h-full rounded-lg"
                      allowFullScreen
                      title="Road issue video"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map Section (Placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle>Location Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Map integration coming soon</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Coordinates: {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;