import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Logo } from "@/components/brand/logo";
import { SITE_URL, SITE_NAME } from "@/constants/site";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: `${SITE_NAME}의 개인정보처리방침입니다. 수집 항목, 이용 목적, 보관 기간 등을 안내합니다.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const LAST_UPDATED = "2026년 4월 13일";

export default function PrivacyPage(): ReactElement {
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
          개인정보처리방침
        </h1>
        <p className="mt-4 text-sm text-on-surface-variant">
          최종 업데이트: {LAST_UPDATED}
        </p>

        <div className="mt-12 space-y-10 text-on-surface-variant leading-relaxed [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-on-surface [&_h2]:tracking-tight [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1">
          <section>
            <h2>1. 개인정보 수집 항목</h2>
            <p>{SITE_NAME}은 서비스 제공을 위해 다음 정보를 수집합니다.</p>
            <ul className="mt-3">
              <li><strong>필수 수집:</strong> 이메일 주소, 비밀번호 (암호화 저장)</li>
              <li><strong>선택 수집:</strong> 쇼핑몰 이름, 쇼핑몰 URL, 플랫폼 종류</li>
              <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그, IP 주소</li>
            </ul>
          </section>

          <section>
            <h2>2. 개인정보 이용 목적</h2>
            <ul>
              <li>회원 가입 및 서비스 이용 관리</li>
              <li>상품 데이터 구조화 서비스 제공 (JSON-LD, llms.txt 생성)</li>
              <li>AI 인용 추적 서비스 제공</li>
              <li>서비스 개선 및 통계 분석</li>
              <li>고객 문의 대응</li>
            </ul>
          </section>

          <section>
            <h2>3. 개인정보 보관 및 파기</h2>
            <p>
              회원 탈퇴 시 개인정보는 즉시 파기됩니다. 단, 관계 법령에 따라
              보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다.
            </p>
            <ul className="mt-3">
              <li>전자상거래법에 따른 계약/결제 기록: 5년</li>
              <li>통신비밀보호법에 따른 접속 로그: 3개월</li>
            </ul>
          </section>

          <section>
            <h2>4. 개인정보의 제3자 제공</h2>
            <p>
              {SITE_NAME}은 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 이용자의 동의가 있거나 법령에 의해 요구되는 경우 예외로 합니다.
            </p>
          </section>

          <section>
            <h2>5. 개인정보 보호 조치</h2>
            <ul>
              <li>비밀번호 암호화 저장 (Supabase Auth)</li>
              <li>Row Level Security(RLS)로 계정 간 데이터 분리</li>
              <li>HTTPS 통신 암호화</li>
              <li>접근 권한 최소화</li>
            </ul>
          </section>

          <section>
            <h2>6. 쿠키 사용</h2>
            <p>
              {SITE_NAME}은 로그인 상태 유지 및 서비스 개선을 위해 쿠키를 사용합니다.
              브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2>7. 이용자의 권리</h2>
            <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
            <ul className="mt-3">
              <li>개인정보 열람, 정정, 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴</li>
            </ul>
            <p className="mt-3">
              문의: <a href="mailto:contact@chatsio.io" className="text-primary hover:underline">contact@chatsio.io</a>
            </p>
          </section>

          <section>
            <h2>8. 개인정보 보호 책임자</h2>
            <p>
              개인정보 보호 관련 문의는 아래 연락처로 해주세요.
            </p>
            <p className="mt-3">
              이메일: <a href="mailto:contact@chatsio.io" className="text-primary hover:underline">contact@chatsio.io</a>
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
