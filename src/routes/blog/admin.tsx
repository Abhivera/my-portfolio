import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Lock,
  LogOut,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import type { BlogPost } from "@/lib/blog-data";
import {
  createBlogPost,
  deleteBlogPost,
  fetchAdminPosts,
  getBlogAuthStatus,
  logoutBlog,
  updateBlogPost,
  uploadBlogImage,
  verifyBlogPassword,
  type BlogPostInput,
} from "@/lib/blog-client";

export const Route = createFileRoute("/blog/admin")({
  component: BlogAdminPage,
  head: () => ({
    meta: [
      { title: "Blog Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const emptyDraft = (): BlogPostInput => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tags: [],
  featured: false,
  published: false,
});

function BlogAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlogPostInput>(emptyDraft());
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBlogAuthStatus()
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const data = await fetchAdminPosts();
      setPosts(data);
    } catch {
      setAuthenticated(false);
      toast.error("Session expired. Please sign in again.");
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) void loadPosts();
  }, [authenticated, loadPosts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const result = await verifyBlogPassword(password);
      if (!result.success) {
        setLoginError(result.error ?? "Incorrect password");
        return;
      }
      setPassword("");
      setAuthenticated(true);
      toast.success("Welcome to blog admin");
    } catch {
      setLoginError("Could not verify password. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutBlog();
    setAuthenticated(false);
    setPosts([]);
    setSelectedId(null);
    setDraft(emptyDraft());
    toast.success("Signed out");
  };

  const startNewPost = () => {
    setSelectedId(null);
    setDraft(emptyDraft());
    setTagsInput("");
  };

  const selectPost = (post: BlogPost) => {
    setSelectedId(post.id ?? null);
    setDraft({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImageId: post.coverImageId,
      date: post.date,
      readTime: post.readTime,
      tags: post.tags,
      featured: post.featured ?? false,
      published: post.published ?? false,
    });
    setTagsInput(post.tags.join(", "));
  };

  const insertAtCursor = (snippet: string) => {
    const el = contentRef.current;
    if (!el) {
      setDraft((d) => ({ ...d, content: d.content + snippet }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = draft.content.slice(0, start);
    const after = draft.content.slice(end);
    const content = before + snippet + after;
    setDraft((d) => ({ ...d, content }));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const { id, url } = await uploadBlogImage(file);
      setDraft((d) => ({ ...d, coverImageId: id }));
      if (!draft.content.includes(url)) {
        insertAtCursor(`\n<p><img src="${url}" alt="${draft.title || "Cover"}" /></p>\n`);
      }
      toast.success("Cover image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleInlineUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadBlogImage(file);
      insertAtCursor(`<p><img src="${url}" alt="${file.name.replace(/\.[^.]+$/, "")}" /></p>`);
      toast.success("Image inserted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const buildInput = (): BlogPostInput => ({
    ...draft,
    tags: tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const handleSave = async () => {
    const input = buildInput();
    if (!input.title.trim() || !input.excerpt.trim() || !input.content.trim()) {
      toast.error("Title, excerpt, and content are required");
      return;
    }

    setSaving(true);
    try {
      if (selectedId) {
        const post = await updateBlogPost(selectedId, input);
        setPosts((prev) =>
          prev.map((p) => (p.id === selectedId ? post : p)),
        );
        toast.success("Post updated");
      } else {
        const post = await createBlogPost(input);
        setPosts((prev) => [post, ...prev]);
        setSelectedId(post.id ?? null);
        toast.success("Post created");
      }
      await loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm("Delete this post permanently?")) return;

    try {
      await deleteBlogPost(selectedId);
      setPosts((prev) => prev.filter((p) => p.id !== selectedId));
      startNewPost();
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Toaster />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Blog admin</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to write and publish blog posts.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-4 rounded-lg border bg-card p-6 shadow-sm"
          >
            <div className="space-y-2">
              <Label htmlFor="blog-password">Password</Label>
              <Input
                id="blog-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter blog password"
                autoComplete="current-password"
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive" role="alert">
                {loginError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? "Checking…" : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/blog" className="hover:text-foreground transition-colors">
              ← Back to blog
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const coverPreviewUrl = draft.coverImageId
    ? `/api/blog/images?id=${encodeURIComponent(draft.coverImageId)}`
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />
      <header className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight">Blog admin</h1>
          <p className="text-xs text-muted-foreground">
            Write posts with HTML content and images stored in MongoDB
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/blog">View blog</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-72 border-r flex flex-col shrink-0">
          <div className="p-3 border-b">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={startNewPost}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New post
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {postsLoading ? (
              <p className="text-xs text-muted-foreground p-2">Loading posts…</p>
            ) : posts.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No posts yet</p>
            ) : (
              posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => selectPost(post)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedId === post.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.published ? "Published" : "Draft"} · {post.date}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  value={draft.slug ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, slug: e.target.value }))
                  }
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={draft.date ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={draft.excerpt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, excerpt: e.target.value }))
                  }
                  placeholder="Short summary for listing pages"
                  rows={2}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="AI, Backend, FastAPI"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="published"
                  checked={draft.published ?? false}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, published: checked }))
                  }
                />
                <Label htmlFor="published">Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="featured"
                  checked={draft.featured ?? false}
                  onCheckedChange={(checked) =>
                    setDraft((d) => ({ ...d, featured: checked }))
                  }
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Cover image</Label>
                <div className="flex gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCoverUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-1.5" />
                    Upload cover
                  </Button>
                </div>
              </div>
              {coverPreviewUrl && (
                <img
                  src={coverPreviewUrl}
                  alt="Cover preview"
                  className="rounded-xl border max-h-48 object-cover"
                />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="content">Content (HTML)</Label>
                <div className="flex gap-2">
                  <input
                    ref={inlineInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleInlineUpload(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => inlineInputRef.current?.click()}
                  >
                    <ImagePlus className="h-4 w-4 mr-1.5" />
                    Insert image
                  </Button>
                </div>
              </div>
              <Textarea
                ref={contentRef}
                id="content"
                value={draft.content}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, content: e.target.value }))
                }
                placeholder="<h2>Heading</h2><p>Your content here…</p>"
                className="min-h-[320px] font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Use HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;pre&gt;&lt;code&gt;, &lt;ul&gt;, &lt;img&gt;, etc.
              </p>
            </div>

            {draft.content && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="prose-blog rounded-xl border p-6 bg-card"
                  dangerouslySetInnerHTML={{ __html: draft.content }}
                />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 pb-8">
              <Button onClick={() => void handleSave()} disabled={saving || uploading}>
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? "Saving…" : selectedId ? "Update post" : "Create post"}
              </Button>
              {selectedId && (
                <Button
                  variant="destructive"
                  onClick={() => void handleDelete()}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
