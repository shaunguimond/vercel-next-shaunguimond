import { navLinks } from "../lib/constants";
import Link from "next/link";

export default function MobileNav() {
    
    return(
        <nav className="flex flex-col gap-5 justify-center items-center absolute top-0 left-0 w-full h-screen bg-accent-3 dark:bg-daccent-1 "> 
            <Link href="/" className="text-black dark:text-accent-1 my-6 cursor-pointer capitalize text-3xl" >Home</Link>
            {navLinks.map((link, index) => {
            return (
                <ul>
                    <li key={index}>
                        <Link className="text-black dark:text-accent-1 my-6 cursor-pointer capitalize text-3xl" href={link.path}>{link.name}</Link>
                    </li>
                </ul>
            );
            })}
        </nav>
    )
};



