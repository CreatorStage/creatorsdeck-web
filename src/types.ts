/**
 * Shared Type Definitions for Plataforma de Criação de Conteúdo para Creators
 */

export interface User {
  id: string;
  name: string;
  username: string;
  createdAt: string;
}

export interface UserSettingsResponse {
  userId: string;
  theme: string;
  preferredLanguage: string;
  profileBio?: string;
}

export interface ChannelResponse extends Channel {
  deletedAt?: string;
}

export interface ChannelReferenceLinkResponse extends ChannelReferenceLink {
}

export interface VideoIdeaResponse extends VideoIdea {
  deletedAt?: string;
}

export interface ReferenceResponse extends Reference {
  imageId?: string;
}

export interface NoteResponse extends Note {
}

export interface VideoScriptResponse extends VideoScript {
  deletedAt?: string;
}

export interface ScriptVersionResponse extends ScriptVersion {
}

export interface GoalResponse extends Goal {
}

export interface UploadResponse {
  url: string;
}

export interface Channel {
  id: string;
  userId: string;
  name: string;
  niche: string;
  ctaTemplates?: string[];
  descriptionBlocks?: string;
  checklistTemplates?: string;
  createdAt: string;
  ideasCount?: number;
}

export interface ChannelReferenceLink {
  id: string;
  channelId: string;
  title: string;
  url: string;
  note?: string;
  thumbnailUrl?: string;
  type?: 'LINK' | 'THUMBNAIL' | 'TITLE';
  createdAt: string;
}

export interface SuggestedVideo {
  id: string;
  channelId: string;
  title: string;
  url: string;
  sourceChannelName?: string;
  sourceChannelUrl?: string;
  views?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export type VideoIdeaStatus = 'IDEA' | 'RESEARCHING' | 'SCRIPTING' | 'READY_TO_RECORD' | 'RECORDED' | 'EDITING' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface VideoIdea {
  id: string;
  channelId: string;
  mainTitle: string;
  description: string;
  status: VideoIdeaStatus;
  tags: string[];
  alternativeTitles: string[];
  deadline?: string;
  evergreen?: boolean;
  trend?: boolean;
  sponsored?: boolean;
  checklistState?: string;
  sponsorBrand?: string;
  sponsorDeadline?: string;
  sponsorTrackingUrl?: string;
  sponsorValue?: number;
  sponsorPaymentStatus?: string;
  publishedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DescriptionBlock {
  id: string;
  label: string;
  content: string;
}

export interface ChecklistTemplate {
  status: VideoIdeaStatus;
  items: string[];
}

export interface ChecklistStateEntry {
  completed: string[];
  skipped: string[];
}

export type ChecklistState = Record<string, ChecklistStateEntry>;

export type SponsorPaymentStatus = "PENDING" | "INVOICED" | "PAID";

export interface Goal {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  deadline?: string;
  completed: boolean;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  theme: string;
  preferredLanguage: string;
  profileBio?: string;
}

export type ReferenceType = 'LINK' | 'IMAGE';

export interface Reference {
  id: string;
  videoIdeaId: string;
  type: ReferenceType;
  url: string; // Url of link or base64 / path of uploaded thumbnail
  label: string;
  createdAt: string;
}

export interface Note {
  id: string;
  videoIdeaId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoScript {
  id: string;
  videoIdeaId: string;
  content: string; // Markdown text
  contentType: 'MARKDOWN' | 'RICH_TEXT';
  wordCount: number;
  estimatedDurationSeconds: number;
  updatedAt: string;
}

export interface ScriptVersion {
  id: string;
  videoIdeaId: string;
  content: string;
  contentType: 'MARKDOWN' | 'RICH_TEXT';
  wordCount: number;
  estimatedDurationSeconds: number;
  label: string;
  createdAt: string;
}

export interface Thumbnail {
  id: string;
  videoIdeaId: string;
  imageUrl: string;
  label: string;
  createdAt: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export type WorkspaceTab = "overview" | "description" | "simulator" | "references" | "notes" | "script" | "teleprompter" | "audio";
