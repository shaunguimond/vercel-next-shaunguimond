import Link from 'next/link'
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Nav from './nav';
import MobileNav from './mobile-nav';
import { useState } from 'react';





export default function Header() {
const { systemTheme, theme, setTheme } = useTheme();
const [ nav, setNav ] = useState(false);

const renderThemeChanger = () => {
  const currentTheme = theme === "system" ? systemTheme : theme;
  

  if (currentTheme === "dark") 
    {
      return (
        <SunIcon className="w-8 h-8 text-accent-1" role="button" onClick={() => setTheme("light")} />
    );
  } else {
    return (
      <MoonIcon className="w-8 h-8 text-accent-1" role="button" onClick={() => setTheme("dark")} />
    )

    }

};

  return (
    <div className="fixed flex flex-row m-1 pl-7.5 pr-5 nav-fixed bg-daccent-2">
      <div className="flex flex-row justify-between pb-5 pt-6 items-center w-full"> 
      <h2 className="ml-12 text-2xl font-bold tracking-tight md:tracking-tighter leading-tight">
        <Link href="/" className="hover:underline text-accent-1 font-serif whitespace-nowrap">
          Shaun Guimond
        </Link>
      </h2>
      <Nav />
        <div className="flex flex-row gap-5">
          <div>{renderThemeChanger()}</div>
          <div
            onClick={() => setNav(!nav)}
            className="cursor-pointer pr-4 z-10 text-gray-500 lg:hidden">
            {nav ? <XMarkIcon className="w-8 h-8 text-accent-1" /> : <Bars3Icon className="w-8 h-8 text-accent-1" />}
          </div>

          {nav && (
            <MobileNav setNav={setNav}/>
          )}

        </div>
      </div>
    </div>
  )
}
