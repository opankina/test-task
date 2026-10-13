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
  /**
   * Optional class applied to the trigger wrapper.
   * `| undefined` is required because we pass `styles.*` values which are
   * `string | undefined` under `noUncheckedIndexedAccess`.
   */
  className?: string | undefined;
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

/**
 * Delay between leaving the anchor and closing the tooltip.
 * Gives the user a moment to move the cursor into the tooltip,
 * which is needed when the panel has its own scrollbar.
 */
const CLOSE_DELAY_MS = 120;

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
  const closeTimerRef = useRef<number | null>(null);
  const tooltipId = useId();

  // Detect whether the anchor's content overflows its box.
  // `children` and `content` are intentionally excluded from deps:
  // their identity changes on every render, while ResizeObserver
  // already re-measures whenever the anchor's size actually changes.
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
  }, [onlyWhenTruncated]);

  // Compute the tooltip's viewport coordinates once it's mounted.
  // The portal is rendered with `visibility: hidden` until `position`
  // is set, so measurements never cause a visible flicker.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Prefer placing the tooltip below the anchor.
    let top = anchorRect.bottom + VIEWPORT_MARGIN_PX;
    let left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

    // Clamp horizontally inside the viewport.
    const maxLeft = window.innerWidth - tooltipRect.width - VIEWPORT_MARGIN_PX;
    left = Math.max(VIEWPORT_MARGIN_PX, Math.min(left, maxLeft));

    // Flip above the anchor if there is no room below.
    if (top + tooltipRect.height > window.innerHeight - VIEWPORT_MARGIN_PX) {
      top = anchorRect.top - tooltipRect.height - VIEWPORT_MARGIN_PX;
    }

    // Clamp vertically as a last resort: if the tooltip is taller than the
    // viewport (max-height usually prevents this), pin it to the top margin
    // so it is never cut off.
    top = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(
        top,
        window.innerHeight - tooltipRect.height - VIEWPORT_MARGIN_PX,
      ),
    );

    setPosition({ top, left });
  }, [isOpen]);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    setIsOpen(false);
    setPosition(null);
  }, [clearOpenTimer, clearCloseTimer]);

  const handleAnchorMouseEnter = useCallback(() => {
    if (!isTruncated) return;
    // Cancel any pending close (e.g. when the cursor bounces back).
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = window.setTimeout(
      () => setIsOpen(true),
      openDelayMs,
    );
  }, [clearCloseTimer, clearOpenTimer, isTruncated, openDelayMs]);

  const handleAnchorMouseLeave = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    // Delayed close: the user needs time to reach the tooltip.
    closeTimerRef.current = window.setTimeout(handleClose, CLOSE_DELAY_MS);
  }, [clearOpenTimer, clearCloseTimer, handleClose]);

  const handleTooltipMouseEnter = useCallback(() => {
    clearCloseTimer();
  }, [clearCloseTimer]);

  const handleTooltipMouseLeave = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Close on scroll/resize: the anchor may have moved and the tooltip is
  // positioned in fixed coordinates, so it would end up misplaced.
  //
  // The listener is attached with `capture: true` so it sees scrolls from
  // any scrollable ancestor (the table, the page). But that also catches
  // the tooltip's own inner scroll — which must NOT close the panel,
  // otherwise the user cannot read long content. We filter that case out.
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      const tooltip = tooltipRef.current;
      const target = event.target;
      if (tooltip && target instanceof Node && tooltip.contains(target)) {
        return;
      }
      handleClose();
    };

    const handleResize = () => handleClose();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, handleClose]);

  // Clear any pending timers on unmount.
  useEffect(
    () => () => {
      clearOpenTimer();
      clearCloseTimer();
    },
    [clearOpenTimer, clearCloseTimer],
  );

  return (
    <>
      <span
        ref={anchorRef}
        className={[styles.anchor, className].filter(Boolean).join(' ')}
        onMouseEnter={handleAnchorMouseEnter}
        onMouseLeave={handleAnchorMouseLeave}
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
              onMouseEnter={handleTooltipMouseEnter}
              onMouseLeave={handleTooltipMouseLeave}
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