import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import type { BlogPost, PostFrontmatter, PostLocation, TravelRoute } from '@/types/blog';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export function getAllPostSlugs(): string[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }
    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => fileName.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error reading posts directory:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Convert markdown to HTML
    const processedContent = await remark()
      .use(gfm)
      .use(html, { sanitize: false })
      .process(content);


    const isPortrait = alt.startsWith('portrait|');
    const caption = isPortrait ? alt.replace('portrait|', '') : alt;

    const imgStyle = isPortrait ? 
      'width: 100%; max-width: 380px; display: block; margin: 0 auto !important; border: none !important;' : 
      'width: 100%; display: block; margin: 0 !important; border: none !important;';

    // Wrap <img> tags in card-style figure elements with bevelled frames and captions
    const htmlContent = processedContent.toString().replace(
      /<p><img src="([^"]*)" alt="([^"]*)"\s*\/?><\/p>/g,
      (_match, src, alt) => {
        const caption = alt
          ? `<figcaption style="font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(0,0,0,0.7); padding: 8px 0 0 0; margin: 0;">${alt}</figcaption>`
          : '';
        return `<figure style="margin: 2em 0 !important; background: #ECECEC; border: 1px solid #D0D0D0; padding: 10px;">
          <div style="border-top: 3px solid #808080; border-left: 3px solid #808080; border-right: 3px solid white; border-bottom: 3px solid white;">
            <img src="${src}" alt="${alt}" style="${imgStyle}" />
          </div>
          ${caption}
        </figure>`;
      }
    );

    return {
      slug,
      content,
      htmlContent,
      title: data.title,
      date: data.date,
      city: data.city,
      country: data.country,
      lat: data.lat,
      lon: data.lon,
      excerpt: data.excerpt,
      coverImage: data.coverImage,
      tallCoverImage: data.tallCoverImage,
      images: data.images || [],
      tags: data.tags || [],
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const slugs = getAllPostSlugs();
  const posts = await Promise.all(
    slugs.map(slug => getPostBySlug(slug))
  );

  // Filter out null values and sort by date (newest first)
  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
}

export async function getPostLocations(): Promise<PostLocation[]> {
  const posts = await getAllPosts();

  // Map and maintain sort order (newest first)
  return posts.map(post => ({
    slug: post.slug,
    city: post.city,
    country: post.country,
    lat: post.lat,
    lon: post.lon,
    date: post.date,
    title: post.title,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
  }));
}

export async function getTravelStats(): Promise<{ cities: number; countries: number; days: number }> {
  const posts = await getAllPosts();
  if (posts.length === 0) return { cities: 0, countries: 0, days: 0 };

  const cities = new Set(posts.map(p => p.city)).size;
  const countries = new Set(posts.map(p => p.country)).size;

  const dates = posts.map(p => new Date(p.date).getTime());
  const earliest = Math.min(...dates);
  const latest = Date.now();
  const days = Math.round((latest - earliest) / (1000 * 60 * 60 * 24));

  return { cities, countries, days };
}

export async function getTravelRoutes(): Promise<TravelRoute[]> {
  const locations = await getPostLocations();

  // Sort by date to get chronological order
  const sortedLocations = [...locations].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Create routes between consecutive locations
  const routes: TravelRoute[] = [];
  for (let i = 0; i < sortedLocations.length - 1; i++) {
    routes.push({
      from: sortedLocations[i],
      to: sortedLocations[i + 1],
    });
  }

  return routes;
}
