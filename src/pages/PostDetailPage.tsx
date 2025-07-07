import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, User, AlertTriangle, ChevronLeft, Share2, Flag, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import PostCard from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [mapLoaded, setMapLoaded] = useState(false);

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

  useEffect(() => {
    // Load the map after component mounts and post data is available
    if (post && !mapLoaded) {
      loadMap();
    }
  }, [post]);

  const loadMap = () => {
    if (!post || typeof window === 'undefined') return;
    
    // Check if Google Maps script is already loaded
    if (!document.getElementById('google-maps-script') && !window.google?.maps) {
      setMapLoaded(false);
      
      // Create a new script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=places`;
      script.async = true;
      script.defer = true;
      
      // Initialize map when script loads
      script.onload = () => initializeMap();
      
      // Append script to document
      document.head.appendChild(script);
    } else if (window.google?.maps) {
      // If script is already loaded, just initialize map
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!post || !window.google?.maps) return;
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    const position = { lat: post.latitude, lng: post.longitude };
    
    const map = new window.google.maps.Map(mapElement, {
      center: position,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });
    
    new window.google.maps.Marker({
      position,
      map,
      title: post.title,
      animation: window.google.maps.Animation.DROP,
    });
    
    setMapLoaded(true);
  };

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
      case 'medium': return 'amber';
      case 'low': return 'green';
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

  const getSeverityText = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high': return 'High Priority - Dangerous condition';
      case 'medium': return 'Medium Priority - Moderate issue';
      case 'low': return 'Low Priority - Minor problem';
      default: return 'Unknown severity';
    }
  };

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: `Check out this road issue: ${post.title}`,
        url: window.location.href,
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to copy URL to clipboard
        copyToClipboard();
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast({
          title: "Link copied",
          description: "Report link copied to clipboard",
        });
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        toast({
          title: "Failed to copy",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      });
  };

  const openMapInGoogleMaps = () => {
    if (!post) return;
    
    const url = `https://www.google.com/maps/search/?api=1&query=${post.latitude},${post.longitude}`;
    window.open(url, '_blank');
  };
  
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Skeleton className="h-10 w-24 mr-4" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
  
  const NotFoundState = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="text-center max-w-md mx-auto px-4 py-12 rounded-lg bg-card/80 backdrop-blur shadow-lg border">
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive opacity-80 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-6">The report you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary/90"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!post) {
    return <NotFoundState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center mb-6 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" className="px-0 mr-1" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Home</span>
          </Button>
          <span className="mx-2">/</span>
          <span className="text-foreground">Report Details</span>
        </nav>
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{post.title}</h1>
            <div className="flex items-center text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{post.city}, {post.state}</span>
              <span className="mx-2">•</span>
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDate(post.created_at).split('at')[0]}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShare}
              className="flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 overflow-hidden">
              {post.photo_url && (
                <div className="w-full">
                  <img 
                    src={post.photo_url} 
                    alt="Road issue" 
                    className="w-full object-cover max-h-[400px]"
                  />
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge 
                    className={`${
                      post.severity === 'high' 
                        ? 'bg-destructive hover:bg-destructive/80' 
                        : post.severity === 'medium' 
                          ? 'bg-amber-500 hover:bg-amber-500/80'
                          : 'bg-green-500 hover:bg-green-500/80'
                    }`}
                  >
                    {getSeverityIcon(post.severity)}
                    <span className="ml-1">{getSeverityText(post.severity)}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Reported on {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="prose max-w-none mb-6">
                  <p className="text-muted-foreground whitespace-pre-line">{post.description}</p>
                </div>
                
                <Separator className="my-6" />
                
                <Tabs defaultValue="comments" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="border-none p-0">
                    <PostCard post={post} showFullContent={true} showCommentsOnly={true} />
                  </TabsContent>
                  
                  <TabsContent value="location" className="border-none p-0">
                    <div className="space-y-4">
                      <div id="map" className="h-[300px] bg-muted/30 rounded-md overflow-hidden">
                        {!mapLoaded && (
                          <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                              <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-pulse" />
                              <p className="text-sm text-muted-foreground">Loading map...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={openMapInGoogleMaps}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Open in Google Maps
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with Additional Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Reporter Information */}
            <Card className="shadow-sm border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2" />
                  Reporter Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.name}</p>
                    {post.email && (
                      <p className="text-sm text-muted-foreground">{post.email}</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">Report Date</p>
                    <p className="text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Report Time</p>
                    <p className="text-muted-foreground">
                      {new Date(post.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Location Information */}
            <Card className="shadow-sm border">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div>
                    <p className="font-medium mb-1 text-sm">Address</p>
                    <p className="text-muted-foreground">
                      {post.city}, {post.state}
                    </p>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-1 text-sm">Coordinates</p>
                    <p className="text-muted-foreground text-sm font-mono">
                      {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={openMapInGoogleMaps}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Google Maps
                </Button>
              </CardContent>
            </Card>

            {/* Video Evidence */}
            {post.video_url && (
              <Card className="shadow-sm border overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Video Evidence</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="aspect-video overflow-hidden rounded-md">
                    <iframe
                      src={post.video_url}
                      className="w-full h-full"
                      allowFullScreen
                      title="Road issue video"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Action Button */}
            <Card className="shadow-sm border bg-muted/10">
              <CardContent className="pt-6 pb-6">
                <Button 
                  className="w-full mb-3"
                  onClick={() => navigate('/create-post')}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report New Issue
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full text-muted-foreground" 
                  onClick={() => {
                    const reason = prompt("Please specify the reason for reporting this post:");
                    if (reason) {
                      toast({
                        title: "Report submitted",
                        description: "Thank you for reporting this issue",
                      });
                    }
                  }}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Report This Post
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;