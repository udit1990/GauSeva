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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          body: string
          created_at: string
          id: string
          metadata: Json | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          body: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          body?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      animal_zones: {
        Row: {
          active_tasks: number | null
          animal_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
        }
        Insert: {
          active_tasks?: number | null
          animal_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
        }
        Update: {
          active_tasks?: number | null
          animal_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      assignment_audit_log: {
        Row: {
          change_type: string
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_volunteer: string | null
          previous_volunteer: string | null
        }
        Insert: {
          change_type?: string
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_volunteer?: string | null
          previous_volunteer?: string | null
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_volunteer?: string | null
          previous_volunteer?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          category_id: string
          category_name: string
          created_at: string
          gaushala_id: string | null
          id: string
          is_custom_amount: boolean
          name: string
          quantity: number
          sku_id: string
          unit: string
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          category_name: string
          created_at?: string
          gaushala_id?: string | null
          id?: string
          is_custom_amount?: boolean
          name: string
          quantity?: number
          sku_id: string
          unit?: string
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          category_name?: string
          created_at?: string
          gaushala_id?: string | null
          id?: string
          is_custom_amount?: boolean
          name?: string
          quantity?: number
          sku_id?: string
          unit?: string
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          amount: number
          certificate_number: string
          certificate_type: string
          created_at: string
          donor_email: string | null
          donor_name: string
          donor_pan: string | null
          emailed_at: string | null
          id: string
          issued_at: string
          order_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          certificate_number: string
          certificate_type?: string
          created_at?: string
          donor_email?: string | null
          donor_name: string
          donor_pan?: string | null
          emailed_at?: string | null
          id?: string
          issued_at?: string
          order_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          certificate_number?: string
          certificate_type?: string
          created_at?: string
          donor_email?: string | null
          donor_name?: string
          donor_pan?: string | null
          emailed_at?: string | null
          id?: string
          issued_at?: string
          order_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      gaushala_change_requests: {
        Row: {
          created_at: string
          current_gaushala_id: string | null
          id: string
          reason: string | null
          requested_gaushala_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          created_at?: string
          current_gaushala_id?: string | null
          id?: string
          reason?: string | null
          requested_gaushala_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          created_at?: string
          current_gaushala_id?: string | null
          id?: string
          reason?: string | null
          requested_gaushala_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gaushala_change_requests_current_gaushala_id_fkey"
            columns: ["current_gaushala_id"]
            isOneToOne: false
            referencedRelation: "gaushalas_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gaushala_change_requests_requested_gaushala_id_fkey"
            columns: ["requested_gaushala_id"]
            isOneToOne: false
            referencedRelation: "gaushalas_list"
            referencedColumns: ["id"]
          },
        ]
      }
      gaushalas_list: {
        Row: {
          city: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_visit_ready: boolean
          lat: number | null
          lng: number | null
          name: string
          sort_order: number
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_visit_ready?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          sort_order?: number
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_visit_ready?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          sort_order?: number
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_evidence: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          caption: string | null
          created_at: string
          expires_at: string | null
          file_hash: string | null
          id: string
          media_type: string
          order_id: string
          rejection_reason: string | null
          status: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          expires_at?: string | null
          file_hash?: string | null
          id?: string
          media_type?: string
          order_id: string
          rejection_reason?: string | null
          status?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          caption?: string | null
          created_at?: string
          expires_at?: string | null
          file_hash?: string | null
          id?: string
          media_type?: string
          order_id?: string
          rejection_reason?: string | null
          status?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_evidence_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          category_id: string | null
          id: string
          is_custom_amount: boolean
          order_id: string
          quantity: number
          sku_id: string | null
          sku_name: string
          total_price: number
          unit_price: number
        }
        Insert: {
          category_id?: string | null
          id?: string
          is_custom_amount?: boolean
          order_id: string
          quantity?: number
          sku_id?: string | null
          sku_name: string
          total_price: number
          unit_price: number
        }
        Update: {
          category_id?: string | null
          id?: string
          is_custom_amount?: boolean
          order_id?: string
          quantity?: number
          sku_id?: string | null
          sku_name?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "seva_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          animal_type: string | null
          assigned_volunteer: string | null
          created_at: string
          donor_email: string | null
          donor_name: string
          donor_pan: string | null
          donor_phone: string
          expected_completion_at: string | null
          gaushala_id: string | null
          gift_message: string | null
          gift_recipient_name: string | null
          gift_recipient_phone: string | null
          guest_token: string | null
          id: string
          is_gift: boolean
          payment_method: string | null
          persona: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
          volunteer_notes: string | null
        }
        Insert: {
          animal_type?: string | null
          assigned_volunteer?: string | null
          created_at?: string
          donor_email?: string | null
          donor_name: string
          donor_pan?: string | null
          donor_phone: string
          expected_completion_at?: string | null
          gaushala_id?: string | null
          gift_message?: string | null
          gift_recipient_name?: string | null
          gift_recipient_phone?: string | null
          guest_token?: string | null
          id?: string
          is_gift?: boolean
          payment_method?: string | null
          persona?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id?: string | null
          volunteer_notes?: string | null
        }
        Update: {
          animal_type?: string | null
          assigned_volunteer?: string | null
          created_at?: string
          donor_email?: string | null
          donor_name?: string
          donor_pan?: string | null
          donor_phone?: string
          expected_completion_at?: string | null
          gaushala_id?: string | null
          gift_message?: string | null
          gift_recipient_name?: string | null
          gift_recipient_phone?: string | null
          guest_token?: string | null
          id?: string
          is_gift?: boolean
          payment_method?: string | null
          persona?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
          volunteer_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_gaushala_id_fkey"
            columns: ["gaushala_id"]
            isOneToOne: false
            referencedRelation: "gaushalas_list"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          purpose: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          purpose?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gaushala_id: string | null
          id: string
          is_available: boolean
          pan: string | null
          persona_preference: string | null
          phone: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gaushala_id?: string | null
          id: string
          is_available?: boolean
          pan?: string | null
          persona_preference?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gaushala_id?: string | null
          id?: string
          is_available?: boolean
          pan?: string | null
          persona_preference?: string | null
          phone?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_gaushala_id_fkey"
            columns: ["gaushala_id"]
            isOneToOne: false
            referencedRelation: "gaushalas_list"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_order_id: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_order_id?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_order_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_order_id_fkey"
            columns: ["referred_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      seva_categories: {
        Row: {
          animal_type: string
          created_at: string
          description: string
          evidence_requirements: Json | null
          icon_name: string
          id: string
          image_key: string
          is_active: boolean
          persona_visibility: string
          sort_order: number
          subtitle: string
          subtitle_hi: string | null
          title: string
          title_hi: string | null
          updated_at: string
        }
        Insert: {
          animal_type?: string
          created_at?: string
          description: string
          evidence_requirements?: Json | null
          icon_name?: string
          id: string
          image_key: string
          is_active?: boolean
          persona_visibility?: string
          sort_order?: number
          subtitle: string
          subtitle_hi?: string | null
          title: string
          title_hi?: string | null
          updated_at?: string
        }
        Update: {
          animal_type?: string
          created_at?: string
          description?: string
          evidence_requirements?: Json | null
          icon_name?: string
          id?: string
          image_key?: string
          is_active?: boolean
          persona_visibility?: string
          sort_order?: number
          subtitle?: string
          subtitle_hi?: string | null
          title?: string
          title_hi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seva_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_key: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_key: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_key?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      seva_subscriptions: {
        Row: {
          amount: number
          cancelled_at: string | null
          created_at: string
          frequency: string
          gaushala_id: string | null
          id: string
          paused_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          frequency?: string
          gaushala_id?: string | null
          id?: string
          paused_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          cancelled_at?: string | null
          created_at?: string
          frequency?: string
          gaushala_id?: string | null
          id?: string
          paused_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seva_subscriptions_gaushala_id_fkey"
            columns: ["gaushala_id"]
            isOneToOne: false
            referencedRelation: "gaushalas_list"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          animal_type: string
          category_id: string
          created_at: string
          description: string | null
          description_hi: string | null
          id: string
          image_key: string | null
          is_active: boolean
          max_qty: number
          min_qty: number
          name: string
          persona_visibility: string
          price: number
          sort_order: number
          title_hi: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          animal_type?: string
          category_id: string
          created_at?: string
          description?: string | null
          description_hi?: string | null
          id?: string
          image_key?: string | null
          is_active?: boolean
          max_qty?: number
          min_qty?: number
          name: string
          persona_visibility?: string
          price: number
          sort_order?: number
          title_hi?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          animal_type?: string
          category_id?: string
          created_at?: string
          description?: string | null
          description_hi?: string | null
          id?: string
          image_key?: string | null
          is_active?: boolean
          max_qty?: number
          min_qty?: number
          name?: string
          persona_visibility?: string
          price?: number
          sort_order?: number
          title_hi?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skus_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "seva_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_bookings: {
        Row: {
          assigned_volunteer: string | null
          created_at: string
          gaushala_id: string
          id: string
          num_visitors: number
          status: string
          time_slot: string
          updated_at: string
          user_id: string
          visit_date: string
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string
          volunteer_notes: string | null
        }
        Insert: {
          assigned_volunteer?: string | null
          created_at?: string
          gaushala_id: string
          id?: string
          num_visitors?: number
          status?: string
          time_slot: string
          updated_at?: string
          user_id: string
          visit_date: string
          visitor_email?: string | null
          visitor_name: string
          visitor_phone: string
          volunteer_notes?: string | null
        }
        Update: {
          assigned_volunteer?: string | null
          created_at?: string
          gaushala_id?: string
          id?: string
          num_visitors?: number
          status?: string
          time_slot?: string
          updated_at?: string
          user_id?: string
          visit_date?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string
          volunteer_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_bookings_gaushala_id_fkey"
            columns: ["gaushala_id"]
            isOneToOne: false
            referencedRelation: "gaushalas_list"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_guest_order: {
        Args: { _guest_token: string; _order_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "volunteer"
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
  public: {
    Enums: {
      app_role: ["admin", "user", "volunteer"],
    },
  },
} as const
