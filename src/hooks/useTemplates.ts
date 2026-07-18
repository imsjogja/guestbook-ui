import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Template, ApiResponse } from '@/types';
import { normalizeTemplate, type BackendTemplate } from '@/lib/normalizers';

type TemplatePayload = {
  name?: string;
  channel?: 'whatsapp' | 'email' | 'sms';
  type?: string;
  subject?: string;
  body?: string;
  variables?: string[];
  description?: string;
  language?: string;
  is_active?: boolean;
};

function toTemplatePayload(data: Partial<Template>): TemplatePayload {
  const payload: TemplatePayload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.channel !== undefined) payload.channel = data.channel === 'both' ? 'whatsapp' : data.channel;
  if (data.category !== undefined) payload.type = data.category;
  if (data.subject !== undefined) payload.subject = data.subject;
  if (data.body !== undefined) payload.body = data.body;
  if (data.variables !== undefined) payload.variables = data.variables;
  if (data.isActive !== undefined) payload.is_active = data.isActive;
  return payload;
}

export interface UseTemplatesReturn {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createTemplate: (data: Partial<Template>) => Promise<Template | null>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  generateDefaultTemplates: () => Promise<Template[]>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<BackendTemplate[]>>('/templates');
      setTemplates((res.data.data || []).map(normalizeTemplate));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat template';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = useCallback(async (data: Partial<Template>): Promise<Template | null> => {
    try {
      const res = await api.post<ApiResponse<BackendTemplate>>('/templates', toTemplatePayload(data));
      const newTemplate = normalizeTemplate(res.data.data);
      setTemplates((prev) => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat template';
      setError(msg);
      return null;
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, data: Partial<Template>): Promise<Template | null> => {
    try {
      const res = await api.patch<ApiResponse<BackendTemplate>>(`/templates/${id}`, toTemplatePayload(data));
      const updated = normalizeTemplate(res.data.data);
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui template';
      setError(msg);
      return null;
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus template';
      setError(msg);
      return false;
    }
  }, []);

  const generateDefaultTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      const res = await api.post<ApiResponse<BackendTemplate[]>>('/templates/defaults');
      const generated = (res.data.data || []).map(normalizeTemplate);
      setTemplates(generated);
      return generated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat template default';
      setError(msg);
      return [];
    }
  }, []);

  return { templates, isLoading, error, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate, generateDefaultTemplates };
}
