import type { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isFullscreenPage =
    ["/face", "/voice"].includes(location.pathname) || location.pathname.startsWith("/display/");

  if (isFullscreenPage) {
    return <>{children}</>;
  }

  return (
    <div className="layout">
      <Navigation />
      <main className="main-content">{children}</main>
    </div>
  );
}
