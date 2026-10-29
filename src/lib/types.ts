export type RecordRow = { id: string; [key: string]: any }
export type Workspace = { [table: string]: RecordRow[] }
export const tables = ['profiles','user_roles','classes','sections','enrollments','assignments','assignment_sections','assignment_requirements','rubric_criteria','groups','group_members','group_invitations','projects','proposals','submission_versions','submission_members','submission_files','analysis_runs','analysis_findings','evaluations','evaluation_scores','individual_results','review_comments','notifications','audit_events'] as const
export const categories = ['Messaging Application','Spreadsheet Application','Presentation Editor','E-commerce','Dashboard','Portfolio','Custom Web Application']
export const defaultRubric = [
  { title: 'Required functionality', max_marks: 30, individual: false },
  { title: 'Code quality and structure', max_marks: 20, individual: false },
  { title: 'UI and responsiveness', max_marks: 20, individual: false },
  { title: 'Data handling and security', max_marks: 10, individual: false },
  { title: 'Documentation and deployment', max_marks: 10, individual: false },
  { title: 'Viva and understanding', max_marks: 10, individual: true },
]
