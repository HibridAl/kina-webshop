const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://autohub.example.com';

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
