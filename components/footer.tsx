import Link from 'next/link';
import { BlueSky, LinkedIn, Github } from '../lib/icons';

export default function Footer() {

  const currentYear = new Date().getFullYear();

  return (
      <div className="footer-container bg-laccent-1 dark:bg-daccent-1 text-accent-1">
          <div className="bg-daccent-2 mx-0">
              <div className="social-container bg-daccent-2">
                  <LinkedIn />
                  <Github />
                  <BlueSky />

              </div>
          <div className="grid-container">
              <div className="grid-item">
                  <h4>Quick Links</h4>
                  <hr className="mb-3"/>
                  <ul>
                      <li><Link href="/category/projects">Projects</Link></li>
                      <li><Link href="/about-shaun">About</Link></li>
                      <li><Link href="/privacy-policy">Privacy Policy</Link></li>

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
