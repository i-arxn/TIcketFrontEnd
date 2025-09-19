import React from "react";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand">CampusTickets</div>
        <nav className="nav-links">
          <a href="#">Home</a>
          <a href="#">Events</a>
          <a href="#">Contact</a>
        </nav>
      </div>
    </header>
  );
}
