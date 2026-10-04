/**
 * Hand-written placeholder matching the schema in supabase/migrations.
 * Replace by running:
 *   supabase gen types typescript --project-id <id> > src/types/database.ts
 * Do not hand-edit after that point.
 */

export type PaymentStatus = "pending" | "partial" | "paid";
export type ProfileRole = "superadmin" | "admin" | "pending" | "surveyor";
export type CaseFileKind = "photo" | "document" | "report";
export type StatusStage =
  | "intimated"
  | "case_created"
  | "deputed"
  | "status_report_sent"
  | "call_for_document"
  | "documents_pending"
  | "draft_report"
  | "under_review"
  | "submitted"
  | "closed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: ProfileRole;
          email: string | null;
          phone: string | null;
          license_no: string | null;
          profile_image: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: ProfileRole;
          email?: string | null;
          phone?: string | null;
          license_no?: string | null;
          profile_image?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      cases: {
        Row: {
          id: string;
          insurer_name: string;
          insurance_type: string;
          policy_category: string;
          policy_no: string;
          claim_no: string;
          date_of_accident: string;
          case_reference_no: string;
          intimation_date: string;
          assigned_surveyor_id: string | null;
          deputed_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          insurer_name: string;
          insurance_type: string;
          policy_category: string;
          policy_no: string;
          claim_no: string;
          date_of_accident: string;
          case_reference_no: string;
          intimation_date?: string;
          assigned_surveyor_id?: string | null;
          deputed_date?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
        Relationships: [];
      };
      insureds: {
        Row: {
          id: string;
          insured_name: string;
          insured_company: string | null;
          case_id: string;
        };
        Insert: {
          id?: string;
          insured_name: string;
          insured_company?: string | null;
          case_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["insureds"]["Insert"]>;
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          vehicle_no: string;
          vehicle_registration_date: string | null;
          vehicle_type: string | null;
          vehicle_category: string | null;
          vehicle_owner: string | null;
          case_id: string;
        };
        Insert: {
          id?: string;
          vehicle_no: string;
          vehicle_registration_date?: string | null;
          vehicle_type?: string | null;
          vehicle_category?: string | null;
          vehicle_owner?: string | null;
          case_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          driver_name: string;
          vehicle_id: string;
          driving_license: string | null;
        };
        Insert: {
          id?: string;
          driver_name: string;
          vehicle_id: string;
          driving_license?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
        Relationships: [];
      };
      visits: {
        Row: {
          case_id: string;
          visit_no: number;
          visit_date: string;
          surveyor_id: string | null;
          site_address: string | null;
          remarks: string | null;
          created_at: string;
        };
        Insert: {
          case_id: string;
          visit_date: string;
          surveyor_id?: string | null;
          site_address?: string | null;
          remarks?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["visits"]["Insert"]>;
        Relationships: [];
      };
      statuses: {
        Row: {
          case_id: string;
          status_no: number;
          stage: StatusStage;
          status_date: string;
          surveyor_id: string | null;
          status_remarks: string | null;
          created_at: string;
        };
        Insert: {
          case_id: string;
          stage: StatusStage;
          status_date: string;
          surveyor_id?: string | null;
          status_remarks?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["statuses"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          case_id: string;
          amount: number;
          payment_status: PaymentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          amount: number;
          payment_status?: PaymentStatus;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      case_files: {
        Row: {
          id: string;
          case_id: string;
          kind: CaseFileKind;
          storage_path: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          case_id: string;
          kind: CaseFileKind;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["case_files"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
