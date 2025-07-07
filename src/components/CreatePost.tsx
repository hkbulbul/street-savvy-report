import { ArrowLeft, MapPin, Upload, Camera, Plus, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

const CreatePost = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
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

  useEffect(() => {
    // Create preview URL for the selected image
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

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

    toast({
      title: "Getting your location",
      description: "Please wait...",
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));
        
        // Use reverse geocoding to get city and state
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          
          const data = await response.json();
          
          if (data && data.address) {
            const state = data.address.state || data.address.region || "";
            const city = data.address.city || data.address.town || data.address.village || "";
            
            setFormData(prev => ({
              ...prev,
              state: state,
              city: city
            }));
            
            toast({
              title: "Location captured",
              description: `Your location: ${city}, ${state}`
            });
          } else {
            toast({
              title: "Location captured",
              description: "Coordinates captured, but couldn't determine city/state"
            });
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          toast({
            title: "Location captured",
            description: "Coordinates captured, but couldn't determine city/state"
          });
        }
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

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.title) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields in this step",
          variant: "destructive"
        });
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.severity || !formData.state || !formData.city || !formData.latitude || !formData.longitude) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields in this step",
          variant: "destructive"
        });
        return false;
      }
    } else if (currentStep === 3) {
      if (!selectedFile) {
        toast({
          title: "Missing required fields",
          description: "Please upload an image",
          variant: "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
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
      setPreviewUrl(null);
      
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

  // Step indicator component
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        {[1, 2, 3].map((step) => (
          <div 
            key={step}
            className={`flex items-center justify-center rounded-full w-10 h-10 ${
              currentStep === step 
                ? 'bg-primary text-primary-foreground' 
                : currentStep > step 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {currentStep > step ? <CheckCircle size={18} /> : step}
          </div>
        ))}
      </div>
      <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Basic Info</span>
        <span>Location</span>
        <span>Media</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Header Navigation */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" size="sm" className="mr-3" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Post</h1>
            <p className="text-muted-foreground">Report a road issue in your area</p>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur">
          <CardHeader className="pb-6 border-b">
            <CardTitle className="text-xl text-foreground flex items-center">
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Location Details"}
              {currentStep === 3 && "Media Upload"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="create-post-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Personal Information */}
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

                  {/* Issue Details */}
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
                      <Select 
                        value={formData.severity} 
                        onValueChange={(value) => handleInputChange('severity', value)} 
                        required
                      >
                        <SelectTrigger className="bg-muted/30 border-border focus:ring-primary">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high" className="text-destructive font-medium">High - Dangerous</SelectItem>
                          <SelectItem value="medium" className="text-amber-500 font-medium">Medium - Inconvenient</SelectItem>
                          <SelectItem value="low" className="text-green-500 font-medium">Low - Minor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Location Details</h3>
                    
                    <Button 
                      type="button"
                      onClick={getCurrentLocation}
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center h-12 mb-4"
                    >
                      <MapPin className="mr-2 h-5 w-5" />
                      Use My Current Location
                    </Button>
                    
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
                            <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                            <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                            <SelectItem value="Assam">Assam</SelectItem>
                            <SelectItem value="Bihar">Bihar</SelectItem>
                            <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                            <SelectItem value="Goa">Goa</SelectItem>
                            <SelectItem value="Gujarat">Gujarat</SelectItem>
                            <SelectItem value="Haryana">Haryana</SelectItem>
                            <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                            <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                            <SelectItem value="Karnataka">Karnataka</SelectItem>
                            <SelectItem value="Kerala">Kerala</SelectItem>
                            <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                            <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                            <SelectItem value="Manipur">Manipur</SelectItem>
                            <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                            <SelectItem value="Mizoram">Mizoram</SelectItem>
                            <SelectItem value="Nagaland">Nagaland</SelectItem>
                            <SelectItem value="Odisha">Odisha</SelectItem>
                            <SelectItem value="Punjab">Punjab</SelectItem>
                            <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                            <SelectItem value="Sikkim">Sikkim</SelectItem>
                            <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                            <SelectItem value="Telangana">Telangana</SelectItem>
                            <SelectItem value="Tripura">Tripura</SelectItem>
                            <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                            <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                            <SelectItem value="West Bengal">West Bengal</SelectItem>
                            <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                            <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                            <SelectItem value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</SelectItem>
                            <SelectItem value="Delhi">Delhi</SelectItem>
                            <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                            <SelectItem value="Ladakh">Ladakh</SelectItem>
                            <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                            <SelectItem value="Puducherry">Puducherry</SelectItem>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                  </div>
                </div>
              )}

              {/* Step 3: Media */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Media Files</h3>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Photo <span className="text-destructive">*</span>
                      </Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                        {previewUrl ? (
                          <div className="space-y-4">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="mx-auto max-h-64 rounded-md shadow object-cover"
                            />
                            <Button 
                              type="button"
                              onClick={() => {
                                setSelectedFile(null);
                                setPreviewUrl(null);
                              }}
                              variant="outline" 
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="mx-auto w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Camera className="h-10 w-10 text-muted-foreground" />
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
                                Choose Image
                              </Button>
                              <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 4MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="videoUrl" className="text-sm font-medium">Video URL</Label>
                      <Input
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="bg-muted/30 border-border focus-visible:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Optional: Add a YouTube or other video URL showing the road condition
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-1/3"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                type="button" 
                onClick={nextStep}
                className="w-1/3 bg-primary hover:bg-primary/90"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                form="create-post-form" 
                type="submit" 
                disabled={isSubmitting}
                className="w-1/3 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <div className="text-center pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            Thank you for helping improve road conditions in your community
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;