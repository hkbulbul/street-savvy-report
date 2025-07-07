import { ArrowLeft, MapPin, Upload, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const CreatePost = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Post</h1>
            <p className="text-muted-foreground">Report a road issue in your area</p>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Create Road Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Your Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    className="bg-muted/30 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="bg-muted/30 border-border focus-visible:ring-primary"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Issue Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Issue Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  className="bg-muted/30 border-border focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the road issue"
                  rows={4}
                  className="bg-muted/30 border-border focus-visible:ring-primary resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Severity <span className="text-destructive">*</span>
                </Label>
                <Select>
                  <SelectTrigger className="bg-muted/30 border-border focus:ring-primary">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high" className="text-destructive font-medium">High - Dangerous</SelectItem>
                    <SelectItem value="medium" className="text-warning font-medium">Medium - Inconvenient</SelectItem>
                    <SelectItem value="low" className="text-muted-foreground">Low - Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-border focus:ring-primary">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ca">California</SelectItem>
                      <SelectItem value="ny">New York</SelectItem>
                      <SelectItem value="tx">Texas</SelectItem>
                      <SelectItem value="fl">Florida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-border focus:ring-primary">
                      <SelectValue placeholder="Select state first" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">Select state first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-sm font-medium">
                    Latitude <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="latitude"
                    placeholder="e.g., 28.6139"
                    className="bg-muted/30 border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-sm font-medium">
                    Longitude <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="longitude"
                    placeholder="e.g., 77.2090"
                    className="bg-muted/30 border-border focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Use My Current Location
              </Button>
            </div>

            <Separator className="bg-border" />

            {/* Media Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Media</h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Photo <span className="text-destructive">*</span>
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                        <Upload className="mr-2 h-4 w-4" />
                        Choose Image
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 4MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-sm font-medium">Video URL</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="bg-muted/30 border-border focus-visible:ring-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg h-12 text-base font-medium"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Post
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Created by <span className="font-medium">@andrenoari</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;