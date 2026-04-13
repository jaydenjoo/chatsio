import { getCitationEnv } from "@/lib/env";

// ============================================================
// OpenAI Chat Completions API — ChatGPT 질의 전용
// ============================================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const TIMEOUT_MS = 15_000;

interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

interface ChatCompletionResponse {
  readonly choices: ReadonlyArray<{
    readonly message: { readonly content: string | null };
  }>;
  readonly model: string;
}

export interface QueryChatGptResult {
  readonly response: string;
  readonly model: string;
}

const SYSTEM_PROMPT = `당신은 한국의 온라인 쇼핑 전문가입니다. 사용자가 상품을 추천해달라고 하면, 실제 존재하는 상품명과 구매 가능한 링크(URL)를 포함하여 추천해주세요. 특정 브랜드나 쇼핑몰을 알고 있다면 함께 안내해주세요.`;

async function callOpenAI(messages: readonly ChatMessage[]): Promise<ChatCompletionResponse> {
  const env = getCitationEnv();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 800,
        temperature: 0.3,
        messages,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 200)}`);
    }

    return (await res.json()) as ChatCompletionResponse;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ChatGPT에 구매 의도 질문을 보내고 응답을 받는다.
 */
export async function queryChatGpt(question: string): Promise<QueryChatGptResult> {
  const response = await callOpenAI([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ]);

  const content = response.choices[0]?.message.content;
  if (!content) throw new Error("ChatGPT 응답이 비어있습니다.");

  return { response: content, model: response.model };
}
