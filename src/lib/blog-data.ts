export type BlogPost = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
  tags: string[];
  content: string;
  coverImageUrl?: string;
  coverImageId?: string;
  featured?: boolean;
  published?: boolean;
  updatedAt?: string;
};

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
