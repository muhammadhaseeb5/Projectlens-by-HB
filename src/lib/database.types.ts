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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analysis_findings: {
        Row: {
          explanation: string
          id: string
          line: number | null
          path: string
          rule: string
          run_id: string
          severity: string
          suggestion: string
        }
        Insert: {
          explanation: string
          id?: string
          line?: number | null
          path: string
          rule: string
          run_id: string
          severity: string
          suggestion: string
        }
        Update: {
          explanation?: string
          id?: string
          line?: number | null
          path?: string
          rule?: string
          run_id?: string
          severity?: string
          suggestion?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_findings_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "analysis_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_runs: {
        Row: {
          checked: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          skipped: number
          status: string
          version_id: string
        }
        Insert: {
          checked?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          skipped?: number
          status?: string
          version_id: string
        }
        Update: {
          checked?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          skipped?: number
          status?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_runs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: true
            referencedRelation: "submission_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_requirements: {
        Row: {
          assignment_id: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          assignment_id: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          assignment_id?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_requirements_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_sections: {
        Row: {
          assignment_id: string
          deadline: string | null
          id: string
          instructions: string
          section_id: string
        }
        Insert: {
          assignment_id: string
          deadline?: string | null
          id?: string
          instructions?: string
          section_id: string
        }
        Update: {
          assignment_id?: string
          deadline?: string | null
          id?: string
          instructions?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_sections_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_sections_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late: boolean
          allow_resubmit: boolean
          category: string
          class_id: string
          created_at: string
          deadline: string
          description: string
          draft_edit_members: boolean
          id: string
          max_group: number
          min_group: number
          mode: string
          proposal_deadline: string | null
          proposal_required: boolean
          published: boolean
          technologies: string[]
          title: string
        }
        Insert: {
          allow_late?: boolean
          allow_resubmit?: boolean
          category?: string
          class_id: string
          created_at?: string
          deadline: string
          description?: string
          draft_edit_members?: boolean
          id?: string
          max_group?: number
          min_group?: number
          mode?: string
          proposal_deadline?: string | null
          proposal_required?: boolean
          published?: boolean
          technologies?: string[]
          title: string
        }
        Update: {
          allow_late?: boolean
          allow_resubmit?: boolean
          category?: string
          class_id?: string
          created_at?: string
          deadline?: string
          description?: string
          draft_edit_members?: boolean
          id?: string
          max_group?: number
          min_group?: number
          mode?: string
          proposal_deadline?: string | null
          proposal_required?: boolean
          published?: boolean
          technologies?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          class_id: string
          created_at: string
          details: Json
          id: string
          project_id: string | null
          version_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          class_id: string
          created_at?: string
          details?: Json
          id?: string
          project_id?: string | null
          version_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          class_id?: string
          created_at?: string
          details?: Json
          id?: string
          project_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "submission_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          institution: string
          semester: string
          teacher_id: string | null
          timezone: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution?: string
          semester?: string
          teacher_id?: string | null
          timezone?: string
          title?: string
        }
        Update: {
          created_at?: string
          id?: string
          institution?: string
          semester?: string
          teacher_id?: string | null
          timezone?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          ended_at: string | null
          id: string
          roll_number: string
          section_id: string
          started_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          ended_at?: string | null
          id?: string
          roll_number: string
          section_id: string
          started_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          ended_at?: string | null
          id?: string
          roll_number?: string
          section_id?: string
          started_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_section_id_class_id_fkey"
            columns: ["section_id", "class_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id", "class_id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_scores: {
        Row: {
          criterion_id: string
          evaluation_id: string
          id: string
          marks: number
        }
        Insert: {
          criterion_id: string
          evaluation_id: string
          id?: string
          marks: number
        }
        Update: {
          criterion_id?: string
          evaluation_id?: string
          id?: string
          marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "rubric_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          checklist: Json
          comments: string
          decision: string
          evaluated_at: string
          id: string
          improvements: string
          released_at: string | null
          strengths: string
          teacher_id: string
          version_id: string
        }
        Insert: {
          checklist?: Json
          comments?: string
          decision?: string
          evaluated_at?: string
          id?: string
          improvements?: string
          released_at?: string | null
          strengths?: string
          teacher_id: string
          version_id: string
        }
        Update: {
          checklist?: Json
          comments?: string
          decision?: string
          evaluated_at?: string
          id?: string
          improvements?: string
          released_at?: string | null
          strengths?: string
          teacher_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: true
            referencedRelation: "submission_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invitations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          assignment_id: string
          contribution: string
          group_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          contribution?: string
          group_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          contribution?: string
          group_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          leader_id: string
          name: string
          section_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          leader_id: string
          name: string
          section_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          leader_id?: string
          name?: string
          section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_results: {
        Row: {
          evaluation_id: string
          id: string
          marks: number
          private_feedback: string
          reason: string
          student_id: string
        }
        Insert: {
          evaluation_id: string
          id?: string
          marks?: number
          private_feedback?: string
          reason: string
          student_id: string
        }
        Update: {
          evaluation_id?: string
          id?: string
          marks?: number
          private_feedback?: string
          reason?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_results_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assignment_id: string
          category: string
          created_at: string
          description: string
          feature_checklist: Json
          group_id: string | null
          id: string
          limitations: string
          live_url: string
          notes: string
          owner_id: string
          repo_url: string
          section_id: string
          showcased: boolean
          technologies: string[]
          title: string
        }
        Insert: {
          assignment_id: string
          category: string
          created_at?: string
          description?: string
          feature_checklist?: Json
          group_id?: string | null
          id?: string
          limitations?: string
          live_url?: string
          notes?: string
          owner_id: string
          repo_url?: string
          section_id: string
          showcased?: boolean
          technologies?: string[]
          title: string
        }
        Update: {
          assignment_id?: string
          category?: string
          created_at?: string
          description?: string
          feature_checklist?: Json
          group_id?: string | null
          id?: string
          limitations?: string
          live_url?: string
          notes?: string
          owner_id?: string
          repo_url?: string
          section_id?: string
          showcased?: boolean
          technologies?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          body: string
          id: string
          project_id: string
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          id?: string
          project_id: string
          reason?: string
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          project_id?: string
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          line: number | null
          path: string | null
          released: boolean
          version_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          line?: number | null
          path?: string | null
          released?: boolean
          version_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          line?: number | null
          path?: string | null
          released?: boolean
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "submission_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_criteria: {
        Row: {
          assignment_id: string
          id: string
          individual: boolean
          max_marks: number
          sort_order: number
          title: string
        }
        Insert: {
          assignment_id: string
          id?: string
          individual?: boolean
          max_marks: number
          sort_order?: number
          title: string
        }
        Update: {
          assignment_id?: string
          id?: string
          individual?: boolean
          max_marks?: number
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          class_id: string
          id: string
          name: string
        }
        Insert: {
          class_id: string
          id?: string
          name: string
        }
        Update: {
          class_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_files: {
        Row: {
          id: string
          indexed: boolean
          kind: string
          path: string
          size: number
          skip_reason: string | null
          storage_path: string
          version_id: string
        }
        Insert: {
          id?: string
          indexed?: boolean
          kind: string
          path: string
          size: number
          skip_reason?: string | null
          storage_path: string
          version_id: string
        }
        Update: {
          id?: string
          indexed?: boolean
          kind?: string
          path?: string
          size?: number
          skip_reason?: string | null
          storage_path?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_files_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "submission_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_members: {
        Row: {
          contribution: string
          id: string
          name: string
          roll_number: string
          student_id: string
          version_id: string
        }
        Insert: {
          contribution?: string
          id?: string
          name: string
          roll_number: string
          student_id: string
          version_id: string
        }
        Update: {
          contribution?: string
          id?: string
          name?: string
          roll_number?: string
          student_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_members_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "submission_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_versions: {
        Row: {
          change_reason: string
          created_at: string
          id: string
          late: boolean
          project_id: string
          snapshot: Json
          source_processed: boolean
          status: string
          submitted_at: string | null
          submitted_by: string
          version: number
        }
        Insert: {
          change_reason?: string
          created_at?: string
          id?: string
          late?: boolean
          project_id: string
          snapshot: Json
          source_processed?: boolean
          status?: string
          submitted_at?: string | null
          submitted_by: string
          version: number
        }
        Update: {
          change_reason?: string
          created_at?: string
          id?: string
          late?: boolean
          project_id?: string
          snapshot?: Json
          source_processed?: boolean
          status?: string
          submitted_at?: string | null
          submitted_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "submission_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_versions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: string
        }
        Insert: {
          id: string
          role?: string
        }
        Update: {
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_source: {
        Args: {
          p_checked: number
          p_error?: string
          p_files: Json
          p_findings: Json
          p_skipped: number
          p_version: string
        }
        Returns: undefined
      }
      workspace_action: {
        Args: { action: string; payload?: Json }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

