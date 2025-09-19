import React, { useEffect, useState } from "react";
import DotGrid from "./components/DotGrid";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import CircularText from "./components/CircularText";

const readVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function App() {
  return (
    <>
      <div className="bg-grid">
        <DotGrid /* ...your existing props... */ />
      </div>

      <div className="page">
        <Navbar />
        <main className="content">
          <Home />
        </main>

        {/* 👇 SASA circular text pinned on the right for all pages */}
        <CircularText
          text="SASA • South Asian Student Association • "
          spinDuration={20}
          onHover="speedUp"
          radius={140}   // tweak to 80–120 to change size
        />

        <Footer />
      </div>
    </>
  );
}