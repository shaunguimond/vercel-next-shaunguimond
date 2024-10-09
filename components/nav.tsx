import { navLinks } from "../lib/constants";
import Link from "next/link";

export default function Nav() {
    
    return(
        <nav className="hidden lg:flex"> 
            <ul className="lg:flex flex-row justify-around gap-10">
                {navLinks.map((link, index) => {
                return (
                        <li key={index}>
                            <Link key={`link-${index}`} className="text-accent-1" href={link.path}>{link.name}</Link>
                        </li>
                );
                })}
            </ul>
        </nav>
    )
};



