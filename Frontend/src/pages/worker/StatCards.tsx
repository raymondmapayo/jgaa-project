import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ---------- Types ---------- */

interface StatCardData {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  onClick?: () => void;
}

interface StatCardsProps {
  cards: StatCardData[];
}

/* ---------- Icon tile colors ---------- */

const TINTS: Record<string, { bg: string; ring: string }> = {
  blue: { bg: "bg-blue-50", ring: "ring-blue-100" },
  red: { bg: "bg-red-50", ring: "ring-red-100" },
  purple: { bg: "bg-purple-50", ring: "ring-purple-100" },
  green: { bg: "bg-green-50", ring: "ring-green-100" },
  yellow: { bg: "bg-yellow-50", ring: "ring-yellow-100" },
  orange: { bg: "bg-orange-50", ring: "ring-orange-100" },
};

const getTint = (color?: string) => {
  const name = color?.match(/text-([a-z]+)-\d+/)?.[1] ?? "";

  return (
    TINTS[name] ?? {
      bg: "bg-gray-50",
      ring: "ring-gray-100",
    }
  );
};

/* ---------- Number parsing ---------- */

const parseValue = (raw: string | number) => {
  const text = String(raw).trim();

  const match = text.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);

  if (!match) return null;

  const numberText = match[2].replace(/,/g, "");
  const value = Number(numberText);

  if (!Number.isFinite(value)) return null;

  return {
    prefix: match[1],
    suffix: match[3],
    value,
    decimals: (numberText.split(".")[1] || "").length,
  };
};

/* ---------- Smooth count-up animation ---------- */

// Gradual easing: smooth at the beginning and end.
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const useCountUp = (
  target: number | null,
  enabled: boolean,
  delay = 0,
  duration = 6000,
  reduceMotion = false,
) => {
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (target === null || !enabled) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || prefersReducedMotion) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    // Always count upward from zero.
    const from = 0;

    displayRef.current = from;
    setDisplay(from);

    let frame = 0;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) {
        startTime = now;
      }

      const elapsed = now - startTime - delay;

      const progress = Math.min(Math.max(elapsed / duration, 0), 1);

      const easedProgress = easeOutCubic(progress);

      const current = from + (target - from) * easedProgress;

      displayRef.current = current;
      setDisplay(current);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, enabled, delay, duration, reduceMotion]);

  return display;
};

/* ---------- Animated number ---------- */

const AnimatedValue = ({
  value,
  enabled,
  delay,
  reduceMotion,
}: {
  value: string | number;
  enabled: boolean;
  delay: number;
  reduceMotion: boolean;
}) => {
  const text = String(value).trim();
  const parsed = parseValue(value);
  const isLoading = text === "" || text === "...";

  const shown = useCountUp(
    parsed ? parsed.value : null,
    enabled,
    delay,
    6000,
    reduceMotion,
  );

  // Loading placeholder.
  if (isLoading) {
    return (
      <span
        className="inline-block h-9 w-24 animate-pulse rounded-xl bg-gray-100 align-middle"
        aria-label="Loading"
      />
    );
  }

  // Show text directly if it is not a number.
  if (!parsed) return <>{text}</>;

  const formatted = shown.toLocaleString(undefined, {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });

  return (
    <>
      {parsed.prefix}
      {formatted}
      {parsed.suffix}
    </>
  );
};

/* ---------- One card ---------- */

const StatCard = ({ card, index }: { card: StatCardData; index: number }) => {
  const ref = useRef<HTMLDivElement & HTMLButtonElement>(null);

  const inView = useInView(ref, {
    once: true,
    amount: 0.3,
  });

  const reduceMotion = useReducedMotion() ?? false;

  const delay = index * 0.1;
  const tint = getTint(card.color);

  const cardMotion = {
    initial: {
      opacity: 0,
      y: reduceMotion ? 0 : 24,
    },
    animate: inView
      ? { opacity: 1, y: 0 }
      : {
          opacity: 0,
          y: reduceMotion ? 0 : 24,
        },
    transition: {
      duration: reduceMotion ? 0 : 0.5,
      delay: reduceMotion ? 0 : delay,
      ease: "easeOut" as const,
    },
  };

  const baseClass =
    "relative w-full overflow-hidden rounded-3xl bg-white p-5 text-left shadow-[0_10px_40px_-12px_rgba(30,64,175,0.18)] ring-1 ring-blue-100 transition-shadow duration-300 hover:shadow-lg sm:p-6";

  const content = (
    <>
      {/* Decorative rings */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-blue-100/80" />

      <div className="pointer-events-none absolute -right-2 -top-2 h-12 w-12 rounded-full border border-blue-100/80" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium capitalize text-gray-500">
            {card.title}
          </p>

          <p className="m-0 mt-3 text-3xl font-extrabold tracking-tight text-gray-900 [font-variant-numeric:tabular-nums] sm:text-4xl">
            <AnimatedValue
              value={card.value}
              enabled={inView}
              delay={delay * 1000 + 150}
              reduceMotion={reduceMotion}
            />
          </p>
        </div>

        {/* Smaller icon */}
        <motion.div
          initial={{
            scale: reduceMotion ? 1 : 0.8,
            opacity: 0,
          }}
          animate={
            inView
              ? { scale: 1, opacity: 1 }
              : {
                  scale: reduceMotion ? 1 : 0.8,
                  opacity: 0,
                }
          }
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: reduceMotion ? 0 : delay + 0.15,
          }}
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ring-1 [&>svg]:h-5 [&>svg]:w-5 ${
            tint.bg
          } ${tint.ring} ${card.color ?? "text-blue-600"}`}
        >
          {card.icon}
        </motion.div>
      </div>
    </>
  );

  return card.onClick ? (
    <motion.button
      ref={ref}
      type="button"
      onClick={card.onClick}
      {...cardMotion}
      className={`${baseClass} cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
    >
      {content}
    </motion.button>
  ) : (
    <motion.div ref={ref} {...cardMotion} className={baseClass}>
      {content}
    </motion.div>
  );
};

/* ---------- Cards ---------- */

const StatCards = ({ cards }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
      {cards.map((card, index) => (
        <StatCard key={card.title} card={card} index={index} />
      ))}
    </div>
  );
};

export default StatCards;
