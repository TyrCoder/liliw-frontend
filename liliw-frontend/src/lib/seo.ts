import { Metadata } from 'next';

export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  author?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[];
  noindex?: boolean;
}

/**
 * Generate metadata for pages
 */
export const generateSEOMetadata = (props: SEOProps): Metadata => {
  const {
    title,
    description,
    image = 'https://liliw.com/og-image.jpg',
    url = 'https://liliw.com',
    author = 'Liliw Tourism',
    type = 'website',
    keywords = [],
    noindex = false,
  } = props;

  return {
    title: `${title} | Liliw Tourism`,
    description,
    keywords: [...keywords, 'Liliw', 'Laguna', 'tourism', 'travel', 'Philippines'],
    authors: [{ name: author }],
    robots: {
      index: !noindex,
      follow: !noindex,
      nocache: false,
    },
    openGraph: {
      title: `${title} | Liliw Tourism`,
      description,
      url,
      siteName: 'Liliw Tourism',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
      type: type === 'article' ? 'article' : 'website',
      locale: 'en_PH',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Liliw Tourism`,
      description,
      images: [image],
      creator: '@liliwtourism',
    },
    alternates: {
      canonical: url,
    },
  };
};

/**
 * Generate JSON-LD structured data
 */
export const generateStructuredData = (data: {
  type: 'Organization' | 'LocalBusiness' | 'Place' | 'Event' | 'Product';
  name: string;
  description?: string;
  image?: string;
  url?: string;
  phone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  priceRange?: string;
  rating?: { ratingValue: number; ratingCount: number };
  reviews?: Array<{ author: string; rating: number; text: string }>;
}) => {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': data.type,
    name: data.name,
    ...(data.description && { description: data.description }),
    ...(data.image && { image: data.image }),
    ...(data.url && { url: data.url }),
    ...(data.phone && { telephone: data.phone }),
    ...(data.email && { email: data.email }),
  };

  if (data.address) {
    Object.assign(baseSchema, {
      address: {
        '@type': 'PostalAddress',
        ...data.address,
      },
    });
  }

  if (data.geo) {
    Object.assign(baseSchema, {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: data.geo.latitude,
        longitude: data.geo.longitude,
      },
    });
  }

  if (data.rating) {
    Object.assign(baseSchema, {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.rating.ratingValue,
        ratingCount: data.rating.ratingCount,
      },
    });
  }

  if (data.reviews && data.reviews.length > 0) {
    Object.assign(baseSchema, {
      review: data.reviews.map(review => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: review.author },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
        },
        reviewBody: review.text,
      })),
    });
  }

  return baseSchema;
};

/**
 * Breadcrumb structured data
 */
export const generateBreadcrumbs = (
  items: Array<{ name: string; url: string }>
): any => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
};

/**
 * FAQ structured data
 */
export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
): any => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};
