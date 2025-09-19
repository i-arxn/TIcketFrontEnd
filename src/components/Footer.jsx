import React from "react";
import "./Footer.css";

export default function Footer(){
  return (
    <footer className="footer">
      <div className="container">© {new Date().getFullYear()} CampusTickets. All rights reserved.</div>
    </footer>
  );
}
