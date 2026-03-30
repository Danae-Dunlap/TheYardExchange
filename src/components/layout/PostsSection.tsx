import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart, ImagePlus, MessageSquare, Trash2, X } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface PostsSectionProps {
  limit?: number;
}

const PostsSection = ({ limit }: PostsSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [newPost, setNewPost] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [likesMap, setLikesMap] = useState<Record<string, { count: number; likedByMe: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  // Fetch posts with profile info
  const fetchPosts = async () => {
    let query = supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      const fetched = data as Post[];
      setPosts(fetched);
      setTotalCount(count ?? 0);
      fetchLikes(fetched.map((p) => p.id));
    }
  };

  const fetchLikes = async (postIds: string[]) => {
    if (postIds.length === 0) return;
    const { data, error } = await supabase
      .from("post_likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    if (error) { console.error("Error fetching likes:", error); return; }

    const map: Record<string, { count: number; likedByMe: boolean }> = {};
    for (const id of postIds) map[id] = { count: 0, likedByMe: false };
    for (const like of data) {
      map[like.post_id].count += 1;
      if (like.user_id === user?.id) map[like.post_id].likedByMe = true;
    }
    setLikesMap(map);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const current = likesMap[postId] ?? { count: 0, likedByMe: false };

    // Optimistic update
    setLikesMap((prev) => ({
      ...prev,
      [postId]: {
        count: current.likedByMe ? current.count - 1 : current.count + 1,
        likedByMe: !current.likedByMe,
      },
    }));

    if (current.likedByMe) {
      await supabase.from("post_likes").delete().match({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const resizeImage = (file: File, maxWidth = 800, maxHeight = 800): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
          "image/jpeg",
          0.8
        );
      };
      img.src = url;
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const resized = await resizeImage(file);
      setImageFile(resized);
      setImagePreview(URL.createObjectURL(resized));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Create a new post
  const handleSubmit = async () => {
    if (!newPost.trim() || !user) return;

    setLoading(true);

    let image_url: string | null = null;

    if (imageFile) {
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(filePath);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, content: newPost.trim(), image_url });

    if (error) {
      console.error("Error creating post:", error);
    } else {
      setNewPost("");
      clearImage();
      await fetchPosts();
    }
    setLoading(false);
  };

  // Prompt delete confirmation
  const confirmDelete = (postId: string) => {
    setDeletingPostId(postId);
    setDeleteDialogOpen(true);
  };

  // Delete a post
  const handleDelete = async () => {
    if (!deletingPostId) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", deletingPostId);

    if (error) {
      console.error("Error deleting post:", error);
    } else {
      await fetchPosts();
    }

    setDeleteDialogOpen(false);
    setDeletingPostId(null);
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-2xl font-bold text-foreground">Posts</h3>
        </div>

        {/* New post form */}
        {user && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <textarea
                className="w-full p-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              {imagePreview && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-md border border-input object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 hover:bg-background"
                  >
                    <X className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <label className="cursor-pointer text-muted-foreground hover:text-primary transition-colors">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <ImagePlus className="h-5 w-5" />
                </label>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !newPost.trim()}
                >
                  {loading ? "Posting..." : "Post"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts feed */}
        <div className={limit ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 col-span-full">
              No posts yet. Be the first to share something!
            </p>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow flex flex-col">
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                        {post.profiles?.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {post.profiles?.full_name || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(post.created_at)}
                        </p>
                      </div>
                    </div>
                    {user && user.id === post.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => confirmDelete(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground text-sm">{post.content}</p>
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post image"
                      className="mt-3 rounded-md max-h-48 max-w-xs object-cover"
                    />
                  )}
                  <div className="flex items-center gap-1 mt-3">
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={!user}
                      className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={likesMap[post.id]?.likedByMe ? "currentColor" : "none"}
                        color={likesMap[post.id]?.likedByMe ? "#ef4444" : "currentColor"}
                      />
                    </button>
                    <span className="text-xs text-muted-foreground">{likesMap[post.id]?.count ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View more button */}
        {limit && totalCount > limit && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => navigate("/community")}>
              View more
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default PostsSection;