import type { Metadata } from 'next';
import PageShell from '@/components/page/PageShell';
import { photos } from '@/content/photos';
import PhotoGrid from './PhotoGrid';

export const metadata: Metadata = { title: 'Photos' };

/*
 * TEMPLATE: photo gallery with a lightbox. Add pictures in content/photos.ts.
 * Click a photo to open it big; arrow keys move between them, Esc closes.
 */
export default function PhotosPage() {
  return (
    <PageShell slug="photos">
      <PhotoGrid photos={photos} />
    </PageShell>
  );
}
