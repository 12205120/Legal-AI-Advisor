"use client";
import { useEffect, useState } from "react";

export default function TypingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 20);

    return () => clearInterval(interval);
  }, [text]);

  return <div>{displayed}</div>;
}