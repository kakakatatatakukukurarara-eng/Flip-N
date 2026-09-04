import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export async function POST(req: Request) {
  try {
    if (!geminiApiKey || !ai) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY が未設定です。プロジェクトルートの .env.local に GEMINI_API_KEY=... を追加してください。' },
        { status: 500 }
      );
    }

    // フロント（page.tsx）から「入力テキスト」と「ユーザーの趣味」を受け取る
    const { text = '', userHobby = '日常会話', subject = '自動判定' } = await req.json();

    if (!text.trim()) {
      return NextResponse.json({ error: 'テキストが空っぽです' }, { status: 400 });
    }

    // AIへの命令文（プロンプト）
    const aiPrompt = `
      あなたは優秀な語学講師です。
      以下の【入力テキスト】の言語と分野を自動判定し、学習すべき重要な用語や概念をいくつか（最大5〜10個程度）ピックアップして、汎用単語帳用のデータを生成してください。
      指定分野は「${subject}」です。自動判定の場合も、入力内容から語学・理科・歴史・数学などの分野を推定してください。理科・歴史・数学などの場合は、frontに用語、backに正確な日本語の説明を入れてください。
      frontには入力テキストの言語の単語、backには自然な日本語の意味を入れてください。

      さらに、各単語の【example（例文）】には、ユーザーのマイブームである「${userHobby}」の要素を織り交ぜた、クスッと笑えるような、または情熱的でリアルなシチュエーションの文章を新しく作って入れてください。

      【入力テキスト】:
      ${text}

      出力は、必ず以下のJSON配列フォーマットの形式だけで返してください。余計な挨拶や\`\`\`json などのマークダウン枠は一切不要です。
      [
        {
          "front": "抽出した単語またはフレーズ（入力言語のまま）",
          "back": "その用語・表現の日本語の意味または説明",
          "example": "趣味「${userHobby}」を絡めて、その単語を使って新しく作った入力言語の例文",
          "exampleJp": "作った例文の日本語訳"
        }
      ]
    `;

    // Gemini API を呼び出す
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: aiPrompt,
    });

    const responseText = typeof response.text === 'string' ? response.text : '[]';

    // AIから返ってきたテキストをJSONオブジェクト（配列）にパース
    let flashcards: unknown;
    try {
      const normalizedResponse = responseText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      flashcards = JSON.parse(normalizedResponse);
    } catch {
      return NextResponse.json({ error: 'AIの返答がJSON形式ではありませんでした。' }, { status: 500 });
    }

    if (!Array.isArray(flashcards)) {
      return NextResponse.json({ error: 'AIの返答形式が正しくありません。' }, { status: 500 });
    }

    // 生成されたカードの配列をフロントエンドに返す
    return NextResponse.json({ flashcards });

  } catch (error) {
    console.error('AI単語帳生成エラー:', error);
    const rawMessage = error instanceof Error ? error.message : '単語帳の自動生成に失敗しました';
    const message = /API key|GEMINI_API_KEY|invalid|unauthorized|forbidden/i.test(rawMessage)
      ? `Gemini API エラー: ${rawMessage}`
      : rawMessage;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}