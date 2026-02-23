import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface FrontMatter {
  title: string;
  description?: string;
  date?: string;
  [key: string]: unknown;
}

export interface ContentFile {
  slug: string[];
  frontmatter: FrontMatter;
  content: string;
}

/** Resolve a slug array to a file path, trying both .mdx and .md */
function slugToPath(slug: string[]): string | null {
  const base = path.join(CONTENT_DIR, ...slug);
  for (const ext of ['.mdx', '.md']) {
    const p = base + ext;
    if (fs.existsSync(p)) return p;
  }
  // Try index file (e.g. trust/ → trust/index.mdx)
  for (const ext of ['.mdx', '.md']) {
    const p = path.join(base, 'index' + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function getContentFile(slug: string[]): ContentFile | null {
  const filePath = slugToPath(slug);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  return {
    slug,
    frontmatter: data as FrontMatter,
    content,
  };
}

/** List all files in a content section (for blog index, etc.) */
export function listContentFiles(section: string): ContentFile[] {
  const dir = path.join(CONTENT_DIR, section);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => /\.(mdx?|md)$/.test(f));

  return files
    .map((file) => {
      const slug = [section, file.replace(/\.(mdx?|md)$/, '')];
      return getContentFile(slug);
    })
    .filter((f): f is ContentFile => f !== null)
    .sort((a, b) => {
      // Sort by date descending (blog)
      const da = a.frontmatter.date ?? '';
      const db = b.frontmatter.date ?? '';
      return db.localeCompare(da);
    });
}
