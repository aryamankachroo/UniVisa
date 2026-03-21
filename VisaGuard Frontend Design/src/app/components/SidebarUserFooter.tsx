import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";

const API_BASE =
  (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:8000";

function universityFromLocalStorage(): string | null {
  try {
    const raw = localStorage.getItem("immigration_case_input");
    if (!raw) return null;
    const j = JSON.parse(raw) as { university?: string; university_name?: string };
    return j.university_name?.trim() || j.university?.trim() || null;
  } catch {
    return null;
  }
}

export type SidebarUserFooterProps = {
  /** When set, replaces Clerk-derived display name (e.g. questionnaire full name on Profile). */
  nameOverride?: string | null;
  /**
   * When set, replaces API/localStorage fetch for university.
   * Pass `null` to hide the line without fetching. Omit to fetch as usual.
   */
  universityOverride?: string | null;
};

/**
 * Bottom of app sidebar: signed-in user name (Clerk) + university (saved case / localStorage), Sign out.
 * Same layout/classes everywhere so truncation and typography stay consistent.
 */
export function SidebarUserFooter({ nameOverride, universityOverride }: SidebarUserFooterProps = {}) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [sidebarUniversity, setSidebarUniversity] = useState<string | null>(null);

  const clerkName =
    user && (user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim())
      ? user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
      : null;

  const displayName =
    (typeof nameOverride === "string" && nameOverride.trim()) ? nameOverride.trim() : clerkName ?? "Student";

  useEffect(() => {
    if (universityOverride !== undefined) {
      setSidebarUniversity(null);
      return;
    }
    if (!isLoaded) return;
    if (!user?.id) {
      setSidebarUniversity(universityFromLocalStorage());
      return;
    }

    fetch(`${API_BASE}/api/cases/me?clerk_user_id=${encodeURIComponent(user.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profile?: { university?: string }; questionnaire?: { university?: string } } | null) => {
        const u = data?.profile?.university ?? data?.questionnaire?.university ?? universityFromLocalStorage();
        setSidebarUniversity(u ?? null);
      })
      .catch(() => setSidebarUniversity(universityFromLocalStorage()));
  }, [isLoaded, user?.id, universityOverride]);

  const universityLine =
    universityOverride !== undefined
      ? universityOverride && String(universityOverride).trim()
        ? String(universityOverride).trim()
        : null
      : sidebarUniversity;

  return (
    <div className="p-4 border-t border-border">
      <div className="px-4 py-3 min-w-0">
        <div className="font-medium truncate">{displayName}</div>
        {universityLine ? (
          <div className="text-sm text-muted-foreground truncate">{universityLine}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => signOut({ redirectUrl: "/" })}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground mt-2"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm">Sign Out</span>
      </button>
    </div>
  );
}
