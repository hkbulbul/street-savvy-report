import { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Flag, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface PostCardProps {
  post: Post;
  onUpvoteChange?: () => void;
}

const PostCard = ({ post, onUpvoteChange }: PostCardProps) => {
  const [upvoteCount, setUpvoteCount] = useState(post.upvote_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(post.user_upvoted || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const { toast } = useToast();

  const getUserSession = () => {
    let session = localStorage.getItem('user_session');
    if (!session) {
      session = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_session', session);
    }
    return session;
  };

  // Fetch comments when showComments becomes true
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleUpvote = async () => {
    const userSession = getUserSession();
    
    try {
      if (hasUpvoted) {
        // Remove upvote
        await supabase
          .from('post_upvotes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_session', userSession);
        
        setUpvoteCount(prev => prev - 1);
        setHasUpvoted(false);
      } else {
        // Add upvote
        await supabase
          .from('post_upvotes')
          .insert({ post_id: post.id, user_session: userSession });
        
        setUpvoteCount(prev => prev + 1);
        setHasUpvoted(true);
      }
      
      onUpvoteChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update upvote",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !commentAuthor.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both your name and comment",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          author_name: commentAuthor,
          content: newComment
        })
        .select()
        .single();
      
      if (error) throw error;

      // Add the new comment to the local state
      if (data) {
        setComments(prev => [...prev, data]);
        setCommentCount(prev => prev + 1);
        setNewComment('');
        setCommentAuthor('');
        
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const handleReport = async () => {
    const userSession = getUserSession();
    const reason = prompt("Please specify the reason for reporting this post:");
    
    if (!reason) return;
    
    try {
      await supabase
        .from('post_reports')
        .insert({
          post_id: post.id,
          reason,
          user_session: userSession
        });
      
      toast({
        title: "Success",
        description: "Post reported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report post",
        variant: "destructive",
      });
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-semibold">
                {post.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium">{post.name}</div>
              <div className="text-sm text-muted-foreground">
                {timeAgo(post.created_at)} • {post.city}
              </div>
            </div>
          </div>
          <Badge variant={getSeverityColor(post.severity) as "default" | "secondary" | "destructive"}>
            {post.severity.toUpperCase()}
          </Badge>
        </div>

        <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
        <p className="text-muted-foreground mb-4">{post.description}</p>

        {post.photo_url && (
          <div className="mb-4">
            <img 
              src={post.photo_url} 
              alt="Road issue" 
              className="w-full max-w-lg h-64 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          {post.city}, {post.state}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className={hasUpvoted ? 'text-primary' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {upvoteCount}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleComments}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {commentCount}
            </Button>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleReport}>
            <Flag className="w-4 h-4" />
          </Button>
        </div>

        {showComments && (
          <div className="mt-4 pt-4 border-t">
            {/* Existing Comments */}
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading comments...</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            )}

            {/* Add Comment Form */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 border rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
              <Button 
                onClick={handleComment} 
                size="sm"
                disabled={!newComment.trim() || !commentAuthor.trim()}
              >
                Add Comment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;