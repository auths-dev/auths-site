import { ExplorerClient } from './explorer-client';
import { constructMetadata } from '@/lib/metadata';

export const metadata = constructMetadata({
  title: 'Identity Explorer | Auths',
  description:
    'Explore decentralized cryptographic identity chains for any GitHub or Gitea repository.',
});

type Props = {
  searchParams: Promise<{ repo?: string }>;
};

export default async function ExplorerPage({ searchParams }: Props) {
  const { repo } = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-20">
      <h1 className="mb-8 text-2xl font-semibold text-white">
        Identity Explorer
      </h1>
      <ExplorerClient initialRepo={repo} />
    </div>
  );
}
