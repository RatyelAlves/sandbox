import type { ReactNode } from "react";
import type { AccountType } from "@/lib/auth-context";
import { BottomNav } from "./BottomNav";
import { SidebarNav } from "./SidebarNav";

interface AppBackgroundProps {
  children: ReactNode;
  windowScroll?: boolean;
}

export function AppBackground({ children, windowScroll = false }: AppBackgroundProps) {
  return (
    <div
      className={`bg-pattern-main relative min-h-dvh ${
        windowScroll
          ? "md:min-h-dvh md:h-auto md:overflow-visible"
          : "md:h-dvh md:min-h-0 md:overflow-hidden"
      }`}
    >
      <div
        className={`relative min-h-dvh ${
          windowScroll ? "md:min-h-dvh md:h-auto" : "md:h-full md:min-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

type AppShellVariant = "default" | "auth" | "scroll";

interface AppShellProps {
  children: ReactNode;
  showNav?: boolean;
  accountType?: AccountType;
  variant?: AppShellVariant;
  className?: string;
  desktopInset?: boolean;
}

export function AppShell({
  children,
  showNav = false,
  accountType,
  variant = "default",
  className = "",
  desktopInset = false,
}: AppShellProps) {
  const hasNav = showNav && accountType;
  const isAuth = variant === "auth";
  const isScroll = variant === "scroll";
  const isLoggedInLayout = hasNav;
  const useWindowScroll = isScroll;
  const lockScrollOnDesktop = !isScroll && (isLoggedInLayout || desktopInset);

  const mainPadding = desktopInset
    ? hasNav
      ? "px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:p-6"
      : "px-4 py-6 md:p-6"
    : isAuth
      ? "justify-center px-4 py-8 md:px-8 md:py-12"
      : isLoggedInLayout
        ? "px-4 pt-4 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:py-6 md:pb-8"
        : "px-4 py-6 md:px-8 md:py-10";

  return (
    <AppBackground windowScroll={useWindowScroll}>
      {hasNav && <SidebarNav accountType={accountType} />}

      <div
        className={[
          "flex flex-col",
          hasNav ? "md:ml-[260px]" : "",
          lockScrollOnDesktop || isAuth
            ? "h-dvh max-h-dvh overflow-hidden"
            : "min-h-dvh",
        ].join(" ")}
      >
        <main
          className={[
            "relative flex flex-1 flex-col overscroll-contain",
            useWindowScroll
              ? "overflow-y-auto md:overflow-visible"
              : lockScrollOnDesktop
                ? "min-h-0 flex-1 overflow-hidden"
                : isAuth
                  ? "min-h-0 flex-1 overflow-y-auto"
                  : "overflow-y-auto",
            isAuth ? "justify-center" : "",
            mainPadding,
            className,
          ].join(" ")}
        >
          <div
            className={
              isAuth
                ? "mx-auto flex w-full max-w-sm flex-col items-center justify-center md:max-w-md"
                : "relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col md:max-w-none"
            }
          >
            {children}
          </div>
        </main>

        {hasNav && <BottomNav accountType={accountType} />}
      </div>
    </AppBackground>
  );
}
