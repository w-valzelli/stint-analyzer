import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

export type AnchoredPopupPosition = {
  top: number;
  left: number;
  width?: number;
  maxHeight?: number;
};

export type AnchoredPopupDismissal = 'escape' | 'outside-press';

type AnchoredPopupRenderProps = {
  ref: (element: HTMLElement | null) => void;
  style: AnchoredPopupPosition;
};

type AnchoredPopupProps = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  /** Fixed viewport position from the anchor bounds and the rendered popup, once mounted. */
  place: (anchor: DOMRect, popup: HTMLElement | null) => AnchoredPopupPosition;
  /** Places the popup again after layout whenever this value changes while open. */
  layoutKey?: unknown;
  restoreFocusOnOutsidePress?: boolean;
  onDismiss: (reason: AnchoredPopupDismissal) => void;
  children: (popup: AnchoredPopupRenderProps) => ReactNode;
};

function samePosition(current: AnchoredPopupPosition, next: AnchoredPopupPosition): boolean {
  return (
    current.top === next.top &&
    current.left === next.left &&
    current.width === next.width &&
    current.maxHeight === next.maxHeight
  );
}

/**
 * Portals a popup to the document body, keeps it placed against its anchor while
 * the viewport resizes or scrolls, and dismisses it on Escape or an outside press.
 * Roles, labels, and content stay with the consumer.
 */
export function AnchoredPopup({
  open,
  anchorRef,
  place,
  layoutKey,
  restoreFocusOnOutsidePress = true,
  onDismiss,
  children,
}: AnchoredPopupProps) {
  const [position, setPosition] = useState<AnchoredPopupPosition | null>(null);
  const popupRef = useRef<HTMLElement | null>(null);
  const setPopupElement = useCallback((element: HTMLElement | null) => {
    popupRef.current = element;
  }, []);

  const updatePosition = useEffectEvent(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }

    const next = place(anchor.getBoundingClientRect(), popupRef.current);
    setPosition((current) => (current && samePosition(current, next) ? current : next));
  });

  const dismiss = useEffectEvent((reason: AnchoredPopupDismissal) => {
    onDismiss(reason);
    if (reason === 'escape' || restoreFocusOnOutsidePress) {
      anchorRef.current?.focus();
    }
  });

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !popupRef.current?.contains(target)) {
        dismiss('outside-press');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss('escape');
      }
    };
    const handleViewportChange = () => updatePosition();

    updatePosition();
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => updatePosition());
    return () => window.cancelAnimationFrame(frame);
  }, [layoutKey, open]);

  if (!open || !position || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children({ ref: setPopupElement, style: position }), document.body);
}
