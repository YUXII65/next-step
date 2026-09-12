"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnchoredHint } from "@/components/anchored-hint";
import { setFirstRunTourStep } from "@/app/actions";
import {
  normalizeTourStep,
  TOUR_EVENT,
  TOUR_STORAGE_KEY,
  TOUR_TARGETS,
  tourOrder,
  type TourStep,
} from "@/lib/tour";

const dismissButtonClass =
  "inline-flex h-7 items-center rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent";

/**
 * 新手三步引导（工作台）：
 * 1. 点"下一步"推进任务
 * 2. 认识任务行右侧三个按钮
 * 3. 完成第一件事之后：三个页面各是干什么的（游客则提醒保存）
 * 进度以服务端为准，localStorage 只用来让步骤切换即时生效。
 */
export function FirstRunTour({
  initialStep,
  guest,
}: {
  initialStep: string;
  guest: boolean;
}) {
  const [step, setStep] = useState<TourStep>(() => normalizeTourStep(initialStep));

  const persist = useCallback((next: TourStep) => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors.
    }
    void setFirstRunTourStep(next).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, step);
    } catch {
      // Ignore storage errors.
    }
  }, [step]);

  useEffect(() => {
    function onAdvance(event: Event) {
      const detail = (event as CustomEvent<{ step?: unknown }>).detail;
      const next = normalizeTourStep(detail?.step);
      setStep((current) =>
        tourOrder(next) > tourOrder(current) ? next : current,
      );
      void setFirstRunTourStep(next).catch(() => {});
    }

    window.addEventListener(TOUR_EVENT, onAdvance);
    return () => window.removeEventListener(TOUR_EVENT, onAdvance);
  }, []);

  const finish = useCallback(() => {
    setStep("done");
    persist("done");
  }, [persist]);

  if (step === "1") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.nextButton}
        title="从这一件开始"
        onDismiss={finish}
        onMissing={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>1 / 3</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        点<span className="font-medium text-ink">「下一步」</span>= 开始做；
        做完再点一下 = 完成。今天不用做更多，先把这一件推起来。
      </AnchoredHint>
    );
  }

  if (step === "2") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.taskTools}
        title="这三个按钮，卡住的时候用"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>2 / 3</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        <span className="block">
          <span className="font-medium text-ink">拆成小步</span>：没头绪时让 AI
          拆成能直接开始的动作
        </span>
        <span className="mt-1 block">
          <span className="font-medium text-ink">设置</span>：改标题、日期、优先级
        </span>
        <span className="mt-1 block">
          <span className="font-medium text-ink">问 AI</span>：就这条任务继续聊
        </span>
      </AnchoredHint>
    );
  }

  if (step === "3" && guest) {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.guestBanner}
        title="先把这些内容存下来"
        onDismiss={finish}
        footer={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/guest/register"
              onClick={finish}
              className="zouzou-primary-button inline-flex h-7 items-center rounded-md bg-accent px-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-strong"
            >
              注册保存
            </Link>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              以后再说
            </button>
            <span className="ml-auto text-xs text-ink-muted">3 / 3</span>
          </div>
        }
      >
        现在的内容只在这台浏览器里，换设备或清理浏览器就找不回来了。
        注册只用几秒，项目、任务和复盘都会保留。
      </AnchoredHint>
    );
  }

  if (step === "3") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.bottomNav}
        title="第一件事做完了"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>3 / 3</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        <span className="block">
          <span className="font-medium text-ink">日历</span>：明天先做哪 1-3 件
        </span>
        <span className="mt-1 block">
          <span className="font-medium text-ink">书桌</span>：项目全貌（就是这页）
        </span>
        <span className="mt-1 block">
          <span className="font-medium text-ink">抽屉</span>：晚上一句话复盘
        </span>
      </AnchoredHint>
    );
  }

  return null;
}