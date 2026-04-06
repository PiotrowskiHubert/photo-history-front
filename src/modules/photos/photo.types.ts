export interface PhotoFormData {
  address: string;
  description: string;
  date: Date | null;
  photo: string;
}

export interface PhotoFormErrors {
  address: string | null;
  photo: string | null;
}

