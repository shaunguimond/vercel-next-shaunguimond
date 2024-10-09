import { navLinks } from "../lib/constants";
import Link from "next/link";

interface MobileNavProps {
    setNav: (nav: boolean) => void;
}

export default function MobileNav({ setNav }: MobileNavProps) {
    const handleClick = () => {
        setNav(false);
    }
    
    return(
        <nav className="flex flex-col gap-5 justify-center items-center absolute top-0 left-0 w-full h-screen bg-accent-3 dark:bg-daccent-1 "> 
            <ul>
                <li className="my-3">
                    <Link className="text-black dark:text-accent-1 my-6 cursor-pointer capitalize text-3xl" href="/" onClick={handleClick}>Home</Link>
                </li>
                {navLinks.map((link, index) => {
                return (
                        <li key={index} className="my-3 ">
                            <Link key={`link-${index}`} className="text-black dark:text-accent-1 my-6 cursor-pointer capitalize text-3xl" href={link.path} onClick={handleClick}>{link.name}</Link>
                        </li>
                );
                })}
            </ul>
        </nav>
    )
};



