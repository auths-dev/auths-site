import type { Metadata } from 'next';
import Link from 'next/link';
import { listContentFiles } from '@/lib/mdx';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest news and updates from the Auths project.',
};

export default function BlogIndexPage() {
  const posts = listContentFiles('blog');

  return (
    <div className="mx-auto max-w-3xl px-6 pt-28 pb-20">
      <h1 className="mb-10 text-2xl font-semibold text-white">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-zinc-500">No posts yet.</p>
      ) : (
        <ol className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug.join('/')}>
              <Link
                href={`/${post.slug.join('/')}`}
                className="group block"
              >
                <h2 className="text-lg font-medium text-white group-hover:text-[var(--accent-verified)] transition-colors">
                  {post.frontmatter.title}
                </h2>
                {post.frontmatter.description && (
                  <p className="mt-1 text-sm text-zinc-400">
                    {post.frontmatter.description}
                  </p>
                )}
                {post.frontmatter.date && (
                  <p className="mt-2 font-mono text-xs text-zinc-600">
                    {post.frontmatter.date}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
