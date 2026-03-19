import { supabase } from "@/integrations/supabase/client";
import type { Product } from "../interfaces";
import { recalculatePriceRange } from "@/lib/data/pricing.utils";

/**
 * Fetch product data from the database.
 *
 * @param business_id - The array of business IDs to fetch products for.
 * @param product_id - ID value used to fetch most popular products
 * @returns A promise that resolves to an array of product data
 * @throws Error if the fetch operation fails.
 */
export async function fetchProducts(
  business_id?: string,
  is_fav?: boolean,
  product_id?: string[]
): Promise<Product[] | null> {
  let query = supabase.from("products").select("*");

  if (business_id) {
    query = query.eq("business_id", business_id);
  }
  if (is_fav) {
    query = query.eq("is_favorite", is_fav);
  }
  if (product_id && product_id.length > 0) {
    query = query.in("id", product_id);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error fetching products: ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const products: Promise<Product[] | null> = Promise.all(
    data.map(async (product: any) => {
      return {
        id: product.id,
        name: product.product_name,
        business_id: product.business_id,
        business_name: product.business_name,
        description: product.description,
        images: product.images,
        price: Number(product.price),
        rating: product.rating ? Number(product.rating) : null,
        tags: product.tags,
        is_fav: product.is_favorite,
        is_service: product.is_service,
        duration: product.duration,
        reviews: product.reviews || null,
        user_views: Number(product.user_views),
        users_favorited: product.users_favorited,
      };
    })
  );

  return products;
}

/**
 * Insert a new product into the database.
 *
 * @param product Product data
 * @param imageFile Optional image file to upload
 * @throws Error if the insert operation fails.
 */
export async function insertProduct(
  product: Product,
  imageFile?: File
): Promise<void> {
  let imagePath: string = null;

  if (imageFile) {
    const fileName = `${product.business_id}/${product.id}/image/${imageFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(fileName, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Error uploading product image: ${uploadError.message}`);
    }

    const { data: imageData } = await supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    imagePath = imageData?.publicUrl || fileName;
  } else if (product.image) {
    imagePath = product.image;
  }

  const { error } = await supabase.from("products").insert({
    id: product.id,
    product_name: product.name,
    business_id: product.business_id,
    business_name: product.business_name,
    description: product.description || null,
    images: imagePath ? imagePath : null,
    price: product.price,
    user_views: product.user_views || 0,
    is_service: product.is_service || false,
    duration: product.duration || null,
    category: product.tags?.[0] || null,
  });

  if (error) {
    throw new Error(`Error inserting product: ${error.message}`);
  }

  await recalculatePriceRange(product.business_id);
}

/**
 * Update an existing product in the database.
 *
 * @param product
 * @throws Error if the update operation fails.
 */
export async function updateProduct(product: Product): Promise<void> {
  const fileName = `${product.id}/image/${product.image}`;
  const { error } = await supabase
    .from("products")
    .update({
      name: product.name,
      business_name: product.business_name,
      description: product.description || null,
      images: product.image ? `${product.business_id}/images/${product.image}` : null,
      price: product.price,
      user_views: product.user_views,
    })
    .eq("id", product.id);

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(fileName, product.image);
  if (error) {
    throw new Error(`Error updating product: ${error.message}`);
  }
  if (uploadError) {
    throw new Error(`Error uploading product image: ${uploadError.message}`);
  }

  await recalculatePriceRange(product.business_id);
}

/**
 * Delete a product from the database.
 *
 * @param productId
 * @throws Error if the delete operation fails.
 */
export async function deleteProduct(productId: string): Promise<void> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("business_id")
    .eq("id", productId)
    .single();

  if (fetchError) {
    throw new Error(`Error fetching product: ${fetchError.message}`);
  }

  const businessId = product?.business_id;

  const { error: deleteImageError } = await supabase.storage
    .from("products")
    .remove([`${productId}/image/`]);
  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (deleteImageError) {
    throw new Error(`Error deleting product image: ${deleteImageError.message}`);
  }
  if (error) {
    throw new Error(`Error deleting product: ${error.message}`);
  }

  if (businessId) {
    await recalculatePriceRange(businessId);
  }
}
