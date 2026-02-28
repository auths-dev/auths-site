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
