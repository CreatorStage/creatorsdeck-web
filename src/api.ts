import { Channel, ChannelReferenceLink, VideoIdea, Reference, Note, VideoScript, ScriptVersion, User, Goal, UserSettings, UserSettingsResponse, UploadResponse } from "./types";

const API_BASE = ""; // Relative URL, proxies automatically because Server and Client run on same port in full-stack setup!

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function getHeaders() {
  const token = localStorage.getItem("creator_auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function requestJson<T>(url: string, options: RequestInit = {}, auth = true): Promise<T> {
  if (auth) {
    const token = localStorage.getItem("creator_auth_token");
    if (!token) {
      unauthorizedHandler?.();
      throw new Error("Sessão expirada. Faça login novamente.");
    }
  }

  const headers: Record<string, string> = auth ? getHeaders() : { "Content-Type": "application/json" };
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = "Erro ao executar requisição";
    try {
      const err = await res.json();
      message = err.error || err.message || message;
    } catch {
      // mantém mensagem padrão
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await requestJson<{ token: string; user: User }>(`${API_BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false);
    return res;
  },

  async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await requestJson<{ token: string; user: User }>(`${API_BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }, false);
    return res;
  },

  async getMe(): Promise<User> {
    return requestJson<User>(`${API_BASE}/api/auth/me`);
  },

  // Channels
  async getChannels(): Promise<Channel[]> {
    return requestJson<Channel[]>(`${API_BASE}/api/channels`);
  },

  async createChannel(name: string, niche: string): Promise<Channel> {
    return requestJson<Channel>(`${API_BASE}/api/channels`, {
      method: "POST",
      body: JSON.stringify({ name, niche }),
    });
  },

  async getChannel(id: string): Promise<Channel> {
    return requestJson<Channel>(`${API_BASE}/api/channels/${id}`);
  },

  async updateChannel(id: string, updates: Partial<Channel>): Promise<Channel> {
    return requestJson<Channel>(`${API_BASE}/api/channels/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async getChannelReferenceLinks(channelId: string): Promise<ChannelReferenceLink[]> {
    return requestJson<ChannelReferenceLink[]>(`${API_BASE}/api/channels/${channelId}/references`);
  },

  async addChannelReferenceLink(channelId: string, title: string, url: string, note: string, thumbnailUrl?: string, type?: 'LINK' | 'THUMBNAIL' | 'TITLE'): Promise<ChannelReferenceLink> {
    return requestJson<ChannelReferenceLink>(`${API_BASE}/api/channels/${channelId}/references`, {
      method: "POST",
      body: JSON.stringify({ title, url, note, thumbnailUrl, type }),
    });
  },

  async deleteChannelReferenceLink(id: string): Promise<boolean> {
    await requestJson<void>(`${API_BASE}/api/channels/reference-links/${id}`, {
      method: "DELETE",
    });
    return true;
  },

  async deleteChannel(id: string, password: string): Promise<boolean> {
    await requestJson<void>(`${API_BASE}/api/channels/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    return true;
  },

  // Ideas
  async getIdeas(channelId: string): Promise<VideoIdea[]> {
    return requestJson<VideoIdea[]>(`${API_BASE}/api/channels/${channelId}/ideas`);
  },

  async createIdea(channelId: string, mainTitle: string, description: string, tags: string[], deadline?: string): Promise<VideoIdea> {
    return requestJson<VideoIdea>(`${API_BASE}/api/channels/${channelId}/ideas`, {
      method: "POST",
      body: JSON.stringify({ mainTitle, description, tags, deadline }),
    });
  },

  async updateIdea(id: string, updates: Partial<VideoIdea>): Promise<VideoIdea> {
    return requestJson<VideoIdea>(`${API_BASE}/api/ideas/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteIdea(id: string): Promise<boolean> {
    await requestJson<void>(`${API_BASE}/api/ideas/${id}`, {
      method: "DELETE",
    });
    return true;
  },

  // References
  async getReferences(ideaId: string): Promise<Reference[]> {
    return requestJson<Reference[]>(`${API_BASE}/api/ideas/${ideaId}/references`);
  },

  async addReference(ideaId: string, type: "LINK" | "IMAGE", url: string, label: string): Promise<Reference> {
    return requestJson<Reference>(`${API_BASE}/api/ideas/${ideaId}/references`, {
      method: "POST",
      body: JSON.stringify({ type, url, label }),
    });
  },

  async deleteReference(id: string): Promise<boolean> {
    await requestJson<void>(`${API_BASE}/api/references/${id}`, {
      method: "DELETE",
    });
    return true;
  },

  // Goals
  async getGoals(channelId: string): Promise<Goal[]> {
    return requestJson<Goal[]>(`${API_BASE}/api/channels/${channelId}/goals`);
  },

  async createGoal(channelId: string, title: string, targetValue?: number, deadline?: string): Promise<Goal> {
    return requestJson<Goal>(`${API_BASE}/api/channels/${channelId}/goals`, {
      method: "POST",
      body: JSON.stringify({ title, targetValue, deadline }),
    });
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    return requestJson<Goal>(`${API_BASE}/api/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteGoal(id: string): Promise<boolean> {
    const res = await requestJson<void>(`${API_BASE}/api/goals/${id}`, {
      method: "DELETE",
    });
    return res === undefined;
  },

  // Settings
  async getSettings(userId: string): Promise<UserSettingsResponse> {
    return requestJson<UserSettingsResponse>(`${API_BASE}/api/settings/${userId}`);
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettingsResponse> {
    return requestJson<UserSettingsResponse>(`${API_BASE}/api/settings/${userId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Notes
  async getNotes(ideaId: string): Promise<Note> {
    return requestJson<Note>(`${API_BASE}/api/ideas/${ideaId}/notes`);
  },

  async saveNotes(ideaId: string, content: string): Promise<Note> {
    return requestJson<Note>(`${API_BASE}/api/ideas/${ideaId}/notes`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  },

  // Script
  async getScript(ideaId: string): Promise<VideoScript> {
    return requestJson<VideoScript>(`${API_BASE}/api/ideas/${ideaId}/script`);
  },

  async saveScript(
    ideaId: string,
    content: string,
    contentType: "MARKDOWN" | "RICH_TEXT",
    wordCount: number,
    estimatedDurationSeconds: number
  ): Promise<VideoScript> {
    return requestJson<VideoScript>(`${API_BASE}/api/ideas/${ideaId}/script`, {
      method: "PUT",
      body: JSON.stringify({ content, contentType, wordCount, estimatedDurationSeconds }),
    });
  },

  async getScriptVersions(ideaId: string): Promise<ScriptVersion[]> {
    return requestJson<ScriptVersion[]>(`${API_BASE}/api/ideas/${ideaId}/script/versions`);
  },

  async createScriptVersion(ideaId: string, label: string): Promise<ScriptVersion> {
    return requestJson<ScriptVersion>(`${API_BASE}/api/ideas/${ideaId}/script/versions`, {
      method: "POST",
      body: JSON.stringify({ label }),
    });
  },

  async restoreScriptVersion(ideaId: string, versionId: string): Promise<VideoScript> {
    return requestJson<VideoScript>(`${API_BASE}/api/ideas/${ideaId}/script/versions/${versionId}/restore`, {
      method: "POST",
    });
  },

  async deleteScriptVersion(ideaId: string, versionId: string): Promise<void> {
    return requestJson<void>(`${API_BASE}/api/ideas/${ideaId}/script/versions/${versionId}`, {
      method: "DELETE",
    });
  },

  // Upload photo as base64 and return URL
  async uploadImage(imageBase64: string, filename: string): Promise<string> {
    const data = await requestJson<UploadResponse>(`${API_BASE}/api/upload`, {
      method: "POST",
      body: JSON.stringify({ imageBase64, filename }),
    });
    return data.url;
  }
};
