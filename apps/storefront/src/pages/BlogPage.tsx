import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, User, ArrowRight, Search, Sparkles } from 'lucide-react';
import { useTeaNestStore, formatDate } from '@tea-nest/shared';
import { getBlogCoverImageUrl } from '@tea-nest/types';

export const BlogPage: React.FC = () => {
  const { state } = useTeaNestStore();
  const allBlogs = (state.blogs || []).filter((b) => b.isPublished);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(allBlogs.map((b) => b.category)))];

  const filteredBlogs = allBlogs.filter((blog) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      blog.title.toLowerCase().includes(query) ||
      blog.excerpt.toLowerCase().includes(query) ||
      blog.author.toLowerCase().includes(query) ||
      blog.tags.some((t) => t.toLowerCase().includes(query));

    const matchesCategory = selectedCategory === 'ALL' || blog.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredBlog = filteredBlogs[0];
  const regularBlogs = filteredBlogs.slice(1);

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-charcoal-900 pb-20">
      {/* Editorial Hero Header */}
      <section className="relative bg-[#15271d] text-cream-100 py-16 sm:py-24 overflow-hidden border-b border-gold-500/20">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#c5a059_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Tea Nest Journal</span>
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-cream-50">
            Stories of Terroir, Heritage & Leaf
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-cream-300 font-light leading-relaxed">
            Delve into centuries of Upper Assam tea traditions, artisan plucking secrets, and masterclass brewing rituals fresh from Naharkatia, Dibrugarh.
          </p>

          {/* Search bar inside hero */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <Search className="w-4 h-4 text-cream-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search articles, brewing secrets, history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-gold-500/30 rounded-2xl text-xs text-cream-100 placeholder-cream-400 outline-none backdrop-blur-md transition-all shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-cream-200">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-forest-800 text-gold-300 shadow-md'
                  : 'bg-white hover:bg-cream-100 text-charcoal-700 border border-cream-300'
              }`}
            >
              {cat === 'ALL' ? 'All Articles' : cat}
            </button>
          ))}
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-cream-200 rounded-full flex items-center justify-center text-charcoal-400 mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-charcoal-900">No Articles Found</h3>
            <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
              We couldn't find any tea journal articles matching your search query. Try searching for "orthodox", "brewing", or "Assam".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="px-5 py-2.5 bg-forest-800 text-gold-300 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12 pt-8">
            {/* Featured Article Banner */}
            {featuredBlog && (
              <div className="group bg-white rounded-3xl border border-cream-300 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto bg-[#f5efe6] overflow-hidden">
                    <img
                      src={getBlogCoverImageUrl(featuredBlog.coverImage)}
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-900/10 text-forest-900 border border-forest-900/20">
                          {featuredBlog.category}
                        </span>
                        <span className="text-xs text-charcoal-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{featuredBlog.readTime}</span>
                        </span>
                      </div>

                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-950 leading-tight group-hover:text-forest-800 transition-colors">
                        <Link to={`/blog/${featuredBlog.slug}`}>{featuredBlog.title}</Link>
                      </h2>

                      <p className="text-sm text-charcoal-600 leading-relaxed line-clamp-3">
                        {featuredBlog.excerpt}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-cream-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center text-charcoal-700 text-xs font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-charcoal-800">{featuredBlog.author}</p>
                          <p className="text-[10px] text-charcoal-400">{formatDate(featuredBlog.publishedAt || featuredBlog.createdAt)}</p>
                        </div>
                      </div>

                      <Link
                        to={`/blog/${featuredBlog.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-800 hover:text-gold-600 uppercase tracking-wider transition-colors"
                      >
                        <span>Read Article</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid of Remaining Articles */}
            {regularBlogs.length > 0 && (
              <div>
                <h3 className="font-serif text-xl font-bold text-charcoal-950 mb-6">
                  More From the Tea Journal
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {regularBlogs.map((blog) => (
                    <article
                      key={blog.id}
                      className="group bg-white rounded-2xl border border-cream-300 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[16/10] bg-[#f5efe6] overflow-hidden">
                          <img
                            src={getBlogCoverImageUrl(blog.coverImage)}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>

                        <div className="p-6 space-y-3">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-gold-600 uppercase tracking-wider">
                              {blog.category}
                            </span>
                            <span className="text-charcoal-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{blog.readTime}</span>
                            </span>
                          </div>

                          <h4 className="font-serif text-lg font-bold text-charcoal-950 group-hover:text-forest-800 transition-colors line-clamp-2">
                            <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                          </h4>

                          <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                            {blog.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="p-6 pt-0 border-t border-cream-100 flex items-center justify-between mt-3">
                        <span className="text-[11px] text-charcoal-400">
                          {formatDate(blog.publishedAt || blog.createdAt)}
                        </span>
                        <Link
                          to={`/blog/${blog.slug}`}
                          className="text-xs font-bold text-forest-800 hover:text-gold-600 inline-flex items-center gap-1 uppercase tracking-wider"
                        >
                          <span>Read</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
