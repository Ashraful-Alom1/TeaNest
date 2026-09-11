import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Share2, 
  Tag, 
  BookOpen, 
  ChevronRight, 
  Check, 
  MessageCircle,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useTeaNestStore } from '@tea-nest/shared';
import { BlogPost, getBlogCoverImageUrl } from '@tea-nest/types';

export const BlogPostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { state } = useTeaNestStore();
  const [copied, setCopied] = React.useState(false);

  const blogs: BlogPost[] = state.blogs || [];
  const post = blogs.find((b: BlogPost) => b.slug === slug || b.id === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-[70vh] bg-stone-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 mb-2">Story Not Found</h1>
          <p className="text-stone-600 text-sm mb-6 leading-relaxed">
            The tea article you are looking for might have been moved, renamed, or is currently being curated.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Explore All Stories
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Related posts from same category or newest
  const relatedPosts = blogs
    .filter((b: BlogPost) => b.id !== post.id && b.isPublished)
    .filter((b: BlogPost) => b.category === post.category || true)
    .slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Read "${post.title}" on Tea Nest Journal: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Helper to format body content into rich readable typography blocks
  const renderFormattedContent = (content: string) => {
    const paragraphs = content.split(/\n\s*\n/);
    return paragraphs.map((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Check if it's a section header (starts with # or bold marker or short title like "1. ...")
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^#+\s*/, '');
        return (
          <h2 key={idx} className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-10 mb-4 tracking-tight">
            {text}
          </h2>
        );
      }

      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <h3 key={idx} className="text-xl font-serif font-semibold text-emerald-950 mt-8 mb-3">
            {trimmed.replace(/\*\*/g, '')}
          </h3>
        );
      }

      // Blockquote if starts with >
      if (trimmed.startsWith('>')) {
        return (
          <blockquote key={idx} className="border-l-4 border-emerald-600 bg-emerald-50/60 pl-5 pr-4 py-4 rounded-r-xl my-6 text-emerald-950 italic text-base leading-relaxed">
            {trimmed.replace(/^>\s*/, '')}
          </blockquote>
        );
      }

      return (
        <p key={idx} className="text-stone-700 text-lg leading-relaxed mb-6 font-normal tracking-normal">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <article className="min-h-screen bg-[#FAF8F5] text-stone-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="bg-white border-b border-stone-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-stone-500 overflow-x-auto scrollbar-none py-1">
            <Link to="/" className="hover:text-emerald-800 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
            <Link to="/blog" className="hover:text-emerald-800 transition-colors">Journal</Link>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
            <span className="text-emerald-900 font-semibold truncate max-w-[180px] sm:max-w-xs">
              {post.category}
            </span>
          </nav>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsAppShare}
              title="Share on WhatsApp"
              className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              title="Copy link to article"
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-8">
        <div className="flex flex-wrap items-center gap-2.5 mb-5">
          <span className="px-3 py-1 bg-emerald-100/90 text-emerald-900 font-semibold text-xs rounded-full uppercase tracking-wider">
            {post.category}
          </span>
          <span className="flex items-center text-xs text-stone-500 gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
          <span className="text-stone-300">•</span>
          <span className="flex items-center text-xs text-stone-500 gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" />
            {post.readTime}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 leading-[1.2] tracking-tight mb-6">
          {post.title}
        </h1>

        <p className="text-lg sm:text-xl text-stone-600 leading-relaxed font-serif italic mb-8 border-l-2 border-amber-600/40 pl-4 py-1">
          {post.excerpt}
        </p>

        {/* Author pill */}
        <div className="flex items-center justify-between py-4 border-y border-stone-200/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-emerald-800 text-amber-200 flex items-center justify-center font-serif font-bold text-base shadow-sm">
              {post.author ? post.author.charAt(0) : 'T'}
            </div>
            <div>
              <div className="font-semibold text-stone-900 text-sm sm:text-base">
                {post.author || 'Tea Nest Master Blender'}
              </div>
              <div className="text-xs text-stone-500">
                Tea Nest Editorial & Heritage Guild
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 rounded-lg font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Estate Curated
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-stone-200/90 aspect-[16/9] sm:aspect-[21/9] bg-stone-100">
          <img
            src={getBlogCoverImageUrl(post.coverImage)}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Main Editorial Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="prose prose-stone prose-lg max-w-none">
          {renderFormattedContent(post.content)}
        </div>

        {/* Article Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-stone-200">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <Tag className="w-3.5 h-3.5" />
              Related Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors cursor-default"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interactive In-Article Estate Experience CTA */}
        <div className="mt-14 p-8 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-900 text-white shadow-xl relative overflow-hidden border border-emerald-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Direct From Dibrugarh
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3">
              Taste the Craft in Every Sip
            </h3>
            <p className="text-emerald-100/85 text-sm sm:text-base leading-relaxed mb-6">
              Our artisanal black teas, single-estate flushes, and aromatic spiced blends are harvested fresh in Upper Assam and delivered straight to your teacup.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/#products"
                className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                Explore Artisan Teas
              </Link>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm transition-all border border-white/20"
              >
                Read More Stories
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Related Stories Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-stone-100 border-t border-stone-200/90 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                  More Stories from the Tea Country
                </h2>
                <p className="text-stone-600 text-sm mt-1">
                  Continue exploring brewing science, heritage lore, and garden harvest notes.
                </p>
              </div>
              <Link
                to="/blog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950 transition-colors"
              >
                View Archive <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((item: BlogPost) => (
                <Link
                  key={item.id}
                  to={`/blog/${item.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                    <img
                      src={getBlogCoverImageUrl(item.coverImage)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                      <span className="font-semibold text-emerald-800">{item.category}</span>
                      <span>•</span>
                      <span>{item.readTime}</span>
                    </div>
                    <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-emerald-800 transition-colors mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mt-auto">
                      {item.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-200 text-stone-800 rounded-xl text-sm font-semibold hover:bg-stone-300 transition-colors"
              >
                View All Stories <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </article>
  );
};
