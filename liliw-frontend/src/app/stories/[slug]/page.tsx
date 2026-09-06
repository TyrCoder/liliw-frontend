import StoryDetail from './StoryDetail';

/**
 * Server wrapper — see attractions/[id]/page.tsx for why. The component below
 * reads the slug through useParams and is unchanged.
 */
export default function StoryPage() {
  return <StoryDetail />;
}
