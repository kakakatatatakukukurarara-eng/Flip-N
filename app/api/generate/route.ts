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
    const { text = '', userHobby = '日常会話' } = await req.json();

    if (!text.trim()) {
      return NextResponse.json({ error: 'テキストが空っぽです' }, { status: 400 });
    }

    // AIへの命令文（プロンプト）
    const aiPrompt = `
      あなたは優秀な英語の先生です。
      以下の【入力テキスト】から、学習すべき重要な英単語やフレーズをいくつか（最大5〜10個程度）ピックアップし、単語帳用のデータを生成してください。

      さらに、各単語の【example（例文）】には、ユーザーのマイブームである「${userHobby}」の要素を織り交ぜた、クスッと笑えるような、または情熱的でリアルなシチュエーションの文章を新しく作って入れてください。

      【入力テキスト】:
      ${text}

      出力は、必ず以下のJSON配列フォーマットの形式だけで返してください。余計な挨拶や\`\`\`json などのマークダウン枠は一切不要です。
      [
        {
          "front": "抽出した英単語",
          "back": "その単語の日本語の意味",
          "example": "趣味「${userHobby}」を絡めて、その英単語を使って新しく作った英語の例文",
          "exampleJp": "作った例文の日本語訳"
        }
      ]
    `;

    // Gemini API を呼び出す
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: aiPrompt,
    });

    const responseText = typeof response.text === 'string' ? response.text : '[]';

    // AIから返ってきたテキストをJSONオブジェクト（配列）にパース
    let flashcards: unknown;
    try {
      flashcards = JSON.parse(responseText.trim());
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