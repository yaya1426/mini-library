"use client";

import { BookOpen, ChevronDown, LogOut, Shield, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface AppHeaderUser {
  id: string;
  fullName: string;
  email: string;
  role: "MEMBER" | "LIBRARIAN";
}

export interface AppHeaderProps {
  user?: AppHeaderUser | null;
  onLogout?: () => void | Promise<void>;
  className?: string;
}

export function AppHeader({ user, onLogout, className }: AppHeaderProps) {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    {
      href: "/books",
      label: tNav("catalog"),
      active: pathname === "/books" || pathname.startsWith("/books/"),
    },
    {
      href: "/loans",
      label: tNav("myLoans"),
      active: pathname === "/loans" || pathname.startsWith("/loans/"),
    },
    ...(user?.role === "LIBRARIAN"
      ? [
          {
            href: "/admin",
            label: tNav("librarian"),
            active: pathname === "/admin" || pathname.startsWith("/admin/"),
          },
        ]
      : []),
  ];

  return (
    <header
      className={cn(
        "w-full bg-white text-black border-b-4 border-black",
        className,
      )}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href={user ? "/books" : "/"}
            className="inline-flex items-center gap-2.5 text-xl font-bold ltr:uppercase ltr:tracking-tight"
          >
            <span className="inline-flex size-10 items-center justify-center bg-black text-white border-3 border-black shadow-xs">
              <BookOpen className="size-5" strokeWidth={2.5} />
            </span>
            <span>{tCommon("appName")}</span>
          </Link>

          {user && (
            <nav aria-label={tCommon("appName")} className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center px-3.5 text-sm font-bold ltr:uppercase ltr:tracking-wider border-2 transition-colors",
                    item.active
                      ? "bg-black text-white border-black shadow-xs"
                      : "bg-white text-black border-transparent hover:border-black hover:bg-gray-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2 h-[46px]">
                  {user.role === "LIBRARIAN" ? (
                    <Shield className="size-4" strokeWidth={2.5} />
                  ) : (
                    <User className="size-4" strokeWidth={2.5} />
                  )}
                  <span className="max-w-36 truncate">
                    <bdi>{user.fullName}</bdi>
                  </span>
                  <ChevronDown className="size-4" strokeWidth={2.5} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-black font-bold text-sm">
                    <bdi>{user.fullName}</bdi>
                  </span>
                  <span
                    dir="ltr"
                    className="text-xs font-mono text-gray-600 truncate normal-case tracking-normal"
                  >
                    {user.email}
                  </span>
                  <span className="mt-1 inline-block text-xs font-bold text-black ltr:uppercase ltr:tracking-wider">
                    {user.role === "LIBRARIAN"
                      ? tNav("roleLibrarian")
                      : tNav("roleMember")}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onLogout && (
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      void onLogout();
                    }}
                  >
                    <LogOut className="size-4" strokeWidth={2.5} />
                    <span>{tNav("logout")}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="secondary" size="sm" className="h-[46px]">
                <Link href="/login">{tNav("login")}</Link>
              </Button>
              <Button asChild variant="default" size="sm" className="h-[46px]">
                <Link href="/signup">{tNav("signup")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
