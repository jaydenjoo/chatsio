"use client";

import { useState } from "react";
import { WelcomeStep } from "@/features/onboarding/steps/welcome-step";
import { ShopInfoStep } from "@/features/onboarding/steps/shop-info-step";
import { FirstProductStep } from "@/features/onboarding/steps/first-product-step";
import { CompleteStep } from "@/features/onboarding/steps/complete-step";

const STEPS = ["환영", "쇼핑몰 정보", "첫 상품", "완료"] as const;

export default function OnboardingPage(): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(0);
  const [shopId, setShopId] = useState<string | null>(null);

  function handleShopCreated(id: string): void {
    setShopId(id);
    setCurrentStep(2);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* 프로그레스 바 */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className="text-xs font-medium"
                style={{
                  color:
                    i <= currentStep
                      ? "var(--primary)"
                      : "var(--outline)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--surface-container-high)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                background: "var(--primary)",
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 카드 */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "var(--surface-container-lowest)",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          {currentStep === 0 && (
            <WelcomeStep onNext={() => setCurrentStep(1)} />
          )}
          {currentStep === 1 && (
            <ShopInfoStep
              onNext={handleShopCreated}
              onBack={() => setCurrentStep(0)}
            />
          )}
          {currentStep === 2 && shopId && (
            <FirstProductStep
              shopId={shopId}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && <CompleteStep />}
        </div>
      </div>
    </div>
  );
}
