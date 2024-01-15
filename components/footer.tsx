import Container from './container'
import { EXAMPLE_PATH } from '../lib/constants'
import { LinkedIn } from '../lib/icons';
import { Polywork } from '../lib/icons';
import { Github } from '../lib/icons';
import { Threads } from '../lib/icons';
import SectionSeparator from './section-separator';

/*
export default function Footer() {
  return (
    <footer className="bg-accent-1 border-t border-accent-2">
      <Container>
        <div className="py-28 flex flex-col lg:flex-row items-center">
          <h3 className="text-4xl lg:text-5xl font-bold tracking-tighter leading-tight text-center lg:text-left mb-10 lg:mb-0 lg:pr-4 lg:w-1/2">
            Statically Generated with Next.js.
          </h3>
          <div className="flex flex-col lg:flex-row justify-center items-center lg:pl-4 lg:w-1/2">
            <a
              href="https://nextjs.org/docs/basic-features/pages"
              className="mx-3 bg-black hover:bg-white hover:text-black border border-black text-white font-bold py-3 px-12 lg:px-8 duration-200 transition-colors mb-6 lg:mb-0"
            >
              Read Documentation
            </a>
            <a
              href={`https://github.com/vercel/next.js/tree/canary/examples/${EXAMPLE_PATH}`}
              className="mx-3 font-bold hover:underline"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
*/

export default function Footer() {

  const currentYear = new Date().getFullYear();

  return (
      <div className="footer-container bg-laccent-1 dark:bg-daccent-1 text-accent-1">
          <div className="container-card bg-daccent-2">
              <div className="social-container bg-daccent-2">
                  <LinkedIn />
                  <Polywork />
                  <Github />
                  <Threads />

              </div>
          <div className="grid-container">
              <div className="grid-item">
                  <h4>Quick Links</h4>
                  <hr className="mb-3"/>
                  <ul>
                      <li><a href="/category/projects">Projects</a></li>
                      <li><a href="/about-shaun">About</a></li>
                      <li><a href="/privacy-policy">Privacy Policy</a></li>

                  </ul>
              </div>

              <div className="grid-item">
                  <h4 >Get in Touch</h4>
                  <hr className="mb-3"/>
                  <ul>
                      <li>
                          <svg arya-label="email address" className="svg-icon" viewBox="0 0 20 20"><title>Email</title>
            <path stroke="white" d="M17.388,4.751H2.613c-0.213,0-0.389,0.175-0.389,0.389v9.72c0,0.216,0.175,0.389,0.389,0.389h14.775c0.214,0,0.389-0.173,0.389-0.389v-9.72C17.776,4.926,17.602,4.751,17.388,4.751 M16.448,5.53L10,11.984L3.552,5.53H16.448zM3.002,6.081l3.921,3.925l-3.921,3.925V6.081z M3.56,14.471l3.914-3.916l2.253,2.253c0.153,0.153,0.395,0.153,0.548,0l2.253-2.253l3.913,3.916H3.56z M16.999,13.931l-3.921-3.925l3.921-3.925V13.931z"></path></svg>
                          <a href="mailto:shaun@parleedigital.ca">: shaun@parleedigital.ca</a>
                      </li>

                  </ul>
                  
              </div>


          </div>
          
          <p>© { currentYear } Designed and developed by me</p>

          </div>
      </div>


  );


};
