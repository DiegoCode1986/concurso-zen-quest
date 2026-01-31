export type StudyStatus = 'not_started' | 'in_progress' | 'completed' | 'review';
export type StudyPriority = 'low' | 'medium' | 'high';

export interface StudyProgress {
  id: string;
  user_id: string;
  folder_id: string;
  status: StudyStatus;
  priority: StudyPriority;
  last_studied_at: string | null;
  study_sessions: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderWithProgress {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  progress?: StudyProgress;
}

export interface SubjectWithTopics {
  id: string;
  name: string;
  description: string | null;
  topics: FolderWithProgress[];
  completedCount: number;
  totalCount: number;
}
