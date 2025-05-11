import { getMediaFromSupabase } from '@/utils/supabase';
import MediaGallery from '@/components/MediaGallery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const { data: mediaList, totalCount } = await getMediaFromSupabase(1, 9);
  const totalItems = totalCount || 0;

  return (
    <main className="min-h-screen bg-gray-100 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-600 mb-6 sm:mb-8">
          Media Upload System
        </h1>

        <MediaGallery initialMedia={mediaList || []} totalItems={totalItems} />
      </div>
    </main>
  );
}
