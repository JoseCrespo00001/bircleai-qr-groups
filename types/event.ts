export type Member = {
  userId: string;
  name: string;
  emoji?: string;
  joinedAt: number;
};

export type Group = {
  id: string;
  name?: string;
  closed?: boolean;
  members: Member[];
  createdAt: number;
};

export type EventState = {
  code: string;
  createdAt: number;
  groups: Group[];
};

export type PusherEvent =
  | { type: "group:created"; group: Group }
  | { type: "group:updated"; group: Group }
  | { type: "group:deleted"; groupId: string };
