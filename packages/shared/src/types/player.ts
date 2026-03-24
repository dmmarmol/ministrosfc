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
  GK  = "GK",
  CB  = "CB",
  RB  = "RB",
  LB  = "LB",
  RWB = "RWB",
  LWB = "LWB",
  DMF = "DMF",
  CMF = "CMF",
  AMF = "AMF",
  RMF = "RMF",
  LMF = "LMF",
  SS  = "SS",
  CF  = "CF",
  RWF = "RWF",
  LWF = "LWF",
}

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
  name: string;
  nickname?: string | null;
  playerType: PlayerType;
  status: PlayerStatus;
  invitedById?: string | null;
  position?: Position | null;
  jerseyNumber?: number | null;
  dateOfBirth?: string | null;
  height?: number | null;
  dominantFoot?: Foot | null;
  photoUrl?: string | null;
  contactInfo?: Contact | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerPublic extends Pick<
  Player,
  | "id"
  | "name"
  | "nickname"
  | "position"
  | "jerseyNumber"
  | "photoUrl"
  | "playerType"
  | "status"
> {}

export interface PlayerCreateDTO {
  name: string;
  nickname?: string;
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
