import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, TrendingUp, Users, MessageCircle, 
  Eye, Heart, Star, Calendar, Settings,
  BarChart3, Clock, Lightbulb
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { label: "Total Views", value: "1,247", change: "+12%", icon: Eye },
    { label: "Messages", value: "34", change: "+5", icon: MessageCircle },
    { label: "Favorites", value: "89", change: "+18%", icon: Heart },
    { label: "Avg Rating", value: "4.8", change: "0", icon: Star }
  ];

  const aiInsights = [
    {
      title: "Peak Activity Hours",
      description: "Your customers are most active between 2PM-6PM on weekdays",
      action: "Schedule posts during peak hours",
      icon: Clock,
      color: "text-primary"
    },
    {
      title: "Popular Services",
      description: "Box braids get 40% more inquiries than other services",
      action: "Consider highlighting this service",
      icon: TrendingUp,
      color: "text-secondary"
    },
    {
      title: "Customer Feedback",
      description: "95% of customers mention 'professional' and 'friendly'",
      action: "Keep up the great service!",
      icon: Lightbulb,
      color: "text-accent"
    }
  ];

  const recentMessages = [
    {
      id: 1,
      from: "Sarah M.",
      message: "Hi! Do you have availability this Saturday?",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      from: "Marcus T.",
      message: "Can I schedule a consultation?",
      time: "5 hours ago",
      unread: true
    },
    {
      id: 3,
      from: "Tasha W.",
      message: "Thank you! The braids look amazing!",
      time: "1 day ago",
      unread: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">The Yard Exchange</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/discover" className="text-foreground hover:text-primary transition-colors">Discover</Link>
            <Link to="/dashboard" className="text-primary font-semibold">Dashboard</Link>
          </nav>
          <Button variant="outline">Sign In</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Business Dashboard</h2>
            <p className="text-muted-foreground">Manage your business and track performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button className="gap-2">
              <Link to="/business/1" className="flex items-center gap-2">
                View Public Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant={stat.change.includes('+') ? 'default' : 'secondary'}>
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insights */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className="bg-card rounded-lg p-4 border border-border">
                  <insight.icon className={`h-6 w-6 mb-3 ${insight.color}`} />
                  <h4 className="font-semibold text-foreground mb-2">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    {insight.action} →
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="messages">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentMessages.map((msg) => (
                        <div 
                          key={msg.id}
                          className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-foreground">{msg.from}</p>
                              <span className="text-sm text-muted-foreground">{msg.time}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{msg.message}</p>
                            {msg.unread && (
                              <Badge className="mt-2" variant="default">New</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">View All Messages</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((booking) => (
                        <div key={booking} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">Box Braids - Sarah M.</p>
                              <p className="text-sm text-muted-foreground">Tomorrow at 2:00 PM</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Manage</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center border border-border rounded-lg bg-muted/30">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Analytics chart would appear here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full gap-2 mb-4">
                      <Calendar className="h-4 w-4" />
                      Create New Event
                    </Button>
                    <div className="space-y-4">
                      <div className="p-4 border border-border rounded-lg">
                        <h4 className="font-semibold text-foreground mb-2">Spring Hair Care Workshop</h4>
                        <p className="text-sm text-muted-foreground mb-2">March 15, 2024</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Cancel</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Post
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Promote Business
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="p-6">
                <Lightbulb className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold text-foreground mb-2">Pro Tip</h4>
                <p className="text-sm text-muted-foreground">
                  Businesses that respond to messages within 1 hour get 3x more bookings!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
