import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입",
  robots: { index: false, follow: false },
};

export default function SignupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return <>{children}</>;
}
