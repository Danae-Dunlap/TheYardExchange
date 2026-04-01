import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/lib/interfaces";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import Cropper, { Area } from "react-easy-crop";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  username: z.string().trim().max(20, "Username must be less than 20 characters"),
  bio: z.string().trim().max(100, "Create a short bio to introduce yourself to possible buyers!").optional().or(z.literal("")),
});

/**
 * Takes an image source URL and a pixel crop area,
 * draws the cropped region onto a canvas, and returns it as a Blob.
 */
async function getCroppedImageBlob(
  imageSrc: string,
  cropPixels: Area
): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/jpeg", 0.9);
  });
}

const ProfileInfo = ({ }) => {
  const { user, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    bio: "",
  });

  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
          });

          if (profile?.avatar_url) {
            const { data: profilePicture } = supabase
              .storage
              .from("accounts")
              .getPublicUrl(`${user.id}/avatar/${profile.avatar_url}`);

            if (profilePicture?.publicUrl) {
              setAvatarPublicUrl(profilePicture.publicUrl);
            }
          }
        }
      };
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a PNG or JPEG image.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const validated = profileSchema.parse({
        full_name: formData.full_name,
        username: formData.username || undefined,
        bio: formData.bio || undefined,
      });

      setLoading(true);

      const updateData: Record<string, unknown> = {
        full_name: validated.full_name,
        username: validated.username || null,
        bio: validated.bio || null,
      };

      // Handle cropped image upload if user selected and cropped an image
      if (imageSrc && croppedAreaPixels) {
        const croppedBlob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
        const fileName = `avatar_${Date.now()}.jpg`;
        const filePath = `${user.id}/avatar/${fileName}`;

        const { error: uploadError } = await supabase
          .storage
          .from("accounts")
          .upload(filePath, croppedBlob, {
            upsert: true,
            contentType: "image/jpeg",
          });

        if (uploadError) {
          toast({
            title: "Error uploading image",
            description: uploadError.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        updateData.avatar_url = fileName;

        const { data: newUrl } = supabase
          .storage
          .from("accounts")
          .getPublicUrl(filePath);

        if (newUrl?.publicUrl) {
          setAvatarPublicUrl(`${newUrl.publicUrl}?t=${Date.now()}`);
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProfile({
        ...profile!,
        full_name: validated.full_name,
        username: validated.username || null,
        avatar_url: updateData.avatar_url as string ?? profile?.avatar_url ?? null,
        bio: validated.bio || null,
      });

      // Reset cropper state
      setImageSrc(null);
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);

      toast({ title: "Profile updated!" });
      setEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
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
            {avatarPublicUrl ? (
              <img
                src={avatarPublicUrl}
                alt="Profile picture"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
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

              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <Input
                  id="avatar_url"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileSelect}
                />

                {imageSrc && (
                  <div className="mt-3 space-y-3">
                    <div
                      className="relative w-full rounded-lg overflow-hidden bg-muted"
                      style={{ height: "300px" }}
                    >
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm whitespace-nowrap">Zoom</Label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      Remove
                    </Button>
                  </div>
                )}
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
                <Button variant="outline" onClick={() => { setEditing(false); handleRemoveImage(); }}>
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
    </div>
  );
};

export default ProfileInfo;