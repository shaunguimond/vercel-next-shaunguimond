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
        <SunIcon className="w-7 h-7" role="button" onClick={() => setTheme("light")} />
    );
  } else {
    return (
      <MoonIcon className="w-7 h-7" role="button" onClick={() => setTheme("dark")} />
    )

    }

};

  return (
    <div className="flex flex-row justify-between bg-daccent-1 pb-6 pt-4"> 
    <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight">
      <Link href="/" className="hover:underline text-accent-1 font-serif">
        Shaun Guimond
      </Link>
    </h2>
    <Nav></Nav>
    <div>{renderThemeChanger()}</div>

    </div>
  )
}
