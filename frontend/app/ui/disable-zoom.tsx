"use client";

import { useEffect } from "react";

export default function DisableZoom() {
  useEffect(() => {
    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const preventCtrlWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTap = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("touchmove", preventPinch, { passive: false });
    document.addEventListener("touchend", preventDoubleTap, { passive: false });
    document.addEventListener("wheel", preventCtrlWheelZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventPinch);
      document.removeEventListener("touchend", preventDoubleTap);
      document.removeEventListener("wheel", preventCtrlWheelZoom);
    };
  }, []);

  return null;
}
