import type { HTMLAttributes } from "react";
import { cx } from "@/lib/utils";

export function BrandMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-card",
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        style={{ height: "58%", width: "58%" }}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M24 18 L42 32 L24 46"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
