export interface PostFrontmatter {
  title: string;
  date: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  excerpt: string;
  coverImage: string;
  tallCoverImage: boolean;
  images?: (string | { src: string; caption?: string })[];
  tags?: string[];
}

export interface BlogPost extends PostFrontmatter {
  slug: string;
  content: string;
  htmlContent: string;
}

export interface PostLocation {
  slug: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  date: string;
  title: string;
  excerpt: string;
  coverImage: string;
}

export interface TravelRoute {
  from: PostLocation;
  to: PostLocation;
}
