import { useEffect, useRef, useState } from "react";

// `true` for a couple of seconds after flash() is called, to confirm a save
// next to the Save button without leaving the page.
export default function useSavedFlash(duration = 2500) {
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function flash() {
    clearTimeout(timer.current);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), duration);
  }

  return [visible, flash];
}
