import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/10">
      <Header />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
              <div className="w-8 h-8 rounded-full bg-primary-foreground"></div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Report <span className="text-primary">Road Issues</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Help improve your community by reporting poorly maintained roads. 
              Together, we can make our streets safer for everyone.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/create-post"
              className="inline-flex items-center justify-center h-12 px-8 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg font-medium transition-colors shadow-lg"
            >
              Report an Issue
            </a>
            <button className="inline-flex items-center justify-center h-12 px-8 border border-border bg-card hover:bg-muted/50 text-foreground rounded-lg font-medium transition-colors">
              Browse Reports
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-primary rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Easy Reporting</h3>
            <p className="text-muted-foreground">
              Simple form to report road issues with photos and location details
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-warning rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Location Tracking</h3>
            <p className="text-muted-foreground">
              Automatic location detection or manual coordinate input
            </p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-success rounded"></div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Community Impact</h3>
            <p className="text-muted-foreground">
              Help local authorities prioritize road maintenance and repairs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
