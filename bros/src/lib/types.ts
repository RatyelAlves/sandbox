export type LookingFor =
  | "encontros"
  | "amizade"
  | "relacionamento"
  | "sem_pressa";

export type BodyType = "magro" | "atlético" | "médio" | "grande" | "musculoso";

export type Position = "ativo" | "passivo" | "versátil";

export type PhotoKind = "face" | "body" | "other";

export type PhotoRequestStatus = "pending" | "accepted" | "declined";

export type Profile = {
  id: string;
  alias: string;
  bio: string;
  city: string;
  age: number;
  looking_for: LookingFor;
  discreet_mode: boolean;
  height_cm: number | null;
  weight_kg: number | null;
  body_type: BodyType | null;
  position: Position | null;
  avatar_photo_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Album = {
  id: string;
  user_id: string;
  title: string;
  is_private: boolean;
  created_at: string;
};

export type Photo = {
  id: string;
  user_id: string;
  kind: PhotoKind;
  is_private: boolean;
  path: string;
  album_id: string | null;
  created_at: string;
};

export type PhotoGrant = {
  owner_id: string;
  viewer_id: string;
  created_at: string;
};

export type MediaGrantScope = "all" | "album" | "photo";

export type MediaGrant = {
  id: string;
  owner_id: string;
  viewer_id: string;
  scope: MediaGrantScope;
  album_id: string | null;
  photo_id: string | null;
  created_at: string;
};

export type MediaAccess = {
  all: boolean;
  photoIds: string[];
  albumIds: string[];
};

export type PhotoRequest = {
  id: string;
  owner_id: string;
  requester_id: string;
  status: PhotoRequestStatus;
  created_at: string;
};

export type Like = {
  from_id: string;
  to_id: string;
  created_at: string;
  seen_at: string | null;
};

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  hidden_at: string | null;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  kind?: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  loc_lat: number | null;
  loc_lng: number | null;
  loc_label: string | null;
  created_at: string;
};

export type Block = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};
