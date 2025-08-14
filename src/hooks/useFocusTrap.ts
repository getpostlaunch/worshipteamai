import { useEffect } from "react";

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  active: boolean,
  returnFocusRef?: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Save previously focused element
    const prev = document.activeElement as HTMLElement | null;

    // Focus the first focusable element in the container
    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusables[0] || container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement as HTMLElement;

      if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);

    return () => {
      container.removeEventListener("keydown", onKeyDown);
      // restore focus
      const target = returnFocusRef?.current || prev;
      target?.focus?.();
    };
  }, [active, containerRef, returnFocusRef]);
}
