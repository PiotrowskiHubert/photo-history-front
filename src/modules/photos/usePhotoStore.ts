import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/shared/services/api';
import type { PhotoFormData, PhotoMarker, PhotoDetail, BoundingBox } from './photo.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const usePhotoStore = defineStore('photos', () => {
  const markers = ref<PhotoMarker[]>([]);

  /** Upload a photo with metadata to the backend */
  async function uploadPhoto(formData: PhotoFormData, lat: number, lng: number): Promise<void> {
    const fd = new FormData();
    if (formData.file) fd.append('file', formData.file);
    fd.append('latitude', lat.toFixed(6));
    fd.append('longitude', lng.toFixed(6));
    if (formData.description) fd.append('description', formData.description);
    if (formData.address) fd.append('address', formData.address);
    if (formData.date) fd.append('takenAt', formData.date.toISOString());

    const { data } = await api.post('/api/photos/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Backend returns full PhotoResponse — map to slim PhotoMarker for the map
    // Derive thumbnail URL from the returned fileName: replace extension with _thumb.jpg
    const thumbUrl = API_URL + '/uploads/' + data.fileName.replace(/\.[^.]+$/, '_thumb.jpg');
    markers.value.push({
      id: data.id,
      lat: data.latitude,
      lng: data.longitude,
      thumbnailUrl: thumbUrl,
      takenAt: data.takenAt,
    });
  }

  /** Fetch photos — optionally filtered by map bounding box */
  async function fetchPhotos(bounds?: BoundingBox): Promise<void> {
    const params = bounds
      ? {
          minLat: bounds.minLat.toFixed(6),
          maxLat: bounds.maxLat.toFixed(6),
          minLng: bounds.minLng.toFixed(6),
          maxLng: bounds.maxLng.toFixed(6),
        }
      : undefined;

    const { data } = await api.get('/api/photos', { params });
    markers.value = data.map((p: any) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      thumbnailUrl: API_URL + p.thumbnailUrl,
      takenAt: p.takenAt,
    }));
  }

  /** Fetch full photo detail by ID for the modal */
  async function fetchPhotoDetail(id: string): Promise<PhotoDetail> {
    const { data } = await api.get(`/api/photos/${id}`);
    return {
      id: data.id,
      url: API_URL + data.url,
      description: data.description,
      takenAt: data.takenAt,
      address: data.address,
      uploaderUsername: data.uploaderUsername,
    };
  }

  return { markers, uploadPhoto, fetchPhotos, fetchPhotoDetail };
});
