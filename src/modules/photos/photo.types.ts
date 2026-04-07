export interface PhotoFormData {
  address: string;
  description: string;
  date: Date | null;
  file: File | null;         // actual File object, replaces photo: string
}

export interface PhotoFormErrors {
  address: string | null;
  photo: string | null;
}

export interface PhotoMarker {
  id: string;
  lat: number;
  lng: number;
  url: string;
  description?: string;
  address?: string;
  takenAt?: string;
}
