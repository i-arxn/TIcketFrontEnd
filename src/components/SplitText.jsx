import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

let GSAPSplitText;
try {
  // Works if you have Club GreenSock (or trial) installed
  GSAPSplitText = require("gsap/SplitText").SplitText;
} catch {
  GSAPSplitText = null;
}

export default function SplitText({
  text,
  className = "",
  delay = 70,             // ms between letters
  duration = 0.6,         // seconds per letter
  ease = "power3.out",
  splitType = "chars",    // "chars" | "words" | "lines" (lines needs plugin)
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,        // 0..1 visible to start
  rootMargin = "-100px",
  textAlign = "center",
  tag = "h1",
  onLetterAnimationComplete,
}) {
  const ref = useRef(null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (document.fonts?.status === "loaded") setFontsReady(true);
    else document.fonts?.ready.then(() => setFontsReady(true));
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsReady) return;
      const el = ref.current;

      // Clean up previous runs
      ScrollTrigger.getAll().forEach((st) => st.trigger === el && st.kill());
      if (el._splitCleanup) {
        el._splitCleanup();
        el._splitCleanup = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign =
        marginValue === 0
          ? ""
          : marginValue < 0
          ? `-=${Math.abs(marginValue)}${marginUnit}`
          : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      let targets = [];

      if (GSAPSplitText) {
        // ——————————— With official plugin ———————————
        const split = new GSAPSplitText(el, {
          type: splitType,
          linesClass: "split-line",
          wordsClass: "split-word",
          charsClass: "split-char",
          reduceWhiteSpace: false,
        });

        if (splitType.includes("chars") && split.chars?.length) targets = split.chars;
        else if (splitType.includes("words") && split.words?.length) targets = split.words;
        else targets = split.chars || split.words || split.lines;

        const tween = gsap.fromTo(
          targets,
          { ...from },
          {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: { trigger: el, start, once: true, fastScrollEnd: true },
            onComplete: () => onLetterAnimationComplete?.(),
            willChange: "transform,opacity",
            force3D: true,
          }
        );

        el._splitCleanup = () => split.revert();
      } else {
        // ——————————— Fallback (no plugin): split chars manually ———————————
        const original = el.textContent;
        const pieces =
          splitType === "words" ? original.split(/(\s+)/) : [...original]; // default chars
        el.innerHTML = pieces
          .map((s) =>
            s.trim() === "" ? s : `<span class="split-fallback" style="display:inline-block">${s}</span>`
          )
          .join("");
        targets = Array.from(el.querySelectorAll(".split-fallback"));

        gsap.fromTo(
          targets,
          { ...from },
          {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: { trigger: el, start, once: true, fastScrollEnd: true },
            onComplete: () => onLetterAnimationComplete?.(),
            willChange: "transform,opacity",
            force3D: true,
          }
        );

        el._splitCleanup = () => {
          el.textContent = original;
        };
      }

      return () => {
        ScrollTrigger.getAll().forEach((st) => st.trigger === el && st.kill());
        if (el._splitCleanup) el._splitCleanup();
        el._splitCleanup = null;
      };
    },
    {
      scope: ref,
      dependencies: [
        text,
        className,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsReady,
      ],
    }
  );

  const style = {
    textAlign,
    overflow: "hidden",
    display: "inline-block",
    whiteSpace: "normal",
    wordWrap: "break-word",
    willChange: "transform,opacity",
  };
  const cls = `split-parent ${className}`;

  const Tag = tag || "h1";
  return (
    <Tag ref={ref} style={style} className={cls}>
      {text}
    </Tag>
  );
}
