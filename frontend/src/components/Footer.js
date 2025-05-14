import { Link } from "react-router-dom"; // if you're using react-router
import React from "react";
import "./Footer.css"; // Assuming it's in the same directory or adjust the path

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-logo">
            <Link href="/">
              <img
                src="https://static.wixstatic.com/media/e48a18_c949f6282e6a4c8e9568f40916a0c704~mv2.png/v1/crop/x_0,y_151,w_1920,h_746/fill/w_203,h_79,fp_0.50_0.50,q_85,usm_0.66_1.00_0.01,enc_auto/For%20Dark%20Theme.png"
                alt="DeepCytes Logo"
              />
            </Link>
          </div>
          <div className="footer-columns">
            <div className="footer-column">
              <h2>Resources</h2>
              <ul>
                <li><Link href="/">About</Link></li>
                <li><Link href="/">Career</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>Follow us</h2>
              <ul>
                <li><Link href="https://github.com/deepcytes">Github</Link></li>
                <li><Link href="https://www.deepcytes.io/">Website</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h2>Legal</h2>
              <ul>
                <li><Link href="/">Privacy Policy</Link></li>
                <li><Link href="/">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 DeepCytes. All Rights Reserved.</span>
          <div className="footer-socials">
            {/* Repeat social icons as you already have, but remove Tailwind and use CSS */}
            <a href="https://www.instagram.com/deepcytes?igsh=ZHQ4bDNhazNtOHVm">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://github.com/deepcytes">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://x.com/DeepCytes">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://www.deepcytes.io/">
              <i className="fas fa-globe"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
