import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getContentFile } from '@/lib/mdx';
import { mdxComponents } from '@/lib/mdx-components';

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const file = getContentFile(slug);
  if (!file) return { title: 'Not Found' };

  return {
    title: file.frontmatter.title,
    description: file.frontmatter.description,
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const file = getContentFile(slug);

  if (!file) notFound();

  return (
    <MDXRemote
      source={file.content}
      components={mdxComponents}
    />
  );
}
