import Link from 'next/link';
import { listContentFiles, type ContentFile } from '@/lib/mdx';
import { constructMetadata } from '@/lib/metadata';

export const metadata = constructMetadata({
  title: 'Essays',
  description:
    'Why agents need bounds, why receipts beat logs, and what we learned building a key history you can verify offline.',
});

/** The two posts closest to the wedge lead; everything else is the archive. */
const LEAD_SLUGS = ['replacing-api-keys', 'how-we-audit-our-code'];

function PostList({ posts }: { posts: ContentFile[] }) {
  return (
    <ol>
      {posts.map((post) => (
        <li key={post.slug.join('/')} className="border-b border-rule py-8 last:border-0">
          <Link href={`/${post.slug.join('/')}`} className="group block">
            {post.frontmatter.date && (
              <p className="font-mono text-xs text-ink-faint">{post.frontmatter.date}</p>
            )}
            <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink transition-colors group-hover:text-seal-deep">
              {post.frontmatter.title}
            </h3>
            {post.frontmatter.description && (
              <p className="mt-2 max-w-2xl text-base leading-7 text-ink-soft">
                {post.frontmatter.description}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

function IndexMark({ n, title }: { n: string; title: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-sm font-semibold tracking-widest text-seal">{n}</span>
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-display text-3xl font-medium tracking-tight text-ink">{title}</h2>
    </div>
  );
}

export default function BlogIndexPage() {
  const posts = listContentFiles('blog');
  const lead = LEAD_SLUGS.map((s) => posts.find((p) => p.slug[1] === s)).filter(
    (p): p is ContentFile => p !== undefined,
  );
  const archive = posts.filter((p) => !LEAD_SLUGS.includes(p.slug[1]));

  return (
    <div className="mx-auto max-w-3xl px-6 pt-36 pb-24">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
        The ledger, long form
      </p>
      <h1 className="mt-6 font-display text-5xl font-medium tracking-tight text-ink sm:text-6xl">
        Essays.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
        Why agents need bounds, why a receipt beats a log, and what we learned building a key
        history you can check without trusting us.
      </p>

      <section className="mt-20">
        <IndexMark n="01" title="Start here." />
        <div className="mt-4">
          <PostList posts={lead} />
        </div>
      </section>

      <section className="mt-20">
        <IndexMark n="02" title="The archive." />
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">
          Written while we were building the identity layer underneath the bounded agent — kept
          for the record.
        </p>
        <div className="mt-4">
          <PostList posts={archive} />
        </div>
      </section>
    </div>
  );
}
