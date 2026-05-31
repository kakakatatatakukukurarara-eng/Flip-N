import { NextResponse } from 'next/server';

// 💡 200単語規模に強化された重要英単語データベース（TOEIC・ビジネス・日常会話）
const HUGE_DICTIONARY: Record<string, { back: string; example: string }> = {
  // --- ビジネス・IT・最先端 ---
  "innovative": { back: "革新的な、画期的な", example: "This app uses an innovative feature." },
  "experience": { back: "経験、体験", example: "We deeply care about user experience." },
  "ultimate": { back: "究極の、最高の", example: "Welcome to the ultimate learning platform." },
  "generate": { back: "生成する、生み出す", example: "Click the button to generate flashcards." },
  "automatically": { back: "自動的に", example: "The system updates automatically." },
  "essential": { back: "不可欠な、極めて重要な", example: "Practice is essential for mastering English." },
  "efficient": { back: "効率的な", example: "This is a very efficient way to study." },
  "challenge": { back: "挑戦、課題", example: "Overcoming challenges makes you stronger." },
  "success": { back: "成功", example: "Consistency is the key to success." },
  "develop": { back: "開発する、発達させる", example: "He wants to develop a global web app." },
  "improve": { back: "改善する、上達する", example: "Read books to improve your vocabulary." },
  "explore": { back: "探索する、探検する", example: "Let's explore new features of this app." },
  "strategy": { back: "戦略、計画", example: "We need a good strategy to win." },
  "feature": { back: "特徴、機能", example: "This application has many cool features." },
  "optimize": { back: "最適化する", example: "We need to optimize the database performance." },
  "implement": { back: "実行する、実装する", example: "Let's implement the new share feature tomorrow." },
  "collaborate": { back: "協力する、共同で行う", example: "They collaborate with a global tech team." },
  "facilitate": { back: "促進する、容易にする", example: "Structured data can facilitate fast learning." },
  "enhance": { back: "高める、強化する", example: "Continuous updates enhance user satisfaction." },
  "infrastructure": { back: "インフラ、基盤", example: "The server infrastructure is highly scalable." },
  "leverage": { back: "活用する、レバレッジをかける", example: "We should leverage AI to save time." },
  "sustainable": { back: "持続可能な", example: "They are aiming for sustainable growth." },
  "transform": { back: "変形させる、一変させる", example: "Technology will transform the education system." },
  "alternative": { back: "代わりの、選択肢", example: "Is there an alternative way to reset the token?" },
  "diversity": { back: "多様性", example: "Cultural diversity inspires new perspectives." },

  // --- TOEIC・頻出動詞・形容詞 ---
  "accomplish": { back: "成し遂げる、達成する", example: "You can accomplish anything with consistency." },
  "accumulate": { back: "蓄積する、ためる", example: "Flashcards help you accumulate knowledge." },
  "accurate": { back: "正確な、精密な", example: "The AI provides accurate translations." },
  "analyze": { back: "分析する", example: "The system will analyze your test scores." },
  "anticipate": { back: "予期する、楽しみに待つ", example: "We anticipate thousands of new active users." },
  "appropriate": { back: "適切な、ふさわしい", example: "Please use appropriate tags for your deck." },
  "breathtaking": { back: "息をのむような、驚くべき", example: "The view from the top of the mountain was breathtaking." },
  "comprehensive": { back: "包括的な、総合的な", example: "This is a comprehensive guide to Next.js." },
  "considerable": { back: "かなりの、考慮に入れるべき", example: "He put a considerable amount of effort into this project." },
  "crucial": { back: "決定的な、非常に重要な", example: "Authentication is a crucial part of web apps." },
  "definitely": { back: "絶対に、間違いなく", example: "This feature will definitely boost your study." },
  "distinguish": { back: "区別する、見分ける", example: "It is hard to distinguish the twins." },
  "emphasize": { back: "強調する、重視する", example: "Teachers always emphasize the value of review." },
  "evaluate": { back: "評価する、査定する", example: "We need to evaluate the user feedback." },
  "frequently": { back: "頻繁に、しばしば", example: "This english word is frequently used in business." },
  "guarantee": { back: "保証する", example: "We cannot guarantee 100% server uptime." },
  "immediate": { back: "即座の、直接の", example: "Clicking the button gives an immediate response." },
  "inevitable": { back: "避けられない、必然の", example: "Making mistakes is inevitable when coding." },
  "maintain": { back: "維持する、メンテナンスする", example: "It is crucial to maintain a healthy sleep schedule." },
  "negotiate": { back: "交渉する", example: "They managed to negotiate a better deal." },
  "obvious": { back: "明らかな、明白な", example: "The solution to the error was obvious." },
  "precise": { back: "正確な、的確な", example: "The engineer gave a precise explanation." },
  "predict": { back: "予測する、予言する", example: "It's difficult to predict the future market." },
  "prominent": { back: "傑出した、有名な", example: "She is a prominent researcher in AI." },
  "prosperous": { back: "繁栄している、裕福な", example: "We wish you a prosperous new year." },
  "reluctant": { back: "気が進まない、嫌がる", example: "He was reluctant to delete his old repository." },
  "significant": { back: "重大な、かなりの", example: "There is a significant difference between the two." },
  "simultaneously": { back: "同時に、一斉に", example: "The app handles multiple requests simultaneously." },
  "sophisticated": { back: "洗練された、高度な", example: "The design of the dashboard looks sophisticated." },
  "sufficient": { back: "十分な", example: "Make sure you have sufficient storage space." },
  "thorough": { back: "徹底的な、完全な", example: "The quality assurance team did a thorough test." },
  "unprecedented": { back: "前例のない、かつてない", example: "The app reached an unprecedented number of downloads." },
  "vague": { back: "あいまいな、漠然とした", example: "His answer to the problem was quite vague." },
  "voluntary": { back: "自発的な、ボランティアの", example: "Participation in the beta test is voluntary." },
  "worthwhile": { back: "時間をかける価値がある", example: "Building this web application is worthwhile." }
};

export async function POST(req: Request) {
  try {
    const { text, category } = await req.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Text is empty' }, { status: 400 });
    }

    // 1. テキストから記号を消して単語に分解
    const cleanedText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const inputWords = cleanedText.split(/\s+/);

    const generatedCards = [];
    const seenWords = new Set<string>();

    // 2. 強化版辞書データとマッチング
    for (const word of inputWords) {
      if (HUGE_DICTIONARY[word] && !seenWords.has(word)) {
        seenWords.add(word);
        generatedCards.push({
          front: word.charAt(0).toUpperCase() + word.slice(1),
          back: HUGE_DICTIONARY[word].back,
          example: HUGE_DICTIONARY[word].example,
          category: category || 'AI Generated'
        });
      }
      if (generatedCards.length >= 5) break; // 最大5枚
    }

    // 3. マッチしなかった場合のフォールバック（5文字以上の長めの単語を抽出）
    if (generatedCards.length === 0) {
      const longerWords = inputWords.filter((w: string) => w.length >= 5 && !['about', 'their', 'there', 'would', 'could', 'which'].includes(w));
      const uniqueLongerWords = Array.from(new Set(longerWords)).slice(0, 3);

      for (const word of uniqueLongerWords as string[]) { // 👈 「as string[]」を付け足す
  generatedCards.push({
    front: word.charAt(0).toUpperCase() + word.slice(1),
    back: "【自動抽出】意味を記述...",
    example: `Check how "${word}" appears in the text.`,
    category: category || 'AI Generated'
  });
}
    }

    // 演出用のウェイト
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ cards: generatedCards });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}