import React from "react";
import SplitText from "../components/SplitText";

export default function Home(){
  return (
    <>
      <section className="hero">
        <div className="container">
          <SplitText
            tag="h1"
            text="Find. Click. Party. ✨"
            className=""                 // add extra classes if you like
            delay={70}                   // ms between letters (try 40–90)
            duration={2}                 // seconds per letter (for elastic, make it longer)
            ease="elastic.out(1,0.3)"    // bouncy vibe — see GSAP eases
            splitType="chars"            // "chars" or "words"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="left"
          />
          <p>Discover club events on campus and buy tickets in seconds.</p>
        </div>
      </section>

      {/* ... cards section stays the same ... */}
    </>
  );
}
