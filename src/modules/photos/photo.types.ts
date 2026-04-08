export interface PhotoFormData {
  address: string;
  description: string;
  date: Date | null;
  file: File | null;
}

export interface PhotoFormErrors {
  address: string | null;
  photo: string | null;
}

// Lightweight marker data from GET /api/photos — only what the map needs
export interface PhotoMarker {
  id: string;
  lat: number;
  lng: number;
  thumbnailUrl: string;
  takenAt?: string;
}

// Full detail data from GET /api/photos/{id}
export interface PhotoDetail {
  id: string;
  url: string;
  description?: string;
  takenAt?: string;
  address?: string;
  uploaderUsername: string;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// User's own photo from GET /api/photos/my
export interface UserPhoto {
  id: string;
  thumbnailUrl: string;
  description?: string;
  takenAt?: string;
  address?: string;
  uploadedAt: string;
}

