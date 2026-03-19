import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "../interfaces";

/**
 * Fetch profile data from the database.
 *
 * @param query - The query parameters to filter profiles.
 * @returns A promise that resolves to an array of profile data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProfile(user_id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user_id);

  if (error) {
    throw new Error(`Error fetching profile: ${error.message}`);
  }
  if (!data || data.length === 0) {
    return null;
  }

  const profiles = await Promise.all(
    data.map(async (profile: any) => {
      return {
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        email: profile.student_email,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        reviews: profile.reviews,
        favorite_businesses: profile.favorite_businesses,
        recently_viewed_businesses: profile.recently_viewed_businesses,
        favorite_products: profile.favorite_products,
      };
    })
  );

  return profiles[0] || null;
}

/**
 * Delete a profile from the database.
 *
 * @param profileId - id of user to be deleted
 * @throws Error if the delete operation fails in any table.
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);
  const { error: imageError } = await supabase.storage
    .from("account_images")
    .remove([`${profileId}/avatar/`]);

  if (profileError) {
    throw new Error(`Error deleting profile: ${profileError?.message}`);
  }
  if (imageError) {
    throw new Error(`Error deleting profile image: ${imageError.message}`);
  }
}
