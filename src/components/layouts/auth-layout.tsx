import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps): React.ReactElement {
  return (
    <div className="flex min-h-screen">
      {/* 좌측 브랜딩 패널 */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-primary-container p-12 text-on-primary lg:flex lg:w-[480px] xl:w-[560px]">
        <div>
          <Link href="/" className="font-display text-xl font-bold">
            Chatsio
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-[2.5rem] font-extrabold leading-[1.15] tracking-[-0.03em]">
            AI가 상품 데이터를
            <br />
            구조화하는 가장
            <br />
            쉬운 방법
          </h1>
          <p className="max-w-sm text-primary-fixed/80">
            상품 URL만 연결하면, AI가 JSON-LD와 네이버 EP를
            자동으로 생성하고 AI 검색엔진 인용을 추적합니다.
          </p>
        </div>

        {/* 장식 카드 */}
        <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="size-2 rounded-full bg-secondary-fixed" />
            <span className="text-xs font-medium text-primary-fixed/70">
              데이터 구조화 프로세스 자동화
            </span>
          </div>
          <div className="space-y-1.5 font-mono text-xs text-primary-fixed/60">
            <p>
              <span className="text-secondary-fixed">&quot;name&quot;</span>:{" "}
              <span className="text-primary-fixed">&quot;오버핏 린넨 반팔&quot;</span>
            </p>
            <p>
              <span className="text-secondary-fixed">&quot;material&quot;</span>:{" "}
              <span className="text-primary-fixed">&quot;린넨 100%&quot;</span>
            </p>
            <p>
              <span className="text-secondary-fixed">&quot;price&quot;</span>:{" "}
              <span className="text-primary-fixed">39900</span>
            </p>
          </div>
        </div>
      </div>

      {/* 우측 폼 영역 */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
