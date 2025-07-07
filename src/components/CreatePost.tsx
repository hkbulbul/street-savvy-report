import { ArrowLeft, MapPin, Upload, Camera, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreatePost = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
    severity: '',
    state: '',
    city: '',
    latitude: '',
    longitude: '',
    videoUrl: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 4MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        toast({
          title: "Location captured",
          description: "Your current location has been set"
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Unable to get your location. Please enter manually.",
          variant: "destructive"
        });
      }
    );
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('road-images')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('road-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.title || !formData.severity || 
        !formData.state || !formData.city || !formData.latitude || 
        !formData.longitude || !selectedFile) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and upload an image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image
      let photoUrl = null;
      if (selectedFile) {
        photoUrl = await uploadImage(selectedFile);
        if (!photoUrl) {
          throw new Error('Failed to upload image');
        }
      }

      // Submit post data
      const { error } = await supabase
        .from('posts')
        .insert({
          name: formData.name,
          email: formData.email || null,
          title: formData.title,
          description: formData.description || null,
          severity: formData.severity,
          state: formData.state,
          city: formData.city,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          photo_url: photoUrl,
          video_url: formData.videoUrl || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Post created successfully!",
        description: "Your road condition report has been submitted"
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        title: '',
        description: '',
        severity: '',
        state: '',
        city: '',
        latitude: '',
        longitude: '',
        videoUrl: ''
      });
      setSelectedFile(null);
      
      // Navigate back to home
      navigate('/');
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-3" onClick={() => navigate('/')}>
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
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your name"
                      className="bg-muted/30 border-border focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
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
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of the issue"
                    className="bg-muted/30 border-border focus-visible:ring-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detailed description of the road issue"
                    rows={4}
                    className="bg-muted/30 border-border focus-visible:ring-primary resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Severity <span className="text-destructive">*</span>
                  </Label>
                  <Select value={formData.severity} onValueChange={(value) => handleInputChange('severity', value)} required>
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
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)} required>
                      <SelectTrigger className="bg-muted/30 border-border focus:ring-primary">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="California">California</SelectItem>
                        <SelectItem value="New York">New York</SelectItem>
                        <SelectItem value="Texas">Texas</SelectItem>
                        <SelectItem value="Florida">Florida</SelectItem>
                        <SelectItem value="Illinois">Illinois</SelectItem>
                        <SelectItem value="Pennsylvania">Pennsylvania</SelectItem>
                        <SelectItem value="Ohio">Ohio</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="North Carolina">North Carolina</SelectItem>
                        <SelectItem value="Michigan">Michigan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city name"
                      className="bg-muted/30 border-border focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-sm font-medium">
                      Latitude <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleInputChange('latitude', e.target.value)}
                      placeholder="e.g., 28.6139"
                      className="bg-muted/30 border-border focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-sm font-medium">
                      Longitude <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleInputChange('longitude', e.target.value)}
                      placeholder="e.g., 77.2090"
                      className="bg-muted/30 border-border focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="button"
                  onClick={getCurrentLocation}
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
                        <input
                          type="file"
                          id="photo-upload"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                          required
                        />
                        <Button 
                          type="button"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          variant="outline" 
                          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          {selectedFile ? selectedFile.name : 'Choose Image'}
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
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="bg-muted/30 border-border focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg h-12 text-base font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Creating Post...' : 'Create Post'}
                </Button>
              </div>

              {/* Footer */}
              <div className="text-center pt-4">
                <p className="text-xs text-muted-foreground">
                  Created by <span className="font-medium">@andrenoari</span>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;