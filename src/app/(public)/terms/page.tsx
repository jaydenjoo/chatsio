import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";
import { SITE_URL, SITE_NAME } from "@/constants/site";

export const metadata: Metadata = {
  title: "서비스 이용약관",
  description: `${SITE_NAME}의 서비스 이용약관입니다. 서비스 이용 조건, 책임 범위 등을 안내합니다.`,
  alternates: { canonical: `${SITE_URL}/terms` },
};

const LAST_UPDATED = "2026년 4월 13일";

export default function TermsPage(): ReactElement {
  return (
    <div className="min-h-screen bg-background font-sans text-on-surface">
      {/* Nav */}
      <nav className="border-b border-outline-variant/10 bg-white/80 backdrop-blur-xl dark:bg-[#0e1419]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-lg font-bold tracking-tight">{SITE_NAME}</span>
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1
          className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
          style={{ letterSpacing: "-0.03em" }}
        >
          서비스 이용약관
        </h1>
        <p className="mt-4 text-sm text-on-surface-variant">
          최종 업데이트: {LAST_UPDATED}
        </p>

        <div className="mt-12 space-y-10 text-on-surface-variant leading-relaxed [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:tracking-tight [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
          <section>
            <h2>제1조 (목적)</h2>
            <p>
              본 약관은 {SITE_NAME}(이하 &ldquo;회사&rdquo;)이 제공하는 상품 데이터 구조화 서비스(이하 &ldquo;서비스&rdquo;)의
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2>제2조 (서비스 내용)</h2>
            <p>회사는 다음의 서비스를 제공합니다.</p>
            <ul className="mt-3">
              <li>AI 기반 상품 속성 자동 추출</li>
              <li>JSON-LD (Schema.org Product) 자동 생성</li>
              <li>llms.txt 자동 생성</li>
              <li>AI 검색엔진 인용 추적 (Citation Tracking)</li>
              <li>Loader JS를 통한 자동 배포</li>
            </ul>
          </section>

          <section>
            <h2>제3조 (이용 계약 체결)</h2>
            <p>
              이용 계약은 이용자가 회원가입 양식에 따라 정보를 입력하고 회사가 이를 승인함으로써 체결됩니다.
            </p>
          </section>

          <section>
            <h2>제4조 (요금 및 결제)</h2>
            <ul>
              <li>서비스 요금은 월 구독 방식이며, 요금표는 서비스 내 안내를 따릅니다.</li>
              <li>무료 파일럿 프로그램 기간 중에는 요금이 부과되지 않습니다.</li>
              <li>결제 후 서비스 이용 중 발생한 오류로 인한 경우 회사의 환불 정책에 따릅니다.</li>
            </ul>
          </section>

          <section>
            <h2>제5조 (이용자의 의무)</h2>
            <ul>
              <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
              <li>서비스를 이용하여 법령에 위반되는 행위를 해서는 안 됩니다.</li>
              <li>서비스의 안정적 운영을 방해하는 행위를 해서는 안 됩니다.</li>
            </ul>
          </section>

          <section>
            <h2>제6조 (회사의 의무)</h2>
            <ul>
              <li>회사는 안정적인 서비스 제공을 위해 노력합니다.</li>
              <li>회사는 이용자의 개인정보를 보호하며, 개인정보처리방침에 따라 관리합니다.</li>
              <li>서비스 장애 발생 시 신속하게 복구하고 이용자에게 안내합니다.</li>
            </ul>
          </section>

          <section>
            <h2>제7조 (서비스 변경 및 중단)</h2>
            <p>
              회사는 운영상 필요한 경우 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며,
              중요한 변경 사항은 사전에 안내합니다.
            </p>
          </section>

          <section>
            <h2>제8조 (면책)</h2>
            <ul>
              <li>AI가 생성한 데이터의 정확성에 대해 회사는 최선을 다하나, 100% 정확성을 보장하지 않습니다.</li>
              <li>이용자의 귀책사유로 인한 서비스 이용 장애에 대해 회사는 책임을 지지 않습니다.</li>
              <li>천재지변, 시스템 장애 등 불가항력에 의한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2>제9조 (분쟁 해결)</h2>
            <p>
              본 약관에 관한 분쟁은 대한민국 법률을 준거법으로 하며,
              관할 법원은 회사의 소재지를 관할하는 법원으로 합니다.
            </p>
          </section>

          <section>
            <h2>문의</h2>
            <p>
              약관에 대한 문의는{" "}
              <a href="mailto:contact@chatsio.io" className="text-primary hover:underline">
                contact@chatsio.io
              </a>
              로 연락해 주세요.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
