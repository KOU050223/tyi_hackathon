import {
  signInWithPopup,
  GithubAuthProvider,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const provider = new GithubAuthProvider();

export async function signInWithGitHub(): Promise<User> {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  await setDoc(
    doc(db, "users", user.uid),
    {
      githubId: user.providerData[0]?.uid ?? "",
      githubUsername: user.displayName ?? user.providerData[0]?.displayName ?? "",
      avatarUrl: user.photoURL ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return user;
}

export async function signOut(): Promise<void> {
  await auth.signOut();
}

export function onAuthChanged(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
