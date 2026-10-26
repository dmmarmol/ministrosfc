import type { ApprovalDecisionType } from "./user";

export interface RelatedPlayerSuggestion {
  playerId: string;
  firstName: string;
  lastName: string;
  status: string;
  matchScore: number;
  matchReasons: string[];
}

export interface PendingApprovalQueueItem {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  submittedAt: string;
  updatedAt: string;
  suggestions: RelatedPlayerSuggestion[];
}

export interface OrphanPlayerItem {
  playerId: string;
  firstName: string;
  lastName: string;
  status: string;
}

export interface MergeResolution {
  userId: string;
  playerId: string | null;
  decisionType: ApprovalDecisionType;
  approvedAt: string;
  approvedBy: string;
}
