interface ArticleJsonLdProps {
  title: string;
  description?: string;
  date?: string;
  slug: string;
}

export function ArticleJsonLd({ title, description, date, slug }: ArticleJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    ...(description && { description }),
    ...(date && { datePublished: date }),
    url: `https://auths.dev/${slug}`,
    author: {
      '@type': 'Organization',
      name: 'Auths',
      url: 'https://auths.dev',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Auths',
      url: 'https://auths.dev',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProfilePageJsonLdProps {
  did: string;
  url: string;
  name?: string;
}

export function ProfilePageJsonLd({ did, url, name }: ProfilePageJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      identifier: did,
      url,
      ...(name && { name }),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface SoftwareAppJsonLdProps {
  name: string;
  ecosystem: string;
  did?: string;
  identityUrl?: string;
}

export function SoftwareAppJsonLd({ name, ecosystem, did, identityUrl }: SoftwareAppJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    ...(ecosystem === 'npm' && { softwareRequirements: 'Node.js' }),
    ...(did && {
      author: {
        '@type': 'Person',
        identifier: did,
        ...(identityUrl && { url: identityUrl }),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
