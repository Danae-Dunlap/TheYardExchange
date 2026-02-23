import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { User } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/lib/interfaces";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  username: z.string().trim().max(20, "Username must be less than 20 characters"),
  bio: z.string().trim().max(100, "Create a short bio to introduce yourself to possible buyers!").optional().or(z.literal("")),
  avatar_url: z.instanceof(File).optional().refine(file => {
    if (!file) return true;
    const validTypes = ["image/png", "image/jpeg"];
    return validTypes.includes(file.type);
  }, "Invalid file type. Must be PNG or JPEG.")
});

const ProfileInfo = ({ }) => {
  const { user, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    if (user) {
      const fetchProfile = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const profileData: UserProfile | null = profile ? {
          id: profile.id,
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.student_email,
          bio: profile.bio,
          reviews: profile.reviews || [],
          favorite_businesses: profile.favorite_businesses,
          recently_viewed_businesses: profile.recently_viewed_businesses,
          favorite_products: profile.favorite_products || [],
        } : null;

        if (profileData) {
          setProfile(profileData);
          setFormData({
            full_name: profileData.full_name || "",
            username: profileData.username || "",
            bio: profileData.bio || "",
            avatar_url: null as File | null
          });

          const { data: profilePicture } = await supabase
            .storage
            .from("accounts")
            .getPublicUrl(`${user.id}/avatar/${profile?.avatar_url || ""}`);

          profileData.avatar_url = profilePicture?.publicUrl;

        };
      }
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const validated = profileSchema.parse({
        full_name: formData.full_name,
        username: formData.username || undefined,
        bio: formData.bio || undefined,
        avatar_url: formData.avatar_url || undefined,
      });

      setLoading(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: validated.full_name,
          username: validated.username || null,
          bio: validated.bio || null,
          avatar_url: validated.avatar_url ? validated.avatar_url.name : null
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
        username: validated.username || null,
        avatar_url: validated.avatar_url ? `${user.id}/avatar/${formData.avatar_url?.name}` : null,
        bio: validated.bio || null
      });
      const { error: uploadError } = await supabase
        .storage
        .from("accounts")
        .update(`${user.id}/avatar/${formData.avatar_url?.name}`, formData.avatar_url);

      if (uploadError) {
        toast({
          title: "Error",
          description: uploadError.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Profile updated!" });
      }

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

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle>{profile?.full_name || "Your Profile"}</CardTitle>
              <CardDescription>{profile?.email}</CardDescription>
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
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Profile Picture</Label>
                  <Input
                    id="avatar_url"
                    type="file"
                    accept="image/png, image/jpeg"
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.files?.[0] || null })}
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
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{profile?.username || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Picture</p>
                  <p className="font-medium">{profile?.avatar_url ? "Uploaded" : "Not set"}</p>
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

    </div>);
}

export default ProfileInfo;