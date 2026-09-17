import { useEffect } from "react";

/**
 * Locks body scroll while the hook is active.
 * Call with no arguments to lock, or pass `false` to disable.
 */
export default function useScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return;

    const body = document.body;
    const html = document.documentElement;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;

    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [locked]);
}
