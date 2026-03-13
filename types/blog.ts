export interface Coordinate {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  tallCoverImage: boolean;
  coordinates: Coordinate[];
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
