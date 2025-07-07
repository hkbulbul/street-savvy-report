import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalPosts: number;
  thisWeek: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

interface PostsSidebarProps {
  onFilterChange: (filters: { severity?: string; location?: string }) => void;
}

const PostsSidebar = ({ onFilterChange }: PostsSidebarProps) => {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    thisWeek: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });
  const [severity, setSeverity] = useState<string>('all');
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const filters: { severity?: string; location?: string } = {};
    if (severity !== 'all') filters.severity = severity;
    if (location) filters.location = location;
    onFilterChange(filters);
  }, [severity, location, onFilterChange]);

  const fetchStats = async () => {
    try {
      // Get total posts
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Get this week's posts
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: thisWeek } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get posts by severity
      const { count: highPriority } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'high');

      const { count: mediumPriority } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'medium');

      const { count: lowPriority } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'low');

      setStats({
        totalPosts: totalPosts || 0,
        thisWeek: thisWeek || 0,
        highPriority: highPriority || 0,
        mediumPriority: mediumPriority || 0,
        lowPriority: lowPriority || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Severity Level</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Location Filter</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter city, state, or area..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📊 Community Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <div className="text-sm text-muted-foreground">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.thisWeek}</div>
              <div className="text-sm text-muted-foreground">This Week</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-destructive rounded-full mr-2"></div>
                <span className="text-sm">High Priority</span>
              </div>
              <span className="text-sm font-medium">{stats.highPriority}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
                <span className="text-sm">Medium Priority</span>
              </div>
              <span className="text-sm font-medium">{stats.mediumPriority}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
                <span className="text-sm">Low Priority</span>
              </div>
              <span className="text-sm font-medium">{stats.lowPriority}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostsSidebar;