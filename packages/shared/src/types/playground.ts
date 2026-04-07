export interface Playground {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string | null;
  gameCount: number;
}

export interface PlaygroundCreatePayload {
  name: string;
  address: string;
}

export interface PlaygroundUpdatePayload {
  name?: string;
  address?: string;
}
