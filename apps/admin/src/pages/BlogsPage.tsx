import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  ExternalLink,
  Clock,
  X,
  FileText,
} from 'lucide-react';
import { useTeaNestStore, formatDate } from '@tea-nest/shared';
import { BlogPost, getBlogCoverImageUrl } from '@tea-nest/types';

const BLOG_CATEGORIES = [
  'Tea Culture',
  'Brewing Masterclass',
  'Assam History',
  'Health & Wellness',
  'Estate Stories',
];

export const BlogsPage: React.FC = () => {
  const { state, store } = useTeaNestStore();
  const blogs = state.blogs || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(BLOG_CATEGORIES[0]);
  const [author, setAuthor] = useState('Tea Nest Editorial');
  const [tagsInput, setTagsInput] = useState('');
  const [readTime, setReadTime] = useState('4 min read');
  const [isPublished, setIsPublished] = useState(true);
  const [coverImageUrl, setCoverImageUrl] = useState('/images/tea_nest_front.jpg');
  const [coverAltText, setCoverAltText] = useState('');

  const [imageUploading, setImageUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-generate slug from title
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!editingBlog) {
      const generated = newTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  // Auto estimate read time based on word count
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    const words = newContent.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    setReadTime(`${minutes} min read`);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingBlog(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setCategory(BLOG_CATEGORIES[0]);
    setAuthor('Tea Nest Editorial');
    setTagsInput('Tea Culture, Single Origin, Assam');
    setReadTime('4 min read');
    setIsPublished(true);
    setCoverImageUrl('/images/tea_nest_front.jpg');
    setCoverAltText('');
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setCategory(blog.category);
    setAuthor(blog.author);
    setTagsInput(blog.tags.join(', '));
    setReadTime(blog.readTime);
    setIsPublished(blog.isPublished);
    setCoverImageUrl(getBlogCoverImageUrl(blog.coverImage));
    setCoverAltText(typeof blog.coverImage === 'object' ? (blog.coverImage?.altText || blog.title) : blog.title);
    setModalOpen(true);
  };

  // Handle direct file upload from device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const res = await fetch('/api/blogs/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, fileName: file.name }),
        });
        if (res.ok) {
          const result = await res.json();
          setCoverImageUrl(result.secureUrl || dataUrl);
        } else {
          setCoverImageUrl(dataUrl);
        }
      } catch {
        setCoverImageUrl(dataUrl);
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Blog Post (Atomic Create or Update)
  const handleSaveBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Title is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingBlog) {
        store.updateBlog(editingBlog.id, {
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          category,
          author: author.trim(),
          tags,
          readTime,
          isPublished,
          coverImage: {
            secureUrl: coverImageUrl,
            altText: coverAltText || title.trim(),
          },
        });
        setSuccessMessage(`Blog "${title}" successfully updated!`);
      } else {
        store.createBlog({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim(),
          content,
          category,
          author: author.trim(),
          tags,
          readTime,
          isPublished,
          coverImage: {
            secureUrl: coverImageUrl,
            altText: coverAltText || title.trim(),
          },
        });
        setSuccessMessage(`Blog "${title}" successfully published to catalog!`);
      }

      setModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save blog post.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Delete Blog Post
  const handleDeleteBlog = (blog: BlogPost) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${blog.title}"?`);
    if (!confirmDelete) return;

    store.deleteBlog(blog.id);
    setSuccessMessage(`Blog post "${blog.title}" deleted.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Toggle publish status
  const handleTogglePublish = (blog: BlogPost) => {
    const updated = store.togglePublishBlog(blog.id);
    setSuccessMessage(`Blog "${blog.title}" marked as ${updated.isPublished ? 'PUBLISHED' : 'DRAFT'}.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filtered list
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || b.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && b.isPublished) ||
      (statusFilter === 'DRAFT' && !b.isPublished);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-admin-gold" />
            <span>Blog & Editorial Management</span>
          </h1>
          <p className="text-xs text-admin-muted mt-1">
            Create, edit, publish tea culture stories, masterclasses, and manage cover photography.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:5173/blog"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-admin-card hover:bg-admin-border border border-admin-border text-xs font-semibold rounded-xl text-gray-300 transition-colors flex items-center gap-1.5"
          >
            <span>Live Storefront Blog</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-admin-accent hover:bg-admin-gold text-black text-xs font-bold rounded-xl transition-colors shadow-lg flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Article</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMessage && (
        <div className="p-4 bg-green-950/60 border border-green-800 text-green-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-admin-muted uppercase font-bold tracking-wider">Total Articles</span>
          <div className="text-2xl font-bold text-gray-100">{blogs.length}</div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-admin-muted uppercase font-bold tracking-wider">Published</span>
          <div className="text-2xl font-bold text-green-400">
            {blogs.filter((b) => b.isPublished).length}
          </div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-admin-muted uppercase font-bold tracking-wider">Drafts</span>
          <div className="text-2xl font-bold text-yellow-400">
            {blogs.filter((b) => !b.isPublished).length}
          </div>
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-admin-muted uppercase font-bold tracking-wider">Categories</span>
          <div className="text-2xl font-bold text-admin-gold">
            {new Set(blogs.map((b) => b.category)).size}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category & Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'ALL'
                ? 'bg-admin-accent text-black font-bold shadow'
                : 'bg-admin-surface text-gray-300 border border-admin-border'
            }`}
          >
            All ({blogs.length})
          </button>
          <button
            onClick={() => setStatusFilter('PUBLISHED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'PUBLISHED'
                ? 'bg-green-700 text-white font-bold shadow'
                : 'bg-admin-surface text-gray-300 border border-admin-border'
            }`}
          >
            Published ({blogs.filter((b) => b.isPublished).length})
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === 'DRAFT'
                ? 'bg-yellow-700 text-white font-bold shadow'
                : 'bg-admin-surface text-gray-300 border border-admin-border'
            }`}
          >
            Drafts ({blogs.filter((b) => !b.isPublished).length})
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-admin-surface text-gray-200 border border-admin-border outline-none focus:border-admin-accent cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {BLOG_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search articles, author, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs text-gray-200 outline-none focus:border-admin-accent"
          />
        </div>
      </div>

      {/* Blogs Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        {filteredBlogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-admin-muted space-y-3">
            <BookOpen className="w-8 h-8 text-admin-muted/40 mx-auto" />
            <p>No blog posts found matching the filter criteria.</p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-admin-card hover:bg-admin-border border border-admin-border rounded-xl text-xs text-gray-200 font-semibold"
            >
              Write First Article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-admin-card text-admin-muted uppercase tracking-wider font-semibold border-b border-admin-border">
                <tr>
                  <th className="p-4">Cover</th>
                  <th className="p-4">Article Title & Excerpt</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Read Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-admin-card/50 transition-colors">
                    <td className="p-4">
                      <div className="w-16 h-12 rounded-lg bg-black overflow-hidden border border-admin-border flex items-center justify-center">
                        <img
                          src={getBlogCoverImageUrl(blog.coverImage)}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4 max-w-xs sm:max-w-sm">
                      <p className="font-bold text-gray-100 line-clamp-1">{blog.title}</p>
                      <p className="text-[11px] text-admin-muted line-clamp-1 mt-0.5">{blog.excerpt}</p>
                      <span className="text-[10px] text-admin-gold/80 mt-1 inline-block">/blog/{blog.slug}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-admin-card text-admin-gold border border-admin-border">
                        {blog.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">{blog.author}</td>
                    <td className="p-4 text-admin-muted flex items-center gap-1 mt-3">
                      <Clock className="w-3 h-3" />
                      <span>{blog.readTime}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePublish(blog)}
                        title="Click to toggle Published / Draft"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          blog.isPublished
                            ? 'bg-green-950 hover:bg-green-900 text-green-300 border border-green-800'
                            : 'bg-yellow-950 hover:bg-yellow-900 text-yellow-300 border border-yellow-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${blog.isPublished ? 'bg-green-400' : 'bg-yellow-400'}`} />
                        <span>{blog.isPublished ? 'PUBLISHED' : 'DRAFT'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-admin-muted">{formatDate(blog.updatedAt)}</td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <a
                        href={`http://localhost:5173/blog/${blog.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 inline-block bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg transition-colors"
                        title="View Live Post on Storefront"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleOpenEdit(blog)}
                        className="p-1.5 bg-admin-card hover:bg-admin-border text-gray-300 rounded-lg transition-colors"
                        title="Edit Article"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog)}
                        className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-900/60 rounded-lg transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Blog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-admin-surface border border-admin-border rounded-2xl p-6 text-gray-100 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-admin-border pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-gray-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-admin-gold" />
                  <span>{editingBlog ? 'Edit Blog Article' : 'Publish New Blog Article'}</span>
                </h3>
                <p className="text-xs text-admin-muted mt-0.5">
                  Write inspiring tea content that engages customers and builds domain authority.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Secrets of First Flush Orthodox Assam Tea"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 outline-none focus:border-admin-accent font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    URL Slug
                  </label>
                  <div className="flex items-center bg-admin-bg border border-admin-border rounded-xl px-2.5 py-2">
                    <span className="text-admin-muted text-[11px] mr-1">/blog/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-transparent text-xs text-admin-gold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 outline-none focus:border-admin-accent"
                  >
                    {BLOG_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 outline-none focus:border-admin-accent"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Reading Time
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 outline-none focus:border-admin-accent"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Tea Culture, Single Origin, Assam Tea, Brewing"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 outline-none focus:border-admin-accent"
                  />
                </div>
              </div>

              {/* Cover Image Upload Section */}
              <div className="p-4 bg-admin-card rounded-xl border border-admin-border space-y-3">
                <span className="block font-semibold uppercase tracking-wider text-admin-gold text-[11px]">
                  Cover Photography & Media
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-1">
                    <div className="aspect-[16/10] bg-black rounded-lg overflow-hidden border border-admin-border flex items-center justify-center">
                      <img
                        src={coverImageUrl || '/images/tea_nest_front.jpg'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2.5">
                    <div>
                      <label className="block text-[11px] text-gray-300 font-medium mb-1">
                        Upload Cover Image Directly from Device:
                      </label>
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-admin-surface hover:bg-admin-border border border-dashed border-admin-gold/60 rounded-xl cursor-pointer transition-colors text-xs text-gray-200">
                        <Upload className="w-4 h-4 text-admin-gold" />
                        <span>{imageUploading ? 'Uploading Image...' : 'Choose image file from computer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={imageUploading}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-300 font-medium mb-1">
                        Or specify image URL / asset path:
                      </label>
                      <input
                        type="text"
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        placeholder="/images/tea_nest_front.jpg"
                        className="w-full px-3 py-1.5 bg-admin-bg border border-admin-border rounded-lg text-xs text-gray-100 outline-none focus:border-admin-accent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                  Summary / Excerpt (Shows on cards & previews) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A concise 1-2 sentence hook explaining what the reader will discover."
                  className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 outline-none focus:border-admin-accent"
                />
              </div>

              {/* Full Article Content */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-gray-300 mb-1">
                  Full Article Body (Markdown & formatting supported) *
                </label>
                <textarea
                  required
                  rows={10}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write full article here. Supports ## Headings, lists, and quotes."
                  className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs text-gray-100 font-mono outline-none focus:border-admin-accent"
                />
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-admin-gold focus:ring-0 bg-admin-bg border-admin-border"
                  />
                  <span className="text-xs font-semibold text-gray-200">
                    Publish immediately to public storefront (/blog)
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-admin-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-admin-card hover:bg-admin-border text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-admin-accent hover:bg-admin-gold text-black rounded-xl text-xs font-bold transition-colors shadow-lg"
                >
                  {editingBlog ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
