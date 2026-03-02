import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Category,
  Business,
  ContactInfo,
  Location,
  BusinessHours,
} from "@/lib/interfaces";
import { insertBusiness, updateBusiness } from "@/lib/data/utils";
import { businessSchema } from "@/components/business/BusinessForm";

interface BusinessFormData {
  name: string;
  category: Category;
  description: string;
  hours_of_operation: BusinessHours;
  logo_url: File | null;
  location: Location;
  email: string;
  phone_number: string;
  instagram: string;
  tiktok: string;
  website: string;
  facebook: string;
  tags: string;
}

interface UseBusinessFormOptions {
  isCreate: boolean;
  userId: string;
  existingBusiness?: Business | null;
  onSuccess?: () => void | Promise<void>;
}

export const useBusinessForm = ({
  isCreate,
  userId,
  existingBusiness,
  onSuccess,
}: UseBusinessFormOptions) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (formData: BusinessFormData) => {
    try {
      setLoading(true);

      // Validate form data
      const validated = businessSchema.parse({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        hours_of_operation: formData.hours_of_operation,
        logo_url: formData.logo_url || undefined,
        location: formData.location || undefined,
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        instagram: formData.instagram || undefined,
        tiktok: formData.tiktok || undefined,
        website: formData.website || undefined,
        facebook: formData.facebook || undefined,
        tags: formData.tags || undefined,
      });

      // Get user profile for owner_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      const ownerName = profile?.full_name || "Unknown";

      // For create, handle role assignment
      if (isCreate) {
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", userId)
          .single();

        let error;
        if (existingRole) {
          const result = await supabase
            .from("user_roles")
            .update({ role: "owner" })
            .eq("user_id", userId);
          error = result.error;
        } else {
          const result = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "owner" });
          error = result.error;
        }

        if (error) {
          throw new Error(`Failed to update user roles: ${error.message}`);
        }
      }

      // Prepare contact info
      const contactInfo: ContactInfo = {};
      if (validated.email) contactInfo.email = validated.email;
      if (validated.phone_number)
        contactInfo.phone_number = validated.phone_number;
      if (validated.instagram) contactInfo.instagram = validated.instagram;
      if (validated.tiktok) contactInfo.tiktok = validated.tiktok;
      if (validated.website) contactInfo.website = validated.website;
      if (validated.facebook) contactInfo.facebook = validated.facebook;

      // Parse tags
      const tagsArray = validated.tags
        ? validated.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [];

      // Handle logo upload
      let logoUrl: string | undefined = isCreate ? undefined : existingBusiness?.logo_url;
      if (validated.logo_url) {
        const businessId = isCreate
          ? crypto.randomUUID()
          : existingBusiness!.id;
        const logoPath = `${businessId}/logo/${validated.logo_url.name}`;
        const { error: uploadError } = await supabase.storage
          .from("businesses")
          .upload(logoPath, validated.logo_url, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Failed to upload logo: ${uploadError.message}`);
        }

        const { data: logoData } = await supabase.storage
          .from("businesses")
          .getPublicUrl(logoPath);

        logoUrl = logoData?.publicUrl || logoPath;
      }

      // Create or update business
      if (isCreate) {
        const businessId = crypto.randomUUID();
        const business: Business = {
          id: businessId,
          name: validated.name,
          owner_id: userId,
          owner_name: ownerName,
          category: validated.category,
          description: validated.description,
          hours_of_operation: validated.hours_of_operation as BusinessHours,
          contact_info:
            Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          user_views: 0,
          most_popular_products: [],
          user_sentiments: null,
          logo_url: logoUrl,
          location: validated.location,
        };

        await insertBusiness(business);

        toast({
          title: "Business created!",
          description: "Your business is now listed and discoverable.",
        });

        await onSuccess?.();
      } else {
        if (!existingBusiness) {
          throw new Error("Business not found");
        }

        const updatedBusiness: Business = {
          ...existingBusiness,
          name: validated.name,
          owner_name: ownerName,
          category: validated.category,
          description: validated.description,
          hours_of_operation: validated.hours_of_operation as BusinessHours,
          contact_info:
            Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
          location: validated.location,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          logo_url: logoUrl,
        };

        await updateBusiness(updatedBusiness);

        toast({
          title: "Business updated!",
          description: "Your business information has been updated.",
        });

        await onSuccess?.();
      }
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
          description:
            error instanceof Error ? error.message : "Failed to save business",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
};
