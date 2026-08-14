'use client';

import { LiliwScene } from '@/components/liliw/festive';

/**
 * The login modal's header.
 *
 * Thin on purpose. The scene, the vignette, the lettering and the wave live in
 * LiliwScene, which the page banners use too, so the modal and every page are
 * one object at two sizes rather than two things kept in step by hand.
 */
export default function MarqueeHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return <LiliwScene size="modal" eyebrow="Liliw Tourism" title={title} subtitle={subtitle} />;
}
