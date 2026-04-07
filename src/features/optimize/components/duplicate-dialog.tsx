"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DuplicateDialogProps {
  readonly open: boolean;
  readonly duplicateOptimizationId: string | null;
  readonly onDismiss: () => void;
}

export function DuplicateDialog({
  open,
  duplicateOptimizationId,
  onDismiss,
}: DuplicateDialogProps): ReactElement {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-[var(--warning)]/10 text-[var(--warning)]">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>진행 중인 최적화가 있습니다</DialogTitle>
          <DialogDescription>
            이 상품에 대해 최근 5분 이내에 시작된 최적화가 아직 진행 중입니다.
            결과를 확인하거나 완료 후 다시 실행해주세요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            닫기
          </Button>
          {duplicateOptimizationId && (
            <Button
              onClick={() =>
                router.push(`/optimize/${duplicateOptimizationId}`)
              }
            >
              진행 상황 보기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
