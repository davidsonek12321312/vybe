
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "cities": {
                  Row: {
                    "country_code": string,"created_at": string,"id": string,"is_active": boolean,"name": string,"slug": string,"time_zone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country_code": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"slug": string,"time_zone": string,"updated_at"?: string
                  }
                  Update: {
                    "country_code"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"slug"?: string,"time_zone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"events": {
                  Row: {
                    "accessibility_notes": string | null,"age_restriction": number | null,"area": string,"cancellation_note": string | null,"category": Database["public"]['Enums']["event_category"],"change_note": string | null,"city_id": string,"cover_image_url": string | null,"created_at": string,"description": string,"ends_at": string,"id": string,"languages": (string)[],"maps_url": string | null,"material_changed_at": string | null,"organizer_name": string,"payment_note": string | null,"price_type": Database["public"]['Enums']["event_price_type"],"price_vnd": number | null,"published_at": string | null,"registration_url": string | null,"slug": string,"solo_details": string | null,"solo_friendly": boolean,"starts_at": string,"status": Database["public"]['Enums']["event_status"],"title": string,"updated_at": string,"venue_address": string | null,"venue_name": string | null,"venue_status": Database["public"]['Enums']["event_venue_status"],"what_to_expect": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accessibility_notes"?: string | null,"age_restriction"?: number | null,"area": string,"cancellation_note"?: string | null,"category": Database["public"]['Enums']["event_category"],"change_note"?: string | null,"city_id": string,"cover_image_url"?: string | null,"created_at"?: string,"description": string,"ends_at": string,"id"?: string,"languages": (string)[],"maps_url"?: string | null,"material_changed_at"?: string | null,"organizer_name": string,"payment_note"?: string | null,"price_type": Database["public"]['Enums']["event_price_type"],"price_vnd"?: number | null,"published_at"?: string | null,"registration_url"?: string | null,"slug": string,"solo_details"?: string | null,"solo_friendly"?: boolean,"starts_at": string,"status"?: Database["public"]['Enums']["event_status"],"title": string,"updated_at"?: string,"venue_address"?: string | null,"venue_name"?: string | null,"venue_status"?: Database["public"]['Enums']["event_venue_status"],"what_to_expect"?: string | null
                  }
                  Update: {
                    "accessibility_notes"?: string | null,"age_restriction"?: number | null,"area"?: string,"cancellation_note"?: string | null,"category"?: Database["public"]['Enums']["event_category"],"change_note"?: string | null,"city_id"?: string,"cover_image_url"?: string | null,"created_at"?: string,"description"?: string,"ends_at"?: string,"id"?: string,"languages"?: (string)[],"maps_url"?: string | null,"material_changed_at"?: string | null,"organizer_name"?: string,"payment_note"?: string | null,"price_type"?: Database["public"]['Enums']["event_price_type"],"price_vnd"?: number | null,"published_at"?: string | null,"registration_url"?: string | null,"slug"?: string,"solo_details"?: string | null,"solo_friendly"?: boolean,"starts_at"?: string,"status"?: Database["public"]['Enums']["event_status"],"title"?: string,"updated_at"?: string,"venue_address"?: string | null,"venue_name"?: string | null,"venue_status"?: Database["public"]['Enums']["event_venue_status"],"what_to_expect"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "event_category": "social"|"beach_outdoors"|"sports_fitness"|"food_drink"|"language_exchange"|"arts_culture"|"workshops"|"nightlife","event_price_type": "free"|"paid","event_status": "draft"|"published"|"cancelled"|"archived","event_venue_status": "confirmed"|"tbc"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "event_category": ["social", "beach_outdoors", "sports_fitness", "food_drink", "language_exchange", "arts_culture", "workshops", "nightlife"],"event_price_type": ["free", "paid"],"event_status": ["draft", "published", "cancelled", "archived"],"event_venue_status": ["confirmed", "tbc"]
          }
        }
} as const
