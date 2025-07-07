import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Filter, BarChart3, RefreshCcw, Map, AlertTriangle, Dot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const totalSeverityReports = stats.highPriority + stats.mediumPriority + stats.lowPriority;

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Filter className="w-5 h-5 mr-2" />
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Severity Level</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="bg-muted/30 border focus:ring-1 focus:ring-primary">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high" className="flex items-center">
                  <div className="w-2 h-2 bg-destructive rounded-full mr-2"></div>
                  High Priority
                </SelectItem>
                <SelectItem value="medium" className="flex items-center">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                  Medium Priority
                </SelectItem>
                <SelectItem value="low" className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Low Priority
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="City or state..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 bg-muted/30 border focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs border-muted-foreground/30 hover:bg-muted/50"
              onClick={() => {
                setSeverity('all');
                setLocation('');
              }}
            >
              Clear All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs flex items-center gap-1 text-primary border-primary hover:bg-primary/10"
              onClick={fetchStats}
            >
              <RefreshCcw className="h-3 w-3" /> Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Community Card */}
      <Card className="border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <BarChart3 className="w-5 h-5 mr-2" />
            Community Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.totalPosts}</div>
              <div className="text-xs text-muted-foreground">Total Reports</div>
            </div>
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{stats.thisWeek}</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>
          
          {/* Severity Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Severity Distribution</h4>
              <Badge variant="outline" className="text-xs font-normal px-1.5">
                {totalSeverityReports} total
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-destructive rounded-full mr-2"></div>
                    <span className="text-sm">High Priority</span>
                  </div>
                  <span className="text-sm font-medium">{stats.highPriority}</span>
                </div>
                <Progress 
                  value={totalSeverityReports ? (stats.highPriority / totalSeverityReports) * 100 : 0} 
                  className="h-1.5 bg-muted" 
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                    <span className="text-sm">Medium Priority</span>
                  </div>
                  <span className="text-sm font-medium">{stats.mediumPriority}</span>
                </div>
                <Progress 
                  value={totalSeverityReports ? (stats.mediumPriority / totalSeverityReports) * 100 : 0} 
                  className="h-1.5 bg-muted" 
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm">Low Priority</span>
                  </div>
                  <span className="text-sm font-medium">{stats.lowPriority}</span>
                </div>
                <Progress 
                  value={totalSeverityReports ? (stats.lowPriority / totalSeverityReports) * 100 : 0} 
                  className="h-1.5 bg-muted" 
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/10 pt-3 pb-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-primary border-primary hover:bg-primary/10"
            onClick={() => navigate('/create-post')}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-2" />
            Report New Issue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PostsSidebar;