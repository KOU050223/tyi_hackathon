import type { Timestamp } from "firebase/firestore";
import type { Expression } from "./expression";
import type { DeviceType } from "./device";

export interface FirestorePattern {
  userId: string;
  name: string;
  expressionType: Expression;
  deviceType: DeviceType;
  color: string;
  gridData: number[][];
  previewImageUrl?: string;
  isPublic: boolean;
  downloads: number;
  likes: number;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FirestoreUser {
  githubId: string;
  githubUsername: string;
  avatarUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PatternData {
  id: string;
  userId: string;
  name: string;
  expressionType: Expression;
  deviceType: DeviceType;
  color: string;
  gridData: number[][];
  previewImageUrl?: string;
  isPublic: boolean;
  downloads: number;
  likes: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
