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

export function FirstRunTour({
  initialStep,
  guest,
  context,
  hasTasks = false,
}: {
  initialStep: string;
  guest: boolean;
  context: "home" | "workspace";
  hasTasks?: boolean;
}) {
  const [step, setStep] = useState<TourStep>(() =>
    normalizeTourStep(initialStep),
  );

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

  useEffect(() => {
    if (context === "workspace" && step === "1" && hasTasks) {
      setStep("2");
      persist("2");
    }
  }, [context, hasTasks, persist, step]);

  const finish = useCallback(() => {
    setStep("done");
    persist("done");
  }, [persist]);

  const effectiveStep: TourStep =
    context === "workspace" && step === "1" && hasTasks ? "2" : step;

  if (context === "home") {
    if (effectiveStep !== "1") return null;

    return (
      <AnchoredHint
        target={TOUR_TARGETS.quickCapture}
        title="先从一句话开始"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>1 / 4</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        把脑子里那件事直接倒出来，不用整理。点「下一步」后，走走会先问你几句，再把它变成能开始的行动。
      </AnchoredHint>
    );
  }

  if (effectiveStep === "1") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.homeNav}
        title="先回日历记一个想法"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>1 / 4</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        点左侧「日历」，先把一件真实的事写下来。后面所有项目、任务和复盘都会从这里长出来。
      </AnchoredHint>
    );
  }

  if (effectiveStep === "2" && !hasTasks) {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.homeNav}
        title="先把想法变成一条任务"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>2 / 4</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        点「日历」回去提交那条想法。出现任务后，再回来点下一步。
      </AnchoredHint>
    );
  }

  if (effectiveStep === "2") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.nextButton}
        title="把任务推起来"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>2 / 4</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        点<span className="font-medium text-ink">「下一步」</span>＝开始做；做完再点一下＝完成。只需要先推进这一件。
      </AnchoredHint>
    );
  }

  if (effectiveStep === "3") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.taskTools}
        title="卡住时，打开便利贴"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>3 / 4</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        把补充想法写进便利贴，AI 会帮你拆成能直接开始的小步；设置里可以改标题、日期和优先级。
      </AnchoredHint>
    );
  }

  if (effectiveStep === "4" && guest) {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.guestBanner}
        title="注册，把内容长期留住"
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
              继续体验
            </button>
            <span className="ml-auto text-xs text-ink-muted">4 / 4</span>
          </div>
        }
      >
        游客内容只保存在这台浏览器，清理浏览器或换设备就会丢失。注册只用几秒，项目、任务和复盘都会保留。
      </AnchoredHint>
    );
  }

  if (effectiveStep === "4") {
    return (
      <AnchoredHint
        target={TOUR_TARGETS.bottomNav}
        title="以后都在这里切换"
        onDismiss={finish}
        footer={
          <div className="flex items-center justify-between gap-3 text-xs text-ink-muted">
            <span>4 / 4</span>
            <button type="button" onClick={finish} className={dismissButtonClass}>
              知道了
            </button>
          </div>
        }
      >
        <span className="block">日历：今天先做哪 1-3 件</span>
        <span className="mt-1 block">书桌：看项目和任务全貌</span>
        <span className="mt-1 block">抽屉：晚上用一句话复盘</span>
      </AnchoredHint>
    );
  }

  return null;
}
