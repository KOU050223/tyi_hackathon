import { useEffect } from "react";
import { onAuthChanged } from "@/lib/auth";
import { useAuthStore } from "@/stores/authStore";

export function useAuthInit() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [setUser, setLoading]);
}
