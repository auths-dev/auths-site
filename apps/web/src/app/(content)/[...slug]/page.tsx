import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getContentFile } from '@/lib/mdx';
import { mdxComponents } from '@/lib/mdx-components';
import { constructMetadata } from '@/lib/metadata';
import { ArticleJsonLd } from '@/components/json-ld';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const file = slug[0] === 'blog' ? getContentFile(slug) : null;
  if (!file) return { title: 'Not Found' };

  const subtitle = file.frontmatter.description?.slice(0, 140) ?? 'From the Auths essays.';
  return constructMetadata({
    title: file.frontmatter.title,
    description: file.frontmatter.description,
    image: `/api/og?title=${encodeURIComponent(file.frontmatter.title)}&subtitle=${encodeURIComponent(subtitle)}`,
  });
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const file = slug[0] === 'blog' ? getContentFile(slug) : null;

  if (!file) notFound();

  return (
    <>
      <ArticleJsonLd
        title={file.frontmatter.title}
        description={file.frontmatter.description}
        date={file.frontmatter.date}
        slug={slug.join('/')}
      />
      <header className="not-prose mb-12">
        <Link
          href="/blog"
          className="font-mono text-sm text-seal transition-colors hover:text-seal-deep"
        >
          ← All essays
        </Link>
        {file.frontmatter.date && (
          <p className="mt-8 font-mono text-xs text-ink-faint">{file.frontmatter.date}</p>
        )}
      </header>
      <MDXRemote source={file.content} components={mdxComponents} />
    </>
  );
}
