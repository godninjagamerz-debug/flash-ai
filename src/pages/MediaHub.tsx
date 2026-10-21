import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Image, FileText, Code2, Download, Trash2, Eye,
  Search, Upload, Sparkles, Copy, Check, HardDrive,
  FolderOpen, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { downloadArtifactFile, type ArtifactData } from '@/components/chat/ArtifactCard';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/db/supabase';

interface UploadedFileItem {
  id: string;
  path: string;
  name: string;
  sizeBytes: number;
  type: string;
  date: string;
}

const PERSONAL_STORAGE_LIMIT = 1024 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  style?: string;
  date: string;
}

export default function MediaHub() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'images' | 'artifacts' | 'uploads'>('artifacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModal, setPreviewModal] = useState<{ open: boolean; item?: any; type?: string }>({ open: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load stored artifacts
  const [artifacts, setArtifacts] = useState<ArtifactData[]>(() => {
    try {
      const raw = localStorage.getItem('flash_artifacts');
      if (raw) return JSON.parse(raw);
    } catch {}
    // Seed initial artifacts if empty
    return [
      {
        id: 'sample-app-tsx',
        title: 'App.tsx (Main Application)',
        language: 'typescript',
        filename: 'App.tsx',
        code: `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="p-8 text-center">\n      <h1 className="text-2xl font-bold">Hello from Flash AI!</h1>\n      <button onClick={() => setCount(c => c + 1)} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">\n        Clicked {count} times\n      </button>\n    </div>\n  );\n}`,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'sample-algo-py',
        title: 'data_analyzer.py',
        language: 'python',
        filename: 'data_analyzer.py',
        code: `import json\nimport statistics\n\ndef analyze_metrics(data_points):\n    avg = statistics.mean(data_points)\n    std_dev = statistics.stdev(data_points) if len(data_points) > 1 else 0\n    return {\n        "count": len(data_points),\n        "mean": round(avg, 2),\n        "std_dev": round(std_dev, 2)\n    }\n\nif __name__ == "__main__":\n    print(analyze_metrics([12.5, 18.2, 14.7, 21.0, 16.3]))`,
        timestamp: Date.now() - 7200000,
      }
    ];
  });

  // Load stored images
  const [images] = useState<GeneratedImageItem[]>(() => {
    try {
      const raw = localStorage.getItem('ai_gallery');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.map((item: any, idx: number) => ({
          id: `img-${idx}`,
          url: item.url || item.thumbnail || '',
          prompt: item.prompt || 'Generated Concept Art',
          style: item.style || 'Digital Art',
          date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
        }));
      }
    } catch {}
    return [
      {
        id: 'img-demo-1',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        prompt: 'Futuristic abstract holographic neural interface, 8k, cyberpunk aesthetic',
        style: 'Cyberpunk',
        date: 'Today',
      },
      {
        id: 'img-demo-2',
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
        prompt: 'Minimalist fluid 3D glass geometry on dark background',
        style: '3D Render',
        date: 'Yesterday',
      }
    ];
  });

  // Load uploaded files
  const [uploads, setUploads] = useState<UploadedFileItem[]>([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isGuest = profile?.id.startsWith('guest_') ?? true;
  const usedStorageBytes = uploads.reduce((total, file) => total + file.sizeBytes, 0);

  const loadCloudUploads = async (userId: string) => {
    setUploadsLoading(true);
    const files: UploadedFileItem[] = [];
    let offset = 0;
    try {
      while (true) {
        const { data, error } = await supabase.storage.from('flash_user_files').list(userId, {
          limit: 100,
          offset,
          sortBy: { column: 'created_at', order: 'desc' },
        });
        if (error) throw error;
        for (const file of data) {
          if (!file.id) continue;
          const path = `${userId}/${file.name}`;
          files.push({
            id: file.id,
            path,
            name: file.name.replace(/^\d+_[a-f0-9]+_/, ''),
            sizeBytes: Number(file.metadata?.size) || 0,
            type: file.metadata?.mimetype || 'application/octet-stream',
            date: file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Recent',
          });
        }
        if (data.length < 100) break;
        offset += data.length;
      }
      setUploads(files);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load cloud files.');
    } finally {
      setUploadsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id && !profile.id.startsWith('guest_')) {
      void loadCloudUploads(profile.id);
    } else {
      setUploads([]);
    }
  }, [profile?.id]);

  // Sync artifacts on change
  useEffect(() => {
    try {
      localStorage.setItem('flash_artifacts', JSON.stringify(artifacts));
    } catch {}
  }, [artifacts]);

  const handleDeleteArtifact = (id: string) => {
    setArtifacts(list => list.filter(a => a.id !== id));
    toast.success('Artifact removed from Hub');
  };

  const handleCopyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = '';
    if (isGuest || !profile?.id) {
      toast.error('Sign in to upload personal files to cloud storage.');
      return;
    }
    const selectedFiles = Array.from(files);
    const selectedBytes = selectedFiles.reduce((total, file) => total + file.size, 0);
    if (usedStorageBytes + selectedBytes > PERSONAL_STORAGE_LIMIT) {
      toast.error(`This upload exceeds your remaining ${formatFileSize(PERSONAL_STORAGE_LIMIT - usedStorageBytes)} of cloud storage.`);
      return;
    }

    setUploading(true);
    let uploadedCount = 0;
    try {
      for (const file of selectedFiles) {
        const safeName = file.name.replace(/[\\/]/g, '_');
        const objectName = `${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${safeName}`;
        const path = `${profile.id}/${objectName}`;
        const { error } = await supabase.storage.from('flash_user_files').upload(path, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });
        if (error) throw error;
        uploadedCount += 1;
      }
      await loadCloudUploads(profile.id);
      toast.success(`${uploadedCount} file${uploadedCount === 1 ? '' : 's'} uploaded to your private cloud storage.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'File upload failed.');
      await loadCloudUploads(profile.id);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadUpload = async (file: UploadedFileItem) => {
    const { data, error } = await supabase.storage.from('flash_user_files').createSignedUrl(file.path, 60);
    if (error || !data) {
      toast.error('Could not create a download link.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteUpload = async (file: UploadedFileItem) => {
    const { error } = await supabase.storage.from('flash_user_files').remove([file.path]);
    if (error) {
      toast.error('Could not remove this file.');
      return;
    }
    setUploads(current => current.filter(item => item.id !== file.id));
    toast.success('File removed from cloud storage.');
  };

  // Filtered items based on search
  const filteredArtifacts = useMemo(() => {
    if (!searchQuery.trim()) return artifacts;
    const q = searchQuery.toLowerCase();
    return artifacts.filter(a => a.title.toLowerCase().includes(q) || a.language.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
  }, [artifacts, searchQuery]);

  const filteredImages = useMemo(() => {
    if (!searchQuery.trim()) return images;
    const q = searchQuery.toLowerCase();
    return images.filter(img => img.prompt.toLowerCase().includes(q) || (img.style && img.style.toLowerCase().includes(q)));
  }, [images, searchQuery]);

  const filteredUploads = useMemo(() => {
    if (!searchQuery.trim()) return uploads;
    const q = searchQuery.toLowerCase();
    return uploads.filter(u => u.name.toLowerCase().includes(q) || u.type.toLowerCase().includes(q));
  }, [uploads, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Top Header ── */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-8 w-8 rounded-lg"
              title="Back to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <FolderOpen className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight leading-none">Media & Files Hub</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Your generated images, artifacts, and uploads</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className={isGuest || uploading ? 'cursor-not-allowed' : 'cursor-pointer'}>
              <input type="file" multiple onChange={handleFileUpload} disabled={isGuest || uploading} className="hidden" />
              <Button size="sm" variant="outline" disabled={isGuest || uploading} className="h-7 px-2.5 text-xs rounded-lg gap-1.5 pointer-events-none">
                <Upload className="w-3 h-3" />
                {uploading ? 'Uploading…' : isGuest ? 'Sign in to upload' : 'Upload File'}
              </Button>
            </label>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="container mx-auto px-4 py-6 max-w-5xl flex-1 flex flex-col">
        {/* Search & Tabs Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full sm:w-auto">
            <TabsList className="bg-muted/60 p-0.5 rounded-xl border border-border/40 grid grid-cols-3 sm:flex">
              <TabsTrigger value="artifacts" className="rounded-lg text-xs gap-1.5 px-3 py-1.5">
                <Code2 className="w-3.5 h-3.5" />
                Artifacts ({artifacts.length})
              </TabsTrigger>
              <TabsTrigger value="images" className="rounded-lg text-xs gap-1.5 px-3 py-1.5">
                <Image className="w-3.5 h-3.5" />
                Images ({images.length})
              </TabsTrigger>
              <TabsTrigger value="uploads" className="rounded-lg text-xs gap-1.5 px-3 py-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                Uploads ({uploads.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files & prompts…"
              className="h-8 pl-8 pr-3 text-xs rounded-xl bg-card border-border/70"
            />
          </div>
        </div>

        {/* ── Tab Content: Artifacts ── */}
        {activeTab === 'artifacts' && (
          <div className="space-y-3">
            {filteredArtifacts.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/40">
                <Code2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-sm font-semibold text-foreground">No artifacts found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Ask the AI in Chat to write code, design an HTML page, or generate documents to automatically save Claude-style artifacts here!
                </p>
                <Button size="sm" onClick={() => navigate('/')} className="mt-4 h-8 text-xs rounded-xl gap-1">
                  <Zap className="w-3.5 h-3.5" /> Open Chat
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredArtifacts.map((art) => (
                  <div
                    key={art.id}
                    className="group rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all p-4 flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <Code2 className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <h4 className="text-xs font-semibold truncate text-foreground">{art.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-muted-foreground shrink-0 capitalize">
                          {art.language}
                        </Badge>
                      </div>

                      {/* Code preview snippet */}
                      <pre className="text-[11px] font-mono text-slate-300 bg-[hsl(220_13%_8%)] p-2.5 rounded-xl max-h-28 overflow-hidden line-clamp-4 mb-3 border border-slate-800">
                        {art.code}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                      <span>{art.code.split('\n').length} lines</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(art.id, art.code)}
                          className="h-7 px-2 text-xs"
                          title="Copy code"
                        >
                          {copiedId === art.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadArtifactFile(art.filename || `${art.title}.txt`, art.code)}
                          className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          title="Download file"
                        >
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteArtifact(art.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remove artifact"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: Images ── */}
        {activeTab === 'images' && (
          <div>
            {filteredImages.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/40">
                <Image className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-sm font-semibold text-foreground">No generated images</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  Create high-resolution artwork using the Image Studio. All creations will be securely archived here!
                </p>
                <Button size="sm" onClick={() => navigate('/image-gen')} className="mt-4 h-8 text-xs rounded-xl gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Generate Image
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredImages.map((img) => (
                  <div
                    key={img.id}
                    className="group rounded-2xl border border-border/70 bg-card overflow-hidden flex flex-col shadow-xs hover:border-primary/40 transition-all"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted/40">
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8 rounded-full shadow-lg"
                          onClick={() => setPreviewModal({ open: true, item: img, type: 'image' })}
                          title="Preview full size"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <a
                          href={img.url}
                          download={`flash-art-${img.id}.jpg`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                          title="Download Image"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-foreground line-clamp-2 mb-2 font-normal">{img.prompt}</p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
                        <span className="capitalize">{img.style || 'Digital'}</span>
                        <span>{img.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: Uploads ── */}
        {activeTab === 'uploads' && (
          <div className="space-y-4">
            <section className="space-y-2 border-b border-border/60 pb-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium">Private cloud storage</span>
                <span className="tabular-nums text-muted-foreground">
                  {isGuest ? 'Sign in to use cloud storage' : `${formatFileSize(usedStorageBytes)} / 1 GiB`}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Cloud storage used"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round((usedStorageBytes / PERSONAL_STORAGE_LIMIT) * 100))}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${Math.min(100, (usedStorageBytes / PERSONAL_STORAGE_LIMIT) * 100)}%` }}
                />
              </div>
              {!isGuest && <p className="text-[11px] text-muted-foreground">Files are private to your account. Maximum total storage: 1 GiB.</p>}
            </section>
            {filteredUploads.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl bg-card/40">
                <HardDrive className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-sm font-semibold text-foreground">
                  {uploadsLoading ? 'Loading cloud files…' : isGuest ? 'Sign in to upload personal files' : 'No uploaded files yet'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                  {isGuest
                    ? 'Guest sessions can attach a few images to chat, but personal cloud storage requires an account.'
                    : 'Upload images, PDFs, CSVs, or text documents. Files are stored privately and count toward your 1 GiB quota.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredUploads.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-muted/80 border border-border flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatFileSize(item.sizeBytes)} · {item.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadUpload(item)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUpload(item)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Image Preview Modal ── */}
      <Dialog open={previewModal.open} onOpenChange={(o) => setPreviewModal(prev => ({ ...prev, open: o }))}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card/95 border-border rounded-2xl">
          {previewModal.item && (
            <div className="flex flex-col">
              <div className="relative aspect-video max-h-[70vh] bg-black/80 flex items-center justify-center">
                <img
                  src={previewModal.item.url}
                  alt={previewModal.item.prompt}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="p-4 bg-card flex items-center justify-between gap-4">
                <p className="text-xs text-foreground font-medium">{previewModal.item.prompt}</p>
                <a
                  href={previewModal.item.url}
                  download="image-full.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium shrink-0 hover:bg-primary/90"
                >
                  <Download className="w-3.5 h-3.5" /> Download HD
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
