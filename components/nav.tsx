import { navLinks } from '../lib/constants'
import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="hidden lg:flex">
      <ul className="lg:flex flex-row justify-around gap-10">
        {navLinks.map((link) => {
          return (
            <li key={link.path}>
              <Link
                className="rounded-sm text-accent-1 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
                href={link.path}
              >
                {link.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
