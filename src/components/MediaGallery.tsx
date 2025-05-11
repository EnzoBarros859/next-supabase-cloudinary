'use client';

import { useState } from 'react';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { saveMediaToSupabase, getMediaFromSupabase } from '@/utils/supabase';

interface Media {
  id: number;
  title: string;
  type: 'image' | 'video';
  cloudinary_url: string;
  cloudinary_public_id: string;
  created_at: string;
}

interface MediaGalleryProps {
  initialMedia: Media[];
  totalItems: number;
}

export default function MediaGallery({ initialMedia, totalItems: initialTotalItems }: MediaGalleryProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<Media[]>(initialMedia);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(initialTotalItems);
  const itemsPerPage = 9;

  const loadMedia = async (page: number) => {
    try {
      const { data, totalCount } = await getMediaFromSupabase(page, itemsPerPage);
      setMediaList(data || []);
      setTotalItems(totalCount || 0);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select an image or video file');
        setFile(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please select a file and provide a title');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload to Cloudinary
      const cloudinaryData = await uploadToCloudinary(file);

      // Save to Supabase
      const mediaData = {
        title,
        type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
        cloudinary_url: cloudinaryData.url,
        cloudinary_public_id: cloudinaryData.public_id,
      };

      await saveMediaToSupabase(mediaData);
      
      // Refresh media list
      await loadMedia(currentPage);

      // Reset form
      setFile(null);
      setTitle('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await loadMedia(newPage);
  };

  return (
    <>
      {/* Upload Form */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter media title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose a file (Image or Video)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="mt-6 sm:mt-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Media Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {mediaList.map((media) => (
            <div key={media.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {media.type === 'image' ? (
                  <img
                    src={media.cloudinary_url}
                    alt={media.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full">
                    <video
                      src={media.cloudinary_url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  </div>
                )}
              </div>
              <div className="p-3 sm:p-4 flex-grow">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-1">{media.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {new Date(media.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex justify-center items-center gap-3 sm:gap-4">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm sm:text-base text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
} 