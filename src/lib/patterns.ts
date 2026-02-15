import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  writeBatch,
  increment,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { FirestorePattern, PatternData } from "@/types/firebase";
import type { Expression } from "@/types/expression";
import type { DeviceType } from "@/types/device";

function toPatternData(id: string, data: DocumentData): PatternData {
  return {
    id,
    userId: data.userId ?? "",
    name: data.name ?? "",
    expressionType: data.expressionType ?? "neutral",
    deviceType: data.deviceType ?? "smartphone",
    color: data.color ?? "#00FF00",
    gridData: data.gridData ?? [],
    previewImageUrl: data.previewImageUrl,
    isPublic: data.isPublic ?? false,
    downloads: data.downloads ?? 0,
    likes: data.likes ?? 0,
    tags: data.tags ?? [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function createPattern(input: {
  userId: string;
  name: string;
  expressionType: Expression;
  deviceType: DeviceType;
  color: string;
  gridData: number[][];
  isPublic: boolean;
  tags: string[];
  previewImageUrl?: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, "patterns"), {
    ...input,
    downloads: 0,
    likes: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPattern(id: string): Promise<PatternData | null> {
  const snap = await getDoc(doc(db, "patterns", id));
  if (!snap.exists()) return null;
  return toPatternData(snap.id, snap.data());
}

export async function getPublicPatterns(
  options: {
    sortBy?: "latest" | "popular" | "downloads";
    expressionType?: Expression;
    deviceType?: DeviceType;
    limit?: number;
    startAfter?: QueryDocumentSnapshot;
  } = {},
): Promise<{ patterns: PatternData[]; lastDoc: QueryDocumentSnapshot | null }> {
  const {
    sortBy = "latest",
    expressionType,
    deviceType,
    limit: limitCount = 20,
    startAfter: startAfterDoc,
  } = options;

  const filters = [where("isPublic", "==", true)];

  if (expressionType) {
    filters.push(where("expressionType", "==", expressionType));
  }
  if (deviceType) {
    filters.push(where("deviceType", "==", deviceType));
  }

  let sortConstraint;
  switch (sortBy) {
    case "popular":
      sortConstraint = orderBy("likes", "desc");
      break;
    case "downloads":
      sortConstraint = orderBy("downloads", "desc");
      break;
    default:
      sortConstraint = orderBy("createdAt", "desc");
  }

  const q = startAfterDoc
    ? query(
        collection(db, "patterns"),
        ...filters,
        sortConstraint,
        startAfter(startAfterDoc),
        firestoreLimit(limitCount),
      )
    : query(
        collection(db, "patterns"),
        ...filters,
        sortConstraint,
        firestoreLimit(limitCount),
      );
  const snapshot = await getDocs(q);

  const patterns = snapshot.docs.map((d) => toPatternData(d.id, d.data()));
  const lastDoc =
    snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return { patterns, lastDoc };
}

export async function getMyPatterns(userId: string): Promise<PatternData[]> {
  const q = query(
    collection(db, "patterns"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => toPatternData(d.id, d.data()));
}

export async function updatePattern(
  id: string,
  updates: Partial<
    Pick<
      FirestorePattern,
      | "name"
      | "expressionType"
      | "deviceType"
      | "color"
      | "gridData"
      | "isPublic"
      | "tags"
      | "previewImageUrl"
    >
  >,
): Promise<void> {
  await updateDoc(doc(db, "patterns", id), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePattern(id: string): Promise<void> {
  await deleteDoc(doc(db, "patterns", id));
}

export async function likePattern(
  patternId: string,
  userId: string,
): Promise<void> {
  const batch = writeBatch(db);
  const likeRef = doc(db, "patterns", patternId, "likedBy", userId);
  batch.set(likeRef, { likedAt: serverTimestamp() });
  const patternRef = doc(db, "patterns", patternId);
  batch.update(patternRef, { likes: increment(1) });
  await batch.commit();
}

export async function unlikePattern(
  patternId: string,
  userId: string,
): Promise<void> {
  const batch = writeBatch(db);
  const likeRef = doc(db, "patterns", patternId, "likedBy", userId);
  batch.delete(likeRef);
  const patternRef = doc(db, "patterns", patternId);
  batch.update(patternRef, { likes: increment(-1) });
  await batch.commit();
}

export async function isLikedByMe(
  patternId: string,
  userId: string,
): Promise<boolean> {
  const likeDoc = await getDoc(
    doc(db, "patterns", patternId, "likedBy", userId),
  );
  return likeDoc.exists();
}

export async function incrementDownloads(id: string): Promise<void> {
  await updateDoc(doc(db, "patterns", id), {
    downloads: increment(1),
  });
}
