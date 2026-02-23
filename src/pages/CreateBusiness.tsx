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
import { ArrowLeft, Store } from "lucide-react";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Category, Business, ContactInfo } from "@/lib/interfaces";
import { insertBusiness } from "@/lib/data/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Footer from "@/components/layout/Footer";

const businessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(100, "Name must be less than 100 characters"),
  category: z.nativeEnum(Category).refine(val => val !== Category.Default, "Please select a category"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  price_range: z.string().regex(/^\d+-\d+$/, "Price range must be in format: min-max (e.g., 10-50)"),
  hours_of_operation: z.string().min(1, "Hours of operation are required"),
  logo_url: z.instanceof(File).optional().refine(file => {
    if (!file) return true;
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    return validTypes.includes(file.type);
  }, "Invalid file type. Must be PNG or JPEG.").optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone_number: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  tags: z.string().optional(),
});

const CreateBusiness = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: Category.Default,
    description: "",
    price_range: "",
    hours_of_operation: "",
    logo_url: null as File | null,
    email: "",
    phone_number: "",
    instagram: "",
    tiktok: "",
    website: "",
    facebook: "",
    tags: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const validated = businessSchema.parse({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price_range: formData.price_range,
        hours_of_operation: formData.hours_of_operation,
        logo_url: formData.logo_url || undefined,
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        instagram: formData.instagram || undefined,
        tiktok: formData.tiktok || undefined,
        website: formData.website || undefined,
        facebook: formData.facebook || undefined,
        tags: formData.tags || undefined,
      });

      setLoading(true);

      // Get user profile for owner_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const ownerName = profile?.full_name || user.email || "Unknown";

      // Generate business ID
      const businessId = crypto.randomUUID();

      // Prepare contact info
      const contactInfo: ContactInfo = {};
      if (validated.email) contactInfo.email = validated.email;
      if (validated.phone_number) contactInfo.phone_number = validated.phone_number;
      if (validated.instagram) contactInfo.instagram = validated.instagram;
      if (validated.tiktok) contactInfo.tiktok = validated.tiktok;
      if (validated.website) contactInfo.website = validated.website;
      if (validated.facebook) contactInfo.facebook = validated.facebook;

      // Parse tags
      const tagsArray = validated.tags
        ? validated.tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Upload logo if provided
      let logoUrl: string | undefined = undefined;
      if (validated.logo_url) {
        const logoPath = `${businessId}/logo/${validated.logo_url.name}`;
        const { error: uploadError } = await supabase.storage
          .from("businesses")
          .upload(logoPath, validated.logo_url, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload logo: ${uploadError.message}`);
        }

        // Get public URL for logo
        const { data: logoData } = await supabase.storage
          .from("businesses")
          .getPublicUrl(logoPath);
        
        logoUrl = logoData?.publicUrl || logoPath;
      }

      // Create business object
      const business: Business = {
        id: businessId,
        name: validated.name,
        owner_id: user.id,
        owner_name: ownerName,
        category: validated.category,
        description: validated.description,
        price_range: validated.price_range.split("-").map(Number), //TEMPORARY FIX - SEE https://github.com/Danae-Dunlap/TheYardExchange/issues/64
        hours_of_operation: validated.hours_of_operation,
        contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        user_views: 0,
        most_popular_products: [],
        user_sentiments: null,
        logo_url: logoUrl,
      };

      // Insert business
      await insertBusiness(business);

      toast({
        title: "Business created!",
        description: "Your business is now listed and discoverable.",
      });

      navigate("/dashboard");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create business",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Store className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>List Your Business</CardTitle>
                <CardDescription>
                  Create your business profile to start showcasing your services to the Howard community
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sarah's Hair Studio"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Category)
                        .filter(cat => cat !== Category.Default)
                        .map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Tell customers about your business..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range *</Label>
                  <Input
                    id="price_range"
                    type="number"
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    placeholder="e.g., 25-100"
                    required
                  />
                  <p className="text-sm text-muted-foreground">Format: min-max (e.g., 25-100)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours_of_operation">Hours of Operation *</Label>
                  <Textarea
                    id="hours_of_operation"
                    value={formData.hours_of_operation}
                    onChange={(e) => setFormData({ ...formData, hours_of_operation: e.target.value })}
                    placeholder="e.g., Monday-Friday: 9AM-5PM&#10;Saturday: 10AM-3PM"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g., braids, natural hair, quick service"
                  />
                  <p className="text-sm text-muted-foreground">Separate tags with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo_url">Business Logo</Label>
                  <Input
                    id="logo_url"
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.files?.[0] || null })}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                <p className="text-sm text-muted-foreground">Add your contact details so customers can reach you</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="business@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="(202) 555-0123"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="@yourhandle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok</Label>
                    <Input
                      id="tiktok"
                      value={formData.tiktok}
                      onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                      placeholder="@yourhandle"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      value={formData.facebook}
                      onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                      placeholder="Your Facebook Page"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Business"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default CreateBusiness;
