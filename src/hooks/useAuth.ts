import { useAuthStore } from "@/stores/authStore";
import { signInWithGitHub, signOut as firebaseSignOut } from "@/lib/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn: signInWithGitHub,
    signOut: firebaseSignOut,
  };
}
