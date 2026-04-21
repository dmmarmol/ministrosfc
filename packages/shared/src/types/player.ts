export enum PlayerType {
  REGISTERED = "REGISTERED",
  GUEST = "GUEST",
}

export enum PlayerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

/**
 * Player position codes following Pro Evolution Soccer (PES) naming.
 * GK=Portero, CB=Defensa Central, RB/LB=Lateral, RWB/LWB=Carrilero,
 * DMF=Mediocampista Defensivo, CMF=Central, AMF=Ofensivo, RMF/LMF=Lateral medio,
 * SS=Segundo Delantero, CF=Delantero Centro, RWF/LWF=Extremo.
 */
export enum Position {
  GK = "GK" /** Portero */,
  CB = "CB" /** Defensa Central */,
  RB = "RB" /** Lateral Derecho */,
  LB = "LB" /** Lateral Izquierdo */,
  RWB = "RWB" /** Carrilero Derecho */,
  LWB = "LWB" /** Carrilero Izquierdo */,
  DMF = "DMF" /** Mediocampista Defensivo */,
  CMF = "CMF" /** Mediocampista Central */,
  AMF = "AMF" /** Mediocampista Ofensivo */,
  RMF = "RMF" /** Mediocampista Derecho */,
  LMF = "LMF" /** Mediocampista Izquierdo */,
  SS = "SS" /** Segundo Delantero */,
  CF = "CF" /** Delantero Centro */,
  RWF = "RWF" /** Extremo Derecho */,
  LWF = "LWF" /** Extremo Izquierdo */,
}

export const PositionDisplayName = {
  [Position.GK]: "Portero",
  [Position.CB]: "Defensa Central",
  [Position.RB]: "Lateral Derecho",
  [Position.LB]: "Lateral Izquierdo",
  [Position.RWB]: "Carrilero Derecho",
  [Position.LWB]: "Carrilero Izquierdo",
  [Position.DMF]: "Mediocampista Defensivo",
  [Position.CMF]: "Mediocampista Central",
  [Position.AMF]: "Mediocampista Ofensivo",
  [Position.RMF]: "Mediocampista Derecho",
  [Position.LMF]: "Mediocampista Izquierdo",
  [Position.SS]: "Segundo Delantero",
  [Position.CF]: "Delantero Centro",
  [Position.RWF]: "Extremo Derecho",
  [Position.LWF]: "Extremo Izquierdo",
} as const;

/** Maps each Position enum value to its short code string. */
export const positionMap: Record<Position, string> = {
  [Position.GK]: "GK",
  [Position.CB]: "CB",
  [Position.RB]: "RB",
  [Position.LB]: "LB",
  [Position.RWB]: "RWB",
  [Position.LWB]: "LWB",
  [Position.DMF]: "DMF",
  [Position.CMF]: "CMF",
  [Position.AMF]: "AMF",
  [Position.RMF]: "RMF",
  [Position.LMF]: "LMF",
  [Position.SS]: "SS",
  [Position.CF]: "CF",
  [Position.RWF]: "RWF",
  [Position.LWF]: "LWF",
};

/** Maps Spanish informal position names (lowercase) to their Position enum value. */
export const spanishPositionMap: Record<string, Position> = {
  portero: Position.GK,
  arquero: Position.GK,
  golero: Position.GK,
  "defensa central": Position.CB,
  defensa: Position.CB,
  zaguero: Position.CB,
  central: Position.CB,
  "lateral derecho": Position.RB,
  "lateral izquierdo": Position.LB,
  "carrilero derecho": Position.RWB,
  "carrilero izquierdo": Position.LWB,
  "mediocampista defensivo": Position.DMF,
  "mediocampista central": Position.CMF,
  mediocampista: Position.CMF,
  "mediocampista ofensivo": Position.AMF,
  enganche: Position.AMF,
  "mediocampista derecho": Position.RMF,
  "mediocampista izquierdo": Position.LMF,
  "segundo delantero": Position.SS,
  "delantero centro": Position.CF,
  delantero: Position.CF,
  "extremo derecho": Position.RWF,
  "extremo izquierdo": Position.LWF,
};

export enum Foot {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  AMBIDEXTROUS = "AMBIDEXTROUS",
}

export interface Contact {
  id: string;
  playerId: string;
  phone?: string | null;
  whatsapp?: string | null;
  emergencyContact?: string | null;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string | null;
  address: string | null;
  playerType: PlayerType;
  status: PlayerStatus;
  invitedById: string | null;
  position: Position | null;
  jerseyNumber: number | null;
  dateOfBirth: string | null;
  height: number | null;
  dominantFoot: Foot | null;
  photoUrl: string | null;
  contactInfo: Contact | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerPublic extends Pick<
  Player,
  | "id"
  | "firstName"
  | "lastName"
  | "nickname"
  | "position"
  | "jerseyNumber"
  | "photoUrl"
  | "playerType"
  | "status"
> {}

export interface PlayerCreateDTO {
  firstName: string;
  lastName: string;
  nickname?: string;
  address?: string;
  playerType?: PlayerType;
  position?: Position;
  jerseyNumber?: number;
  dateOfBirth?: string;
  height?: number;
  dominantFoot?: Foot;
  nationalId?: string;
  photoUrl?: string;
  invitedById?: string;
  contact?: {
    phone?: string;
    whatsapp?: string;
    emergencyContact?: string;
  };
}

export interface PlayerUpdateDTO extends Partial<PlayerCreateDTO> {
  status?: PlayerStatus;
}
