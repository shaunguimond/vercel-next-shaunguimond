import Link from 'next/link'
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import Nav from './nav';



export default function Header() {
const { systemTheme, theme, setTheme } = useTheme();

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
      <h2 className="ml-12 text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight">
        <Link href="/" className="hover:underline text-accent-1 font-serif whitespace-nowrap">
          Shaun Guimond
        </Link>
      </h2>
      <Nav></Nav>
      <div>{renderThemeChanger()}</div>

      </div>
    </div>
  )
}
