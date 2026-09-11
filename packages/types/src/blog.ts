export interface BlogCoverImage {
  secureUrl: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | BlogCoverImage;
  author: string;
  category: string;
  tags: string[];
  readTime: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export function getBlogCoverImageUrl(cover?: string | BlogCoverImage | null): string {
  if (!cover) return '/images/hero_slide_1.jpg';
  if (typeof cover === 'string') return cover;
  return cover.secureUrl || '/images/hero_slide_1.jpg';
}

