import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/interfaces";

interface AuthContextType {
  user: User | null;
  isBusinessOwner: boolean;
  loading: boolean;
  profile: UserProfile | null; 
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshProfileData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null); 
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = useCallback(async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    setIsBusinessOwner(roles?.some(r => r.role === "owner") ?? false);
  }, []);

  const fetchProfile = useCallback(async (user_id: string) => {
    const {data, error} = await supabase.from('profiles').select('*').eq('id', user_id);

    if (error) {throw new Error(`Error fetching profile: ${error.message}`);}
    if (!data || data.length === 0) {return null;}

    //Format data to match Profile interface
    const profiles = await Promise.all(data.map(async (profile: any) => {
        return {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            email: profile.student_email,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            favorite_businesses: profile.favorite_businesses ? profile.favorite_businesses : [],
            recently_viewed_businesses: profile.recently_viewed_businesses ? profile.recently_viewed_businesses : [],
            favorite_products: profile.favorite_products ? profile.favorite_products : [],
            recent_searches: profile.recent_searches ? profile.recent_searches : [],
            recent_tags: profile.recent_tags ? profile.recent_tags : []
        }
    }));

    setProfile(profiles[0]);
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user) {
      await fetchUserRoles(user.id);
    }
  }, [user, fetchUserRoles]);

  const refreshProfileData = useCallback(async () => {
    if(user){
      await fetchProfile(user.id);
    }
    
  }, [user, fetchProfile]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoles(session.user.id);
        fetchProfile(session.user.id);
      } else {
        setIsBusinessOwner(false);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserRoles, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isBusinessOwner, loading, signOut, refreshRoles, profile, refreshProfileData}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};