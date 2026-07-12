import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Template, ApiResponse } from '@/types';

export interface UseTemplatesReturn {
  templates: Template[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createTemplate: (data: Partial<Template>) => Promise<Template | null>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<Template | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<Template[]>>('/templates');
      setTemplates(res.data.data || []);
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
      const res = await api.post<ApiResponse<Template>>('/templates', data);
      const newTemplate = res.data.data;
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
      const res = await api.patch<ApiResponse<Template>>(`/templates/${id}`, data);
      const updated = res.data.data;
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

  return { templates, isLoading, error, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate };
}
