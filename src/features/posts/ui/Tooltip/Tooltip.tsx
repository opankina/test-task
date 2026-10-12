import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

interface TooltipProps {
  /** Content rendered inside the floating panel. */
  content: ReactNode;
  /** The trigger element (the truncated text, typically). */
  children: ReactNode;
  /** Optional class applied to the trigger wrapper — use it to control truncation. */
  className?: string;
  /** Delay before the tooltip appears, in milliseconds. */
  openDelayMs?: number;
  /**
   * When true, the tooltip is shown only if the trigger's content
   * overflows its box (`scrollWidth`/`scrollHeight` > `clientWidth`/`clientHeight`).
   * Perfect for cells that visually truncate text only when it does not fit.
   */
  onlyWhenTruncated?: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
}

const VIEWPORT_MARGIN_PX = 8;

export function Tooltip({
  content,
  children,
  className,
  openDelayMs = 150,
  onlyWhenTruncated = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [isTruncated, setIsTruncated] = useState(!onlyWhenTruncated);

  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  // Detect whether the anchor's content overflows its box.
  useLayoutEffect(() => {
    if (!onlyWhenTruncated) {
      setIsTruncated(true);
      return;
    }
    const node = anchorRef.current;
    if (!node) return;

    const measure = () => {
      setIsTruncated(
        node.scrollWidth > node.clientWidth ||
          node.scrollHeight > node.clientHeight,
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onlyWhenTruncated, content]);

  // Compute the tooltip's viewport coordinates once it's mounted.
  // The portal is rendered with `visibility: hidden` until `position` is set,
  // so measurements never cause a visible flicker.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = anchorRect.bottom + VIEWPORT_MARGIN_PX;
    let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

    // Clamp horizontally inside the viewport.
    const maxLeft = window.innerWidth - tooltipRect.width - VIEWPORT_MARGIN_PX;
    left = Math.max(VIEWPORT_MARGIN_PX, Math.min(left, maxLeft));

    // Flip above the anchor if there is no room below.
    if (top + tooltipRect.height > window.innerHeight - VIEWPORT_MARGIN_PX) {
      const above = anchorRect.top - tooltipRect.height - VIEWPORT_MARGIN_PX;
      top =
        above >= VIEWPORT_MARGIN_PX
          ? above
          : window.innerHeight - tooltipRect.height - VIEWPORT_MARGIN_PX;
    }

    setPosition({ top, left });
  }, [isOpen]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const handleOpen = useCallback(() => {
    if (!isTruncated) return;
    clearOpenTimer();
    openTimerRef.current = window.setTimeout(() => setIsOpen(true), openDelayMs);
  }, [clearOpenTimer, isTruncated, openDelayMs]);

  const handleClose = useCallback(() => {
    clearOpenTimer();
    setIsOpen(false);
    setPosition(null);
  }, [clearOpenTimer]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Close on scroll/resize — the anchor may have moved and the tooltip
  // is positioned in fixed coordinates.
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => handleClose();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, handleClose]);

  useEffect(() => clearOpenTimer, [clearOpenTimer]);

  return (
    <>
      <span
        ref={anchorRef}
        className={[styles.anchor, className].filter(Boolean).join(' ')}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        aria-describedby={isOpen ? tooltipId : undefined}
      >
        {children}
      </span>

      {isOpen
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className={styles.tooltip}
              style={{
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                visibility: position ? 'visible' : 'hidden',
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}