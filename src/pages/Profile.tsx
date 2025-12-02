import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { User, Store, ArrowLeft } from "lucide-react";
import bisonLogo from "@/assets/bison-logo.png";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional().or(z.literal("")),
  major: z.string().trim().max(100, "Major must be less than 100 characters").optional().or(z.literal("")),
  graduation_year: z.number().int().min(2000).max(2100).optional().or(z.literal(null)),
  bio: z.string().trim().max(500, "Bio must be less than 500 characters").optional().or(z.literal(""))
});

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  major: string | null;
  graduation_year: number | null;
  bio: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    major: "",
    graduation_year: "",
    bio: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          phone: profileData.phone || "",
          major: profileData.major || "",
          graduation_year: profileData.graduation_year?.toString() || "",
          bio: profileData.bio || ""
        });
      }

      // Check if business owner
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (roles?.some(r => r.role === "business_owner")) {
        setIsBusinessOwner(true);
      }
    };

    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const validated = profileSchema.parse({
        full_name: formData.full_name,
        phone: formData.phone || undefined,
        major: formData.major || undefined,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        bio: formData.bio || undefined
      });

      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          phone: validated.phone || null,
          major: validated.major || null,
          graduation_year: validated.graduation_year || null,
          bio: validated.bio || null
        })
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setProfile({
        ...profile!,
        full_name: validated.full_name,
        phone: validated.phone || null,
        major: validated.major || null,
        graduation_year: validated.graduation_year || null,
        bio: validated.bio || null
      });

      toast({ title: "Profile updated!" });
      setEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeBusinessOwner = async () => {
    if (!user) return;

    setLoading(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: user.id,
        role: "business_owner"
      });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "You're already a business owner!" });
        setIsBusinessOwner(true);
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      toast({ title: "You're now a business owner!" });
      setIsBusinessOwner(true);
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2">
            <img src={bisonLogo} alt="The Yard Exchange Bison Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold text-foreground">The Yard Exchange</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/home" className="text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/discover" className="text-foreground hover:text-primary transition-colors">Discover</Link>
            {isBusinessOwner && (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">Dashboard</Link>
            )}
            <Link to="/profile" className="text-primary font-semibold">Profile</Link>
          </nav>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/home")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>{profile?.full_name || "Your Profile"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    <Input
                      id="graduation_year"
                      type="number"
                      min="2000"
                      max="2100"
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{profile?.phone || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Major</p>
                    <p className="font-medium">{profile?.major || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Graduation Year</p>
                    <p className="font-medium">{profile?.graduation_year || "Not set"}</p>
                  </div>
                </div>
                {profile?.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="font-medium">{profile.bio}</p>
                  </div>
                )}
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {!isBusinessOwner && (
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Store className="h-8 w-8 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Want to list your business?</h3>
                  <p className="text-muted-foreground mb-4">
                    Become a business owner to showcase your services to the Howard community.
                  </p>
                  <Button onClick={handleBecomeBusinessOwner} disabled={loading}>
                    {loading ? "Processing..." : "List My Business"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isBusinessOwner && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Business Owner</h3>
                  <p className="text-sm text-muted-foreground">Manage your business listing</p>
                </div>
                <Button asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
