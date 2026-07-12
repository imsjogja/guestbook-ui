import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
  Copy,
  ChevronDown,
  FileText,
  MessageCircle,
  Mail,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplates } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

const availableVariables = [
  { key: '{{nama_tamu}}', label: 'Nama Tamu' },
  { key: '{{nama_depan}}', label: 'Nama Depan' },
  { key: '{{nama_acara}}', label: 'Nama Acara' },
  { key: '{{tanggal_acara}}', label: 'Tanggal Acara' },
  { key: '{{waktu_acara}}', label: 'Waktu Acara' },
  { key: '{{lokasi}}', label: 'Lokasi' },
  { key: '{{alamat}}', label: 'Alamat' },
  { key: '{{qr_code}}', label: 'QR Code' },
  { key: '{{link_rsvp}}', label: 'Link RSVP' },
  { key: '{{nama_pengirim}}', label: 'Nama Pengirim' },
];

function highlightVariables(text: string) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    if (part.match(/\{\{[^}]+\}\}/)) {
      return (
        <span
          key={i}
          className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#eef2ff] text-[#4f46e5] mx-0.5"
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function TemplateKomunikasi() {
  const { templates, isLoading, error, refetch, createTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<import('@/types').Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<import('@/types').Template | null>(null);
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formChannel, setFormChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');

  const filteredTemplates = channelFilter === 'all'
    ? templates
    : templates.filter((t) => t.channel === channelFilter);

  const resetForm = () => {
    setFormName('');
    setFormChannel('whatsapp');
    setFormSubject('');
    setFormBody('');
    setEditingTemplate(null);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (t: import('@/types').Template) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormChannel(t.channel as 'whatsapp' | 'email');
    setFormSubject(t.subject || '');
    setFormBody(t.body);
    setIsCreateOpen(true);
  };

  const openPreview = (t: import('@/types').Template) => {
    setPreviewTemplate(t);
    setIsPreviewOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formBody.trim()) {
      toast.error('Nama template dan isi pesan wajib diisi');
      return;
    }

    const varMatches = formBody.match(/\{\{[^}]+\}\}/g) || [];
    const uniqueVars = [...new Set(varMatches)];

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          name: formName,
          channel: formChannel,
          subject: formSubject,
          body: formBody,
          variables: uniqueVars,
        });
        toast.success('Template berhasil diperbarui');
      } else {
        await createTemplate({
          name: formName,
          channel: formChannel,
          subject: formSubject,
          body: formBody,
          variables: uniqueVars,
          category: 'custom',
          isActive: true,
        });
        toast.success('Template berhasil dibuat');
      }
      setIsCreateOpen(false);
      resetForm();
    } catch {
      toast.error(editingTemplate ? 'Gagal memperbarui template' : 'Gagal membuat template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteTemplate(id);
      if (success) {
        toast.success('Template berhasil dihapus');
      }
    } catch {
      toast.error('Gagal menghapus template');
    }
  };

  const insertVariable = (variable: string) => {
    setFormBody((prev) => prev + variable + ' ');
    setShowVarDropdown(false);
  };

  const handleDuplicate = async (t: import('@/types').Template) => {
    try {
      await createTemplate({
        name: `${t.name} (Salinan)`,
        channel: t.channel,
        subject: t.subject,
        body: t.body,
        variables: t.variables,
        category: t.category,
        isActive: true,
      });
      toast.success('Template berhasil diduplikasi');
    } catch {
      toast.error('Gagal menduplikasi template');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle size={48} className="text-[#f43f5e] mb-4" />
        <p className="text-[#0f172a] dark:text-[#f8fafc] font-medium mb-2">Gagal memuat template</p>
        <p className="text-sm text-[#64748b] mb-4">{error}</p>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[2.25rem] font-bold text-[#0f172a] dark:text-[#f8fafc]">Template Pesan</h1>
          <p className="text-sm text-[#64748b] mt-1">Kelola template pesan untuk WhatsApp dan Email</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[160px] h-10 border-[#e2e8f0] dark:border-[#334155]">
              <SelectValue placeholder="Semua Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Channel</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b]"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Ekspor</span>
          </Button>
          <Button
            onClick={openCreate}
            className="h-10 gap-2 bg-[#4f46e5] hover:bg-[#6366f1] text-white"
          >
            <Plus size={16} />
            Buat Template
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-3 w-32 mb-4" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Template Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, delay: index * 0.06, ease: easeOutExpo }}
                  className="group bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-xl p-5 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:border-[#cbd5e1] transition-all duration-150"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[1.125rem] text-[#1e293b] dark:text-[#f8fafc] truncate">
                          {template.name}
                        </h3>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border flex-shrink-0',
                            template.channel === 'whatsapp'
                              ? 'bg-[#d1fae5] text-[#059669] border-[#a7f3d0]'
                              : 'bg-[#dbeafe] text-[#2563eb] border-[#bfdbfe]'
                          )}
                        >
                          {template.channel === 'whatsapp' ? (
                            <MessageCircle size={10} />
                          ) : (
                            <Mail size={10} />
                          )}
                          {template.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                        </span>
                      </div>
                      {template.subject && (
                        <p className="text-[13px] text-[#64748b] italic truncate">{template.subject}</p>
                      )}
                    </div>
                  </div>

                  {/* Preview Area */}
                  <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg p-3 mb-3 max-h-[80px] overflow-hidden relative">
                    <p className="text-[13px] text-[#64748b] leading-relaxed line-clamp-3">
                      {highlightVariables(template.body)}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#f8fafc] dark:from-[#1e293b] to-transparent" />
                  </div>

                  {/* Variables Row */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.variables.map((v) => (
                      <span
                        key={v}
                        className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#eef2ff] text-[#4f46e5]"
                      >
                        {v}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0] dark:border-[#334155]">
                    <span className="text-[12px] text-[#94a3b8]">
                      Dibuat {new Date(template.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPreview(template)}
                        className="p-1.5 rounded-md text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                        title="Pratinjau"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(template)}
                        className="p-1.5 rounded-md text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                        title="Ubah"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(template)}
                        className="p-1.5 rounded-md text-[#64748b] hover:text-[#4f46e5] hover:bg-[#eef2ff] transition-colors"
                        title="Duplikat"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 rounded-md text-[#64748b] hover:text-[#f43f5e] hover:bg-[#ffe4e6] transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTemplates.length === 0 && (
            <div className="bg-white dark:bg-[#151c2c] rounded-xl border border-[#e2e8f0] dark:border-[#334155] p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#eef2ff] dark:bg-[rgba(79,70,229,0.1)] flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-[#4f46e5]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e293b] dark:text-[#f8fafc] mb-2">
                Belum ada template
              </h3>
              <p className="text-sm text-[#64748b] mb-4">
                Buat template pesan pertama Anda untuk memudahkan pengiriman komunikasi.
              </p>
              <Button onClick={openCreate} className="bg-[#4f46e5] hover:bg-[#6366f1] text-white gap-2">
                <Plus size={16} />
                Buat Template
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[1.5rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">
              {editingTemplate ? 'Ubah Template' : 'Buat Template Baru'}
            </DialogTitle>
            <DialogDescription className="text-[#64748b]">
              {editingTemplate ? 'Perbarui detail template pesan Anda.' : 'Buat template pesan baru untuk WhatsApp atau Email.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="template-name" className="text-[#0f172a] dark:text-[#f8fafc]">
                Nama Template <span className="text-[#f43f5e]">*</span>
              </Label>
              <Input
                id="template-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Undangan Pernikahan"
                className="mt-1.5 h-10 border-[#e2e8f0] dark:border-[#334155] focus-visible:ring-[#4f46e5]"
              />
            </div>

            <div>
              <Label htmlFor="channel" className="text-[#0f172a] dark:text-[#f8fafc]">
                Channel <span className="text-[#f43f5e]">*</span>
              </Label>
              <Select
                value={formChannel}
                onValueChange={(v) => setFormChannel(v as 'whatsapp' | 'email')}
              >
                <SelectTrigger className="mt-1.5 h-10 border-[#e2e8f0] dark:border-[#334155]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formChannel === 'email' && (
              <div>
                <Label htmlFor="subject" className="text-[#0f172a] dark:text-[#f8fafc]">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Contoh: Undangan Resmi Pernikahan"
                  className="mt-1.5 h-10 border-[#e2e8f0] dark:border-[#334155] focus-visible:ring-[#4f46e5]"
                />
              </div>
            )}

            <div>
              <Label htmlFor="body" className="text-[#0f172a] dark:text-[#f8fafc]">
                Isi Pesan <span className="text-[#f43f5e]">*</span>
              </Label>
              <div className="mt-1.5 border border-[#e2e8f0] dark:border-[#334155] rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
                  <div className="relative">
                    <button
                      onClick={() => setShowVarDropdown(!showVarDropdown)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium bg-[#eef2ff] text-[#4f46e5] hover:bg-[#e0e7ff] transition-colors"
                    >
                      Tambah Variabel
                      <ChevronDown size={12} />
                    </button>
                    <AnimatePresence>
                      {showVarDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#151c2c] border border-[#e2e8f0] dark:border-[#334155] rounded-lg shadow-lg z-50 py-1"
                        >
                          {availableVariables.map((v) => (
                            <button
                              key={v.key}
                              onClick={() => insertVariable(v.key)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#64748b] hover:bg-[#f1f5f9] dark:hover:bg-[#1e293b] transition-colors text-left"
                            >
                              <span className="font-mono text-[#4f46e5]">{v.key}</span>
                              <span className="text-[#94a3b8]">— {v.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <Textarea
                  id="body"
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Tulis pesan Anda di sini..."
                  className="min-h-[200px] border-0 rounded-none resize-none focus-visible:ring-0 text-sm"
                />
              </div>
              {formBody && (
                <div className="mt-2 p-3 bg-[#f8fafc] dark:bg-[#1e293b] rounded-lg">
                  <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1.5">Pratinjau Variabel</p>
                  <p className="text-[13px] text-[#64748b] leading-relaxed">
                    {highlightVariables(formBody)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => { setIsCreateOpen(false); resetForm(); }}
              className="border-[#e2e8f0] text-[#64748b]"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="bg-[#4f46e5] hover:bg-[#6366f1] text-white"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {editingTemplate ? 'Simpan Perubahan' : 'Simpan Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-[1.25rem] font-semibold text-[#1e293b] dark:text-[#f8fafc]">
                {previewTemplate?.name}
              </DialogTitle>
              {previewTemplate && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                    previewTemplate.channel === 'whatsapp'
                      ? 'bg-[#d1fae5] text-[#059669] border-[#a7f3d0]'
                      : 'bg-[#dbeafe] text-[#2563eb] border-[#bfdbfe]'
                  )}
                >
                  {previewTemplate.channel === 'whatsapp' ? (
                    <MessageCircle size={10} />
                  ) : (
                    <Mail size={10} />
                  )}
                  {previewTemplate.channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
                </span>
              )}
            </div>
          </DialogHeader>

          {previewTemplate?.channel === 'whatsapp' ? (
            <div className="mt-2 flex justify-center">
              <div className="w-[320px] rounded-[24px] border-8 border-[#1e293b] overflow-hidden bg-[#f0f2f5]">
                <div className="bg-[#008069] px-4 py-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">GuestFlow</span>
                </div>
                <div className="p-4 min-h-[200px]">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%]">
                    <p className="text-[13px] text-[#1e293b] leading-relaxed whitespace-pre-wrap">
                      {highlightVariables(previewTemplate.body)}
                    </p>
                    <span className="text-[10px] text-[#94a3b8] mt-1 block text-right">09:00</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              {previewTemplate?.subject && (
                <div className="flex gap-2 text-[13px]">
                  <span className="text-[#94a3b8] w-14 flex-shrink-0">Subject:</span>
                  <span className="text-[#1e293b] dark:text-[#f8fafc] font-medium">
                    {highlightVariables(previewTemplate.subject)}
                  </span>
                </div>
              )}
              <div className="flex gap-2 text-[13px]">
                <span className="text-[#94a3b8] w-14 flex-shrink-0">From:</span>
                <span className="text-[#64748b]">GuestFlow &lt;noreply@guestflow.id&gt;</span>
              </div>
              <div className="flex gap-2 text-[13px]">
                <span className="text-[#94a3b8] w-14 flex-shrink-0">To:</span>
                <span className="text-[#64748b]">tamu@email.com</span>
              </div>
              <div className="border-t border-[#e2e8f0] dark:border-[#334155] pt-3">
                <p className="text-[13px] text-[#1e293b] dark:text-[#f8fafc] leading-relaxed whitespace-pre-wrap">
                  {highlightVariables(previewTemplate?.body || '')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
