export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-32 pb-24">
      <article className="prose prose-lg max-w-none">{children}</article>
    </div>
  );
}
