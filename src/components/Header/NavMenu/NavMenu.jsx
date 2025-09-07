import { Link, useLocation } from "react-router-dom";
import './NavMenu.css';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
];

export default function NavMenu() {
  const location = useLocation();

  return (
    <nav className="navigation-menu">
      {navLinks.map((link) => (
        <Link 
          key={link.href} 
          to={link.href}
          className={`navigation-menu-items ${location.pathname === link.href ? "active" : ""}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
