"use client";

import { useFormStatus } from "react-dom";
import type { FormEvent, ReactNode } from "react";

function ButtonContent({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();
  return <>{pending ? "处理中..." : children}</>;
}

export function ConfirmActionButton({
  action,
  id,
  confirmText,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmText: string;
  children: ReactNode;
  className?: string;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmText)) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={className}>
        <ButtonContent>{children}</ButtonContent>
      </button>
    </form>
  );
}
