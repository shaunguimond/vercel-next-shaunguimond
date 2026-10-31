import { navLinks } from "../lib/constants";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

interface MobileNavProps {
    setNav: (nav: boolean) => void;
    themeToggle: ReactNode;
}

export default function MobileNav({ setNav, themeToggle }: MobileNavProps) {
    const handleClick = () => {
        setNav(false);
    }
    
    return(
        <nav aria-label="Mobile navigation" className="absolute left-0 top-0 flex h-screen w-full flex-col items-center justify-center bg-accent-3 dark:bg-daccent-1">
            <ul className="text-center">
                <li className="my-3">
                    <Link className="text-black dark:text-accent-1 my-6 cursor-pointer capitalize text-3xl" href="/" onClick={handleClick}>Home</Link>
                </li>
                {navLinks.map((link, index) => {
                return (
                        <li key={index} className="my-3 ">
                            <Link className="text-black dark:text-accent-1 my-6 cursor-pointer capitalize text-3xl" href={link.path} onClick={handleClick}>{link.name}</Link>
                        </li>
                );
                })}
            </ul>
            <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/20 dark:border-white/20">
                    {themeToggle}
                </div>
                <Link
                    href="/search"
                    onClick={handleClick}
                    aria-label="Search posts and categories"
                    title="Search"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-black/20 text-black dark:border-white/20 dark:text-accent-1"
                >
                    <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
                </Link>
            </div>
        </nav>
    )
};

