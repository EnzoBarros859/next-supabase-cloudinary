'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<Media[]>([]);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const data = await getMediaFromSupabase();
      setMediaList(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

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
      console.log(cloudinaryData);
      // Save to Supabase
      const mediaData = {
        title,
        type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
        cloudinary_url: cloudinaryData.url,
        cloudinary_public_id: cloudinaryData.public_id,
      };

      await saveMediaToSupabase(mediaData);

      // Refresh media list
      await loadMedia();

      // Reset form
      setFile(null);
      setTitle('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          Media Upload System
        </h1>

        {/* Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-black w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaList.map((media) => (
            <div key={media.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {media.type === 'image' ? (
                <img
                  src={media.cloudinary_url}
                  alt={media.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={media.cloudinary_url}
                  controls
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{media.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(media.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
