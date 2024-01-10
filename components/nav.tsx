import { navLinks } from "../lib/constants";
import Link from "next/link";

export default function Nav() {
    
    return(
        <nav className="flex flex-row justify-around gap-10"> 
            
            {navLinks.map((link, index) => {
            return (
                <ul>
                    <li key={index}>
                        <Link className="text-accent-1" href={link.path}>{link.name}</Link>
                    </li>
                </ul>
            );
            })}
        </nav>
    )
};



