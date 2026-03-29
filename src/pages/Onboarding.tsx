import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Interests } from "@/lib/interfaces";
import bisonLogo from "@/assets/bison-logo.png";
import type { User } from "@supabase/supabase-js";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  username: z.string().trim().max(20, "Username must be less than 20 characters").or(z.literal("")),
  bio: z.string().trim().max(100, "Bio must be less than 100 characters").optional().or(z.literal("")),
  avatar_url: z.instanceof(File).optional().refine(file => {
    if (!file) return true;
    const validTypes = ["image/png", "image/jpeg"];
    return validTypes.includes(file.type);
  }, "Invalid file type. Must be PNG or JPEG.").optional(),
  interest: z.string().array().optional()
});

const Onboarding = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: null as File | null,
    interests: []
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUser(session.user);

      // Check if user already has a profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        // Profile exists, redirect to home
        navigate("/home");
        return;
      }
      setCheckingProfile(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const validated = profileSchema.parse({
        full_name: formData.full_name,
        username: formData.username || undefined,
        bio: formData.bio || undefined,
        avatar_url: formData.avatar_url || undefined,
        interest: formData.interests || []
      });

      setLoading(true);

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          student_email: user.email,
          full_name: validated.full_name,
          username: validated.username || null,
          bio: validated.bio || null,
          avatar_url: validated.avatar_url ? `${user.id}/avatar/${validated.avatar_url.name}` : null,
          user_interests: validated.interest || null
        });

      //Upload avatar if provided
      if (validated.avatar_url) {
        const {error: uploadError } = await supabase
        .storage
        .from('accounts')
        .upload(`${user.id}/avatar/${validated.avatar_url.name}`, validated.avatar_url.name, {
          cacheControl: '3600',
          upsert: true
        });

        if (uploadError) {console.error("Avatar upload error:", uploadError);}
      }

      if (profileError) {
        toast({
          title: "Error",
          description: profileError.message,
          variant: "destructive"
        });
        return;
      }

      // Assign customer role by default
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "consumer"
        });

      if (roleError) {
        console.error("Role assignment error:", roleError);
      }

      toast({
        title: "Profile created!",
        description: "Welcome to The Yard Exchange."
      });

      navigate("/home");
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

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={bisonLogo} alt="Bison Logo" className="h-16 w-16" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set Up Your Profile</CardTitle>
            <CardDescription className="text-center">
              Tell us a bit about yourself
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="Your name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
                
              <div className="space-y-2">
                    <Label htmlFor="avatar_url">Profile Picture</Label>
                    <Input
                      id="avatar_url"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.files?.[0] || null })}
                    />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {Interests.map((interest) => {
                  const selected = formData.interests?.includes(interest);
                  return (
                    <Button
                      key={interest}
                      id={`interest-${interest}`}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setFormData({ ...formData, interests: formData.interests?.filter((i) => i !== interest) });
                        } else {
                          setFormData({ ...formData, interests: [...(formData.interests || []), interest] });
                        }
                      }}
                      className={`rounded-2xl py-2 px-4 text-sm font-medium transition-colors duration-150 ${
                        selected
                          ? "bg-indigo-800 text-white shadow-lg ring-2 ring-indigo-400 hover:bg-indigo-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}>
                      {interest}
                    </Button>
                  );
                })}
              </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating profile..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
