/**
 * Image Optimization Utility
 * Handles image loading, compression, and responsive sizing
 */

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: 'low' | 'medium' | 'high';
  sizes?: string;
  fill?: boolean;
  className?: string;
}

/**
 * Get responsive image sizes for different breakpoints
 */
export const getImageSizes = (imageType: 'hero' | 'card' | 'thumbnail' | 'gallery'): string => {
  const sizes: Record<string, string> = {
    hero: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px',
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    thumbnail: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    gallery: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  };
  return sizes[imageType];
};

/**
 * Get image quality setting for optimization
 */
export const getImageQuality = (quality: 'low' | 'medium' | 'high' = 'high'): number => {
  const qualities = {
    low: 60,
    medium: 75,
    high: 85,
  };
  return qualities[quality];
};

/**
 * Optimize image URL with Strapi/CDN parameters
 */
export const optimizeImageUrl = (url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
}): string => {
  if (!url) return '';

  // If already a full URL with domain, just return as-is
  if (url.startsWith('http')) return url;

  // Build Strapi image URL with optimization
  const base = url.startsWith('/') ? url : `/${url}`;
  const params = new URLSearchParams();

  if (options?.width) params.append('width', options.width.toString());
  if (options?.height) params.append('height', options.height.toString());
  if (options?.quality) params.append('quality', options.quality.toString());

  return `${base}${params.toString() ? '?' + params.toString() : ''}`;
};

/**
 * Lazy load image with blur placeholder effect
 */
export const generateBlurDataURL = (): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>
      </defs>
      <rect width="100" height="100" fill="#e5e7eb" filter="url(#blur)" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};
