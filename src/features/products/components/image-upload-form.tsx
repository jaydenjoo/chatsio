"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProductWithImages,
  IMAGE_MAX_FILES,
  IMAGE_MAX_BYTES,
  IMAGE_ALLOWED_MIME,
  isAllowedImageMime,
} from "@/features/products";

// ============================================================
// 타입
// ============================================================

interface PreviewItem {
  id: string; // crypto.randomUUID() — React key 용도
  file: File;
  previewUrl: string; // URL.createObjectURL
}

// ============================================================
// 컴포넌트
// ============================================================

export function ImageUploadForm(): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>("");
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // object URL 수명 관리 — items 변경 시 이전 URL 정리
  useEffect(() => {
    return () => {
      for (const item of items) {
        URL.revokeObjectURL(item.previewUrl);
      }
    };
    // items가 unmount 시점까지 유지되므로 dependency는 빈 배열로 두고
    // 개별 제거는 handleRemove에서 즉시 revoke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(incoming: FileList | File[]): void {
    setError(null);
    const fileArr = Array.from(incoming);
    if (fileArr.length === 0) return;

    // 개수 검증 (기존 + 신규)
    const total = items.length + fileArr.length;
    if (total > IMAGE_MAX_FILES) {
      setError(
        `이미지는 최대 ${IMAGE_MAX_FILES}개까지 업로드할 수 있습니다 (현재 ${items.length}개 + 추가 ${fileArr.length}개)`,
      );
      return;
    }

    // 파일별 검증 + 미리보기 생성
    const accepted: PreviewItem[] = [];
    for (const file of fileArr) {
      if (!isAllowedImageMime(file.type)) {
        setError(`${file.name}: JPEG, PNG, WebP 이미지만 업로드할 수 있습니다`);
        // 이미 생성한 미리보기 URL 정리
        for (const item of accepted) URL.revokeObjectURL(item.previewUrl);
        return;
      }
      if (file.size === 0) {
        setError(`${file.name}: 빈 파일은 업로드할 수 없습니다`);
        for (const item of accepted) URL.revokeObjectURL(item.previewUrl);
        return;
      }
      if (file.size > IMAGE_MAX_BYTES) {
        const mb = (IMAGE_MAX_BYTES / 1024 / 1024).toFixed(0);
        setError(`${file.name}: 파일 크기는 ${mb}MB 이하여야 합니다`);
        for (const item of accepted) URL.revokeObjectURL(item.previewUrl);
        return;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setItems((prev) => [...prev, ...accepted]);
  }

  function handleFileInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): void {
    if (e.target.files) addFiles(e.target.files);
    // 같은 파일 재선택 가능하도록 input 초기화
    e.target.value = "";
  }

  function handleRemove(id: string): void {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
    setError(null);
  }

  function handleReset(): void {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    setItems([]);
    setName("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // 드래그앤드롭
  function handleDragOver(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("상품명을 입력해주세요");
      return;
    }
    if (items.length === 0) {
      setError("이미지를 1개 이상 선택해주세요");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    for (const item of items) {
      formData.append("images", item.file);
    }

    startTransition(async () => {
      const result = await createProductWithImages(formData);
      if (!result.success) {
        setError(result.error ?? "알 수 없는 오류가 발생했습니다.");
        return;
      }
      router.push("/products");
    });
  }

  // ============================================================
  // 렌더
  // ============================================================

  const canSubmit = name.trim().length > 0 && items.length > 0 && !isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 상품명 */}
      <div className="space-y-2">
        <Label
          htmlFor="image-product-name"
          className="flex items-center gap-2 text-sm font-bold text-[var(--on-surface)]"
        >
          <Sparkles className="size-4 text-[var(--primary)]" />
          상품명
        </Label>
        <Input
          id="image-product-name"
          placeholder="예: 오버핏 코튼 반팔 티셔츠"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
          disabled={isPending}
          className="h-12 rounded-xl border-none bg-[var(--surface-container-highest)] px-4 text-[var(--on-surface)] placeholder:text-[var(--outline)]/60 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
        />
      </div>

      {/* 드롭 영역 */}
      <div className="space-y-2">
        <Label
          htmlFor="image-file-input"
          className="flex items-center gap-2 text-sm font-bold text-[var(--on-surface)]"
        >
          <ImageIcon className="size-4 text-[var(--primary)]" />
          상품 이미지
          <span className="text-xs font-medium text-[var(--on-surface-variant)]">
            ({items.length}/{IMAGE_MAX_FILES})
          </span>
        </Label>

        <label
          htmlFor="image-file-input"
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary-container)]/30"
              : "border-[var(--outline-variant)] bg-[var(--surface-container-highest)] hover:border-[var(--primary)] hover:bg-[var(--surface-container)]"
          }`}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-[var(--primary-container)]/20">
            <Upload className="size-6 text-[var(--primary)]" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-[var(--on-surface)]">
              {isDragging
                ? "여기에 드롭하세요"
                : "이미지를 선택하거나 여기로 드래그"}
            </p>
            <p className="text-sm text-[var(--on-surface-variant)]">
              JPEG, PNG, WebP · 파일당 최대{" "}
              {(IMAGE_MAX_BYTES / 1024 / 1024).toFixed(0)}MB · 최대{" "}
              {IMAGE_MAX_FILES}장
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="image-file-input"
            type="file"
            accept={IMAGE_ALLOWED_MIME.join(",")}
            multiple
            className="sr-only"
            onChange={handleFileInputChange}
            disabled={isPending || items.length >= IMAGE_MAX_FILES}
          />
        </label>
      </div>

      {/* 미리보기 그리드 */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-[var(--surface-container-highest)] ring-1 ring-[var(--outline-variant)]"
            >
              {/* 순번 뱃지 */}
              <span className="absolute left-2 top-2 z-10 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-[var(--on-primary)]">
                {idx + 1}
              </span>

              {/* 제거 버튼 */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-[var(--on-surface)]/70 text-[var(--surface-container-lowest)] opacity-0 transition-opacity hover:bg-[var(--error)] group-hover:opacity-100 focus-visible:opacity-100"
                aria-label={`${idx + 1}번째 이미지 제거`}
              >
                <X className="size-3.5" />
              </button>

              {/* 미리보기 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt={`상품 이미지 ${idx + 1}`}
                className="size-full object-cover"
              />

              {/* 파일명 오버레이 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                <p className="truncate text-[10px] font-medium text-white">
                  {item.file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-[var(--error-container)] px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--on-error-container)]" />
          <p className="text-sm font-medium text-[var(--on-error-container)]">
            {error}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={isPending || (items.length === 0 && name.length === 0)}
          className="px-6 font-bold text-[var(--outline)] hover:text-[var(--on-surface)]"
        >
          다시 입력
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] px-8 py-6 font-extrabold text-[var(--on-primary)] shadow-md transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {isPending
            ? "업로드 중..."
            : `${items.length}장 등록하기`}
        </Button>
      </div>
    </form>
  );
}
