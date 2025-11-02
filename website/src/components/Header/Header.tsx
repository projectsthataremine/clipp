"use client";

import Link from "next/link";
import Image from "next/image";
import useUser from "@/app/hooks/useUser";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Cross1Icon, ExitIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import supabase from "@/utils/supabase/client";
import { motion } from "framer-motion";

const logoVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const tabContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const tabItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const buttonVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

type HeaderProps = {
  showLogoOnly?: boolean;
  isLoggedIn?: boolean;
  hideTabs?: boolean;
};

export default function Header({
  showLogoOnly = false,
  hideTabs = false,
}: HeaderProps) {
  const { user } = useUser();
  const isLoggedIn = user !== null;
  const router = useRouter();
  const pathname = usePathname();
  const isAccountPage = pathname === "/account";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      router.push("/");
    });
  };

  return (
    <header className="relative w-full">
      <motion.div
        className="mx-auto flex h-[70px] max-w-[1000px] items-center justify-between px-5"
        initial="hidden"
        animate="visible"
      >
        {/* Logo section */}
        <motion.div variants={logoVariants}>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Clipp logo" width={36} height={36} />
            <span className="text-xl font-semibold text-gray-800 -tracking-[0.5px]">
              Clipp
            </span>
          </Link>
        </motion.div>

        {/* Tabs */}
        {!showLogoOnly && !hideTabs && (
          <motion.nav
            className="hidden gap-10 md:flex"
            variants={tabContainerVariants}
          >
            {["how-it-works", "updates", "help"].map((path, i) => (
              <motion.div key={i} variants={tabItemVariants}>
                <Link
                  href={`/${path}`}
                  className="text-sm font-medium text-gray-800 hover:text-dodger-blue-600"
                >
                  {path
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        )}

        {/* Go to account */}
        {!showLogoOnly && !isAccountPage && !mobileMenuOpen && (
          <motion.div variants={buttonVariants}>
            <Link
              href={isLoggedIn ? "/account" : "/sign-in"}
              className="hidden md:inline-block rounded-full bg-dodger-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-dodger-blue-600"
            >
              {isLoggedIn ? "Go to account" : "Try for free"}
            </Link>
          </motion.div>
        )}

        {/* Mobile menu button (non-animated) */}
        {!showLogoOnly && (
          <button
            className="ml-auto p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <Cross1Icon className="h-6 w-6 text-white" />
            ) : (
              <HamburgerMenuIcon className="h-6 w-6 text-gray-800" />
            )}
          </button>
        )}

        {/* Logout (account page) */}
        {isLoggedIn && isAccountPage && (
          <motion.div variants={buttonVariants} className="hidden md:block">
            <button
              title="Logout"
              onClick={handleLogout}
              className="group flex items-center gap-2 rounded-full bg-red-50 p-2 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white cursor-pointer"
            >
              <ExitIcon className="h-4 w-4 transition group-hover:text-white" />
            </button>
          </motion.div>
        )}
      </motion.div>

      {mobileMenuOpen && (
        <div className="fixed top-0 left-0 z-50 flex h-screen w-screen flex-col items-center justify-center bg-dodger-blue-500">
          <button
            title="Close menu"
            className="absolute right-8 top-4 p-2 text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Cross1Icon className="h-6 w-6" />
          </button>

          <nav className="flex flex-col items-center gap-8 text-2xl font-semibold text-white">
            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)}>
              How it works
            </Link>
            <Link href="/updates" onClick={() => setMobileMenuOpen(false)}>
              Updates
            </Link>
            <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
              Help
            </Link>
            <Link
              href={isLoggedIn ? "/account" : "/sign-in"}
              onClick={() => setMobileMenuOpen(false)}
            >
              {isLoggedIn ? "Go to account" : "Try for free"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
