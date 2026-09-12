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
      {/*
        内联 style 的百分比尺寸依赖外层容器有确定尺寸；样式表没加载时容器会退化成
        行内元素，百分比会按视口解析，整个图标撑满屏幕。这里改成「固有尺寸 + 类」：
        正常情况下仍是父容器的 58%，异常情况下退回 64px 的固有尺寸。
      */}
      <svg
        viewBox="0 0 64 64"
        width="64"
        height="64"
        className="h-[58%] w-[58%]"
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
