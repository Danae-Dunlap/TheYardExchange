import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

const PostsSection = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch posts with profile info
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data as Post[]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Create a new post
  const handleSubmit = async () => {
    if (!newPost.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, content: newPost.trim() });

    if (error) {
      console.error("Error creating post:", error);
    } else {
      setNewPost("");
      await fetchPosts();
    }
    setLoading(false);
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
              <div className="flex justify-end mt-2">
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
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No posts yet. Be the first to share something!
            </p>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
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
                  <p className="text-foreground">{post.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default PostsSection;