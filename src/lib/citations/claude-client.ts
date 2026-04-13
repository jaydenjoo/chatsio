import { getCitationEnv } from "@/lib/env";

// ============================================================
// Claude Messages API — 질문 생성 전용
// ============================================================

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-3-5-haiku-20241022";
const TIMEOUT_MS = 15_000;

interface ClaudeMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

interface ClaudeResponse {
  readonly content: ReadonlyArray<{ readonly type: string; readonly text?: string }>;
  readonly model: string;
}

export interface GenerateQuestionsInput {
  readonly productName: string;
  readonly productUrl: string | null;
  readonly category: string | null;
  readonly price: string | null;
  readonly attributes: Record<string, unknown> | null;
}

export interface GenerateQuestionsResult {
  readonly questions: readonly string[];
  readonly model: string;
}

function buildPrompt(input: GenerateQuestionsInput): string {
  const parts: string[] = [
    `상품명: ${input.productName}`,
  ];
  if (input.productUrl) parts.push(`URL: ${input.productUrl}`);
  if (input.category) parts.push(`카테고리: ${input.category}`);
  if (input.price) parts.push(`가격: ${input.price}`);
  if (input.attributes) {
    const attrs = Object.entries(input.attributes)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(", ");
    if (attrs) parts.push(`주요 속성: ${attrs}`);
  }

  return `아래 상품 정보를 보고, 실제 소비자가 ChatGPT에 물어볼 법한 구매 의도 질문 5개를 생성하세요.

${parts.join("\n")}

질문 유형을 반드시 다양하게:
1. 카테고리 추천 (예: "겨울 패딩 추천해줘")
2. 특정 속성 기반 (예: "따뜻하면서 슬림한 패딩")
3. 가격대 질문 (예: "5만원대 여성 패딩 어때?")
4. 용도/상황 질문 (예: "등산할 때 입기 좋은 패딩")
5. 비교 질문 (예: "노스페이스 vs 나이키 패딩 비교")

JSON 배열만 출력하세요. 설명이나 마크다운 없이 순수 JSON만:
["질문1", "질문2", "질문3", "질문4", "질문5"]`;
}

async function callClaude(messages: readonly ClaudeMessage[]): Promise<ClaudeResponse> {
  const env = getCitationEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 400,
        temperature: 0.7,
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
    }

    return (await res.json()) as ClaudeResponse;
  } finally {
    clearTimeout(timer);
  }
}

function extractText(response: ClaudeResponse): string {
  const textBlock = response.content.find((c) => c.type === "text");
  return textBlock?.text ?? "";
}

function parseQuestionsJson(raw: string): readonly string[] {
  // JSON 배열 부분만 추출 (마크다운 코드블록 등 제거)
  const match = /\[[\s\S]*\]/.exec(raw);
  if (!match) throw new Error("JSON 배열을 찾을 수 없습니다.");

  const parsed: unknown = JSON.parse(match[0]);
  if (!Array.isArray(parsed)) throw new Error("배열이 아닙니다.");
  if (parsed.length === 0) throw new Error("빈 배열입니다.");

  return parsed.filter((q): q is string => typeof q === "string" && q.length > 0);
}

/**
 * 상품 정보를 기반으로 구매 의도 질문 5개를 생성한다.
 * 실패 시 1회 재시도 (더 엄격한 프롬프트).
 */
export async function generateCitationQuestions(
  input: GenerateQuestionsInput,
): Promise<GenerateQuestionsResult> {
  const prompt = buildPrompt(input);

  // 1차 시도
  const firstResponse = await callClaude([{ role: "user", content: prompt }]);
  const firstText = extractText(firstResponse);

  try {
    const questions = parseQuestionsJson(firstText);
    return { questions, model: firstResponse.model };
  } catch {
    // 2차 시도 — JSON만 요구하는 후속 메시지
    const retryResponse = await callClaude([
      { role: "user", content: prompt },
      { role: "assistant", content: firstText },
      { role: "user", content: "위 결과를 순수 JSON 배열로만 다시 출력해주세요. 설명 없이 [\"...\", ...] 형태만." },
    ]);
    const retryText = extractText(retryResponse);
    const questions = parseQuestionsJson(retryText);
    return { questions, model: retryResponse.model };
  }
}
