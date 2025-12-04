/**
 * SEO Utility Functions
 * Handles dynamic meta tag updates for better search engine optimization
 */

interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

/**
 * Update document title
 */
export function updateTitle(title: string): void {
  if (title) {
    document.title = title;
  }
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(name: string, content: string, useProperty = false): void {
  if (!content) return;

  const attribute = useProperty ? 'property' : 'name';
  const selector = `meta[${attribute}="${name}"]`;
  let element = document.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Update basic SEO meta tags
 */
export function updateBasicMeta(config: SEOConfig): void {
  if (config.title) {
    updateTitle(config.title);
  }

  if (config.description) {
    updateMetaTag('description', config.description);
  }

  if (config.keywords) {
    updateMetaTag('keywords', config.keywords);
  }

  if (config.author) {
    updateMetaTag('author', config.author);
  }
}

/**
 * Update Open Graph meta tags
 */
export function updateOpenGraphMeta(config: SEOConfig): void {
  const url = config.url || window.location.href;
  const type = config.type || 'website';

  if (config.title) {
    updateMetaTag('og:title', config.title, true);
  }

  if (config.description) {
    updateMetaTag('og:description', config.description, true);
  }

  updateMetaTag('og:type', type, true);
  updateMetaTag('og:url', url, true);

  if (config.image) {
    updateMetaTag('og:image', config.image, true);
  }

  // Additional Open Graph tags
  updateMetaTag('og:site_name', config.title || 'Textus', true);
  updateMetaTag('og:locale', 'en_US', true);
}

/**
 * Update Twitter Card meta tags
 */
export function updateTwitterMeta(config: SEOConfig): void {
  const card = config.twitterCard || 'summary_large_image';

  updateMetaTag('twitter:card', card);

  if (config.title) {
    updateMetaTag('twitter:title', config.title);
  }

  if (config.description) {
    updateMetaTag('twitter:description', config.description);
  }

  if (config.image) {
    updateMetaTag('twitter:image', config.image);
  }
}

/**
 * Update canonical URL
 */
export function updateCanonicalUrl(url?: string): void {
  const canonicalUrl: string = url || window.location.href.split('?')[0].split('#')[0];
  let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', canonicalUrl);
}

/**
 * Update all SEO meta tags at once
 */
export function updateAllSEOMeta(config: SEOConfig): void {
  updateBasicMeta(config);
  updateOpenGraphMeta(config);
  updateTwitterMeta(config);
  updateCanonicalUrl(config.url);
}

/**
 * Add structured data (JSON-LD) to the page
 */
export function addStructuredData(data: Record<string, any>): void {
  const scriptId = 'structured-data-' + (data['@type'] || 'default');
  let script = document.getElementById(scriptId) as HTMLScriptElement;

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

/**
 * Add WebSite structured data
 */
export function addWebSiteStructuredData(config: SEOConfig): void {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.title || 'Textus',
    description: config.description || 'Modern bookmark management',
    url: config.url || window.location.origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.url || window.location.origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  addStructuredData(structuredData);
}

/**
 * Add WebApplication structured data
 */
export function addWebApplicationStructuredData(config: SEOConfig): void {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.title || 'Textus',
    description:
      config.description ||
      'Textus is the modern successor to browser bookmarks. Beautiful, shareable, visual startpages and personal dashboards to organize, manage and share your links.',
    url: config.url || window.location.origin,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
  };

  addStructuredData(structuredData);
}

/**
 * Initialize all SEO optimizations
 */
export function initializeSEO(config: SEOConfig): void {
  // Update all meta tags
  updateAllSEOMeta(config);

  // Add structured data
  addWebSiteStructuredData(config);
  addWebApplicationStructuredData(config);

  // Set language attribute if not already set
  if (!document.documentElement.getAttribute('lang')) {
    document.documentElement.setAttribute('lang', 'en');
  }
}
