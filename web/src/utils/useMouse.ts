import { reactive } from "vue";

export interface Mouse {
  pressed: boolean;
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  onMouseDown?: (e?: MouseEvent) => void;
  onMouseUp?: (e?: MouseEvent) => void;
  onMouseMove?: (e?: MouseEvent) => void;
}

export function useMouse(
  element: HTMLElement,
  mouse: Mouse = reactive({
    pressed: false,
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
  }),
) {
  const handleMouseDown = (e: Event) => {
    mouse.pressed = true;
    if (mouse.onMouseDown) mouse.onMouseDown(<MouseEvent>e);
  };
  const handleMouseUp = (e: Event) => {
    mouse.pressed = false;
    if (mouse.onMouseUp) mouse.onMouseUp(<MouseEvent>e);
  };
  const handleMouseMove = (e: Event | Touch) => {
    if (!element) return;

    const event = <MouseEvent>e;
    const box = element.getBoundingClientRect();

    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;

    mouse.x = event.clientX - box.left;
    mouse.y = event.clientY - box.top;

    if (mouse.onMouseMove) mouse.onMouseMove(event);
  };

  const handleTouchStart = (e: Event) => {
    if (!element) return;

    const tap = (e as TouchEvent).touches[0];
    const box = element.getBoundingClientRect();
    mouse.x = tap.clientX - box.left;
    mouse.y = tap.clientY - box.top;

    handleMouseDown(e);
  };
  const handleTouchMove = (e: Event) => {
    const tap = (e as TouchEvent).touches[0];
    handleMouseMove(tap);
  };

  // desktop
  element.addEventListener("mousedown", handleMouseDown);
  element.addEventListener("mouseup", handleMouseUp);
  element.addEventListener("mousemove", handleMouseMove);

  // mobile
  element.addEventListener("touchstart", handleTouchStart);
  element.addEventListener("touchend", handleMouseUp);
  element.addEventListener("touchmove", handleTouchMove);

  const handleWindowMouseMove = (e: MouseEvent | Touch) => {
    if (!mouse.pressed || !element) return;

    const box = element.getBoundingClientRect();
    if (
      e.clientX < box.left ||
      e.clientX > box.left + box.width ||
      e.clientY < box.top ||
      e.clientY > box.top + box.height
    )
      mouse.pressed = false;
  };
  const handleWindowTouchMove = (e: TouchEvent) => handleWindowMouseMove(e.touches[0]);

  window.addEventListener("mousemove", handleWindowMouseMove);
  window.addEventListener("touchmove", handleWindowTouchMove);

  const stopMouse = () => {
    // desktop
    element.removeEventListener("mousedown", handleMouseDown);
    element.removeEventListener("mouseup", handleMouseUp);
    element.removeEventListener("mousemove", handleMouseMove);

    // mobile
    element.removeEventListener("touchstart", handleMouseUp);
    element.removeEventListener("touchend", handleMouseDown);
    element.removeEventListener("touchmove", handleTouchMove);

    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("touchmove", handleWindowTouchMove);
  };

  return { mouse, stopMouse };
}
