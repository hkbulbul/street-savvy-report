import { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, Flag, MapPin, Eye, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  showFullContent?: boolean;
  layout?: 'list' | 'grid';
  showCommentsOnly?: boolean;
}

const PostCard = ({ post, onUpvoteChange, showFullContent = false, layout = 'list', showCommentsOnly = false }: PostCardProps) => {
  const [upvoteCount, setUpvoteCount] = useState(post.upvote_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(post.user_upvoted || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  // Auto-show comments on detail page
  useEffect(() => {
    if (showFullContent) {
      setShowComments(true);
    }
  }, [showFullContent]);

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

  const handleViewPost = () => {
    navigate(`/post/${post.id}`);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'amber';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case 'medium': return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      case 'low': return <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      default: return null;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // If we're only showing comments, render just the comments section
  if (showCommentsOnly) {
    return (
      <div className="space-y-6">
        {/* Existing Comments */}
        {loadingComments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-3">Loading comments...</p>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {comment.author_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{comment.author_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                <MessageSquare className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        )}

        {/* Add Comment Form */}
        <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
          <h4 className="font-medium text-sm">Add a comment</h4>
          <input
            type="text"
            placeholder="Your name"
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-3 py-2 bg-background border rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={3}
          />
          <Button 
            onClick={handleComment} 
            disabled={!newComment.trim() || !commentAuthor.trim()}
            className="w-full"
          >
            Add Comment
          </Button>
        </div>
      </div>
    );
  }

  if (layout === 'grid' && !showFullContent) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border">
        <div className="relative">
          {post.photo_url ? (
            <div className="aspect-video w-full">
              <img 
                src={post.photo_url} 
                alt="Road issue" 
                className="w-full h-full object-cover"
                onClick={handleViewPost}
                style={{ cursor: 'pointer' }}
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted/50 flex items-center justify-center" onClick={handleViewPost} style={{ cursor: 'pointer' }}>
              <div className="text-muted-foreground">No image</div>
            </div>
          )}
          <Badge 
            className={`absolute top-2 right-2 flex items-center ${
              post.severity === 'high' 
                ? 'bg-destructive hover:bg-destructive/80' 
                : post.severity === 'medium' 
                  ? 'bg-amber-500 hover:bg-amber-500/80'
                  : 'bg-green-500 hover:bg-green-500/80'
            }`}
          >
            {getSeverityIcon(post.severity)}
            {post.severity.toUpperCase()}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {post.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{post.name}</span>
            <span className="text-xs text-muted-foreground">• {timeAgo(post.created_at)}</span>
          </div>
          
          <h3 className="font-semibold mb-2 hover:text-primary cursor-pointer" onClick={handleViewPost}>
            {truncateText(post.title, 65)}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-3">
            {truncateText(post.description || '', 100)}
          </p>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {post.city}, {post.state}
          </div>
        </CardContent>
        
        <CardFooter className="px-4 py-3 border-t bg-muted/20 flex justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleUpvote}
              className={`flex items-center text-xs font-medium ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
              {upvoteCount}
            </button>
            
            <button
              onClick={handleViewPost}
              className="flex items-center text-xs font-medium text-muted-foreground"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              {commentCount}
            </button>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleReport}
          >
            <Flag className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={`${showFullContent ? 'border-0 shadow-lg' : 'mb-6 hover:shadow-md transition-shadow duration-200'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{post.name}</div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>
          <Badge 
            className={`flex items-center ${
              post.severity === 'high' 
                ? 'bg-destructive hover:bg-destructive/80' 
                : post.severity === 'medium' 
                  ? 'bg-amber-500 hover:bg-amber-500/80'
                  : 'bg-green-500 hover:bg-green-500/80'
            }`}
          >
            {getSeverityIcon(post.severity)}
            {post.severity.toUpperCase()}
          </Badge>
        </div>

        <h3 className={`${showFullContent ? 'text-xl' : 'text-lg'} font-semibold mb-2 ${!showFullContent && 'hover:text-primary cursor-pointer'}`} 
          onClick={!showFullContent ? handleViewPost : undefined}>
          {post.title}
        </h3>
        
        {/* Show truncated or full description based on showFullContent */}
        <p className="text-muted-foreground mb-4">
          {showFullContent ? post.description : truncateText(post.description || '', 180)}
          {!showFullContent && post.description && post.description.length > 180 && (
            <button 
              onClick={handleViewPost}
              className="text-primary hover:text-primary/80 ml-1 font-medium"
            >
              Read more
            </button>
          )}
        </p>

        {post.photo_url && (
          <div className="mb-4">
            <img 
              src={post.photo_url} 
              alt="Road issue" 
              className={`w-full object-cover rounded-lg ${showFullContent ? 'max-h-96' : 'max-h-80'}`}
              onClick={!showFullContent ? handleViewPost : undefined}
              style={!showFullContent ? { cursor: 'pointer' } : {}}
            />
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4 mr-1.5" />
          {post.city}, {post.state}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpvote}
              className={hasUpvoted ? 'text-primary font-medium' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-1.5" />
              {upvoteCount > 0 ? `${upvoteCount} ${upvoteCount === 1 ? 'upvote' : 'upvotes'}` : 'Upvote'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleComments}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              {commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}` : 'Comment'}
            </Button>

            {/* Show View Post button only on card view, not on detail page */}
            {!showFullContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPost}
                className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                View Details
              </Button>
            )}
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleReport}>
            <Flag className="w-4 h-4 mr-1.5" />
            Report
          </Button>
        </div>

        {showComments && (
          <div className="mt-6">
            <Separator className="mb-4" />
            
            <h4 className="font-medium mb-3">Comments</h4>
            
            {/* Existing Comments */}
            {loadingComments ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading comments...</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {comment.author_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{comment.author_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
                    <MessageSquare className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            )}

            {/* Add Comment Form */}
            <div className="space-y-3 bg-muted/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm">Add a comment</h4>
              <input
                type="text"
                placeholder="Your name"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
              <Button 
                onClick={handleComment} 
                disabled={!newComment.trim() || !commentAuthor.trim()}
                className="w-full"
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