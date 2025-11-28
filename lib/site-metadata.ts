function ensureProtocol(url: string) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return ensureProtocol(explicit);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return ensureProtocol(vercelUrl);

  return 'http://localhost:3000';
}

const SITE_URL = resolveSiteUrl();

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL;
  try {
    return new URL(path, SITE_URL).toString();
  } catch (error) {
    console.warn('[metadata] Failed to build absolute URL from', path, error);
    return SITE_URL;
  }
}

export function defaultOgImage(path = '/og-default.png') {
  return absoluteUrl(path);
}

export const seoDefaults = {
  siteName: 'AutoHub',
  siteUrl: SITE_URL,
  ogImage: defaultOgImage(),
};
