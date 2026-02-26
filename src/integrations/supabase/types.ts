export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          category: Database["public"]["Enums"]["business_category"]
          contact_info: Json | null
          created_at: string
          deal: string | null
          description: string | null
          hours_of_operation: Json | null
          id: string
          is_featured: boolean
          location: Database["public"]["Enums"]["location"] | null
          logo_url: string | null
          most_popular_products: string[] | null
          name: string
          owner_id: string
          price_range: number[] | null
          tags: string[] | null
          updated_at: string
          user_views: number | null
          find_business: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["business_category"]
          contact_info?: Json | null
          created_at?: string
          deal?: string | null
          description?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_featured?: boolean
          location?: Database["public"]["Enums"]["location"] | null
          logo_url?: string | null
          most_popular_products?: string[] | null
          name: string
          owner_id: string
          price_range?: number[] | null
          tags?: string[] | null
          updated_at?: string
          user_views?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["business_category"]
          contact_info?: Json | null
          created_at?: string
          deal?: string | null
          description?: string | null
          hours_of_operation?: Json | null
          id?: string
          is_featured?: boolean
          location?: Database["public"]["Enums"]["location"] | null
          logo_url?: string | null
          most_popular_products?: string[] | null
          name?: string
          owner_id?: string
          price_range?: number[] | null
          tags?: string[] | null
          updated_at?: string
          user_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          business_id: string | null
          created_at: string
          description: string
          end_date: string
          id: string
          start_date: string
          title: string
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description: string
          end_date: string
          id?: string
          start_date: string
          title: string
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          start_date?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          id: string
          images: string | null
          is_favorite: boolean
          is_service: boolean
          price: number
          product_name: string
          updated_at: string
          user_views: number | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          images?: string | null
          is_favorite?: boolean
          is_service?: boolean
          price: number
          product_name: string
          updated_at?: string
          user_views?: number | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          images?: string | null
          is_favorite?: boolean
          is_service?: boolean
          price?: number
          product_name?: string
          updated_at?: string
          user_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_id: string | null
          created_at: string
          favorite_businesses: string[] | null
          favorite_products: string[] | null
          full_name: string
          id: string
          recent_searches: string[] | null
          recent_tags: string[] | null
          recently_viewed_businesses: string[] | null
          reviews: string[] | null
          student_email: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_id?: string | null
          created_at?: string
          favorite_businesses?: string[] | null
          favorite_products?: string[] | null
          full_name: string
          id: string
          recent_searches?: string[] | null
          recent_tags?: string[] | null
          recently_viewed_businesses?: string[] | null
          reviews?: string[] | null
          student_email: string
          updated_at?: string
          username?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_id?: string | null
          created_at?: string
          favorite_businesses?: string[] | null
          favorite_products?: string[] | null
          full_name?: string
          id?: string
          recent_searches?: string[] | null
          recent_tags?: string[] | null
          recently_viewed_businesses?: string[] | null
          reviews?: string[] | null
          student_email?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string
          id: string
          is_anon: boolean
          rating: number
          user_id: string
          username: string
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_anon?: boolean
          rating: number
          user_id: string
          username?: string
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_anon?: boolean
          rating?: number
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_business: {
        Args: { "": Database["public"]["Tables"]["businesses"]["Row"] }
        Returns: {
          error: true
        } & "the function public.find_business with parameter or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache"
      }
    }
    Enums: {
      app_role: "owner" | "consumer"
      business_category:
        | "Hair"
        | "Beauty"
        | "Clothing"
        | "Food"
        | "Entertainment"
        | "Services"
        | "Tutoring"
        | "Creative"
        | "Tech"
        | "Consumer Goods"
        | "None"
      location:
        | "Drew Hall"
        | "College Hall North"
        | "College Hall South"
        | "Annex"
        | "Cook Hall"
        | "Towers - West"
        | "Towers - East"
        | "Quad"
        | "Axis"
        | "Other"
        | "Contact Owner for Details"
        | "Off Campus - Maryland"
        | "Off Campus - Virginia"
        | "Off Campus - District of Columbia"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "consumer"],
      business_category: [
        "Hair",
        "Beauty",
        "Clothing",
        "Food",
        "Entertainment",
        "Services",
        "Tutoring",
        "Creative",
        "Tech",
        "Consumer Goods",
        "None",
      ],
      location: [
        "Drew Hall",
        "College Hall North",
        "College Hall South",
        "Annex",
        "Cook Hall",
        "Towers - West",
        "Towers - East",
        "Quad",
        "Axis",
        "Other",
        "Contact Owner for Details",
        "Off Campus - Maryland",
        "Off Campus - Virginia",
        "Off Campus - District of Columbia",
      ],
    },
  },
} as const
