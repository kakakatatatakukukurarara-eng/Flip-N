import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

interface Explanation {
  nuance: string;
  usage: string;
  similar: string;
  mistakes: string;
  pronunciation: string;
  example: string;
  exampleJp: string;
  quiz: string;
  quizAnswer: string;
}

export async function POST(request: Request) {
  try {
    if (!ai) return NextResponse.json({ error: 'GEMINI_API_KEY が未設定です。' }, { status: 500 });

    const body = await request.json() as { front?: unknown; back?: unknown; example?: unknown; hobby?: unknown; subject?: unknown };
    const front = typeof body.front === 'string' ? body.front.trim() : '';
    const back = typeof body.back === 'string' ? body.back.trim() : '';
    const example = typeof body.example === 'string' ? body.example.trim() : '';
    const hobby = typeof body.hobby === 'string' ? body.hobby.trim().slice(0, 80) : '日常会話';
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 40) : '自動判定';

    if (!front || !back) return NextResponse.json({ error: '単語と意味が必要です。' }, { status: 400 });
    if (front.length > 200 || back.length > 300) return NextResponse.json({ error: 'カードの内容が長すぎます。' }, { status: 400 });

    const prompt = `あなたは日本人向けの優秀な学習講師です。入力された言語と分野を自動判定し、次のカードを深掘りしてください。
  分野: ${subject}
  単語・表現: ${front}
意味: ${back}
既存の例文: ${example || 'なし'}
学習者の趣味: ${hobby}

次のJSONオブジェクトだけを返してください。Markdownや挨拶は不要です。
{
  "nuance": "この表現のニュアンスを日本語で簡潔に",
  "usage": "自然に使う場面を日本語で簡潔に",
  "similar": "似た表現との違い。なければ『特になし』",
  "mistakes": "日本人がしやすい間違い",
  "pronunciation": "発音のポイントを日本語で",
  "example": "趣味を少し絡めた自然な入力言語の例文",
  "exampleJp": "例文の日本語訳",
  "quiz": "この単語・表現の意味を問う短い日本語の問題文",
  "quizAnswer": "クイズの答え"
}`;

    const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
    const text = typeof response.text === 'string'
      ? response.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
      : '';
    let explanation: unknown;
    try {
      explanation = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'AIの返答を読み取れませんでした。' }, { status: 502 });
    }

    if (!explanation || typeof explanation !== 'object') {
      return NextResponse.json({ error: 'AIの返答形式が正しくありません。' }, { status: 502 });
    }

    const source = explanation as Record<string, unknown>;
    const getText = (field: keyof Explanation) => typeof source[field] === 'string' ? source[field] as string : '';
    const result: Explanation = {
      nuance: getText('nuance'),
      usage: getText('usage'),
      similar: getText('similar'),
      mistakes: getText('mistakes'),
      pronunciation: getText('pronunciation'),
      example: getText('example'),
      exampleJp: getText('exampleJp'),
      quiz: getText('quiz'),
      quizAnswer: getText('quizAnswer'),
    };
    return NextResponse.json({ explanation: result });
  } catch (error) {
    console.error('AI深掘りエラー:', error);
    const message = error instanceof Error ? error.message : '';
    if (/API key|GEMINI_API_KEY|invalid|unauthorized|forbidden/i.test(message)) {
      return NextResponse.json({ error: `Gemini APIエラー: ${message}` }, { status: 502 });
    }
    return NextResponse.json({ error: `AI深掘りに失敗しました。${message || '時間を置いて再試行してください。'}` }, { status: 500 });
  }
}
