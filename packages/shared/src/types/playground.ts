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

export type PlaygroundOption = {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export interface PlaygroundCreatePayload {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface PlaygroundUpdatePayload {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
