import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/shared/services/api';
import type { PhotoFormData, PhotoMarker } from './photo.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export const usePhotoStore = defineStore('photos', () => {
  const markers = ref<PhotoMarker[]>([]);

  /** Upload a photo with metadata to the backend */
  async function uploadPhoto(formData: PhotoFormData, lat: number, lng: number): Promise<void> {
    const fd = new FormData();
    if (formData.file) fd.append('file', formData.file);
    fd.append('latitude', lat.toString());
    fd.append('longitude', lng.toString());
    if (formData.description) fd.append('description', formData.description);
    if (formData.address) fd.append('address', formData.address);
    if (formData.date) fd.append('takenAt', formData.date.toISOString());

    const { data } = await api.post('/api/photos/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    markers.value.push({
      id: data.id,
      lat: data.latitude,
      lng: data.longitude,
      url: API_URL + data.url,
      description: data.description,
      address: data.address,
      takenAt: data.takenAt,
    });
  }

  /** Fetch all photos from the backend */
  async function fetchPhotos(): Promise<void> {
    const { data } = await api.get('/api/photos');
    markers.value = data.map((p: any) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      url: API_URL + p.url,
      description: p.description,
      address: p.address,
      takenAt: p.takenAt,
    }));
  }

  return { markers, uploadPhoto, fetchPhotos };
});

