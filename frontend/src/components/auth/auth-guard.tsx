"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isCuetEmail } from "@/lib/auth/email";

const PUBLIC_ROUTES = ["/", "/login", "/auth/callback"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // If it's a public route, allow access
      if (PUBLIC_ROUTES.includes(pathname)) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // For protected routes, check authentication
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user || !isCuetEmail(data.user.email)) {
        // Redirect to login
        const redirectUrl = new URL("/login", window.location.origin);
        redirectUrl.searchParams.set("error", "auth_required");
        redirectUrl.searchParams.set("next", pathname);
        router.replace(redirectUrl.toString());
      } else {
        setIsAuthorized(true);
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink/60">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}