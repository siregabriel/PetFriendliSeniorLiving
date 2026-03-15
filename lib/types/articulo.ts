export interface Articulo {
  id: number;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[] | null;
  city: string | null;
  state: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Article form state (admin editor)
// tags is a comma-separated string input, split on save
export interface ArticuloForm {
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  cover_image_url: string;
  author_name: string;
  category: string;
  tags: string;
  city: string;
  state: string;
  meta_title: string;
  meta_description: string;
  status: 'draft' | 'published';
}
