type DeckCard = {
  id: number;
  front: string;
  back: string;
  example?: string | null;
  category?: string;
  interval?: number;
  efactor?: number;
  repetition?: number;
  is_public?: boolean;
  next_review_at?: string;
};

type DeckSharingUser = {
  id: string;
};

type DeckSharingSupabaseClient = {
  from: (table: string) => any;
};

export function useDeckSharing<T extends DeckCard>(
  user: DeckSharingUser | null,
  supabase: DeckSharingSupabaseClient,
  cards: T[],
  setCards: React.Dispatch<React.SetStateAction<T[]>>,
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
) {
  const handleShareDeck = async (deckTitle: string, deckDescription: string) => {
    if (!user) {
      showToast('共有するにはログインが必要です', 'error');
      return;
    }

    showToast('共有URLを生成中...', 'info');

    try {
      const sharedDeckQuery = supabase.from('shared_decks') as unknown as {
        insert: (values: unknown[]) => {
          select: () => {
            single: () => Promise<{ data: { id: string } | null; error: Error | null }>;
          };
        };
      };

      const { data: deckData, error: deckError } = await sharedDeckQuery
        .insert([{ title: deckTitle, description: deckDescription, creator_id: user.id }])
        .select()
        .single();

      if (deckError) throw deckError;
      if (!deckData?.id) {
        throw new Error('共有デッキの作成に失敗しました');
      }

      const cardsToInsert = cards.map((card) => ({
        deck_id: deckData.id,
        front: card.front,
        back: card.back,
        example: card.example,
        category: card.category,
      }));

      const sharedDeckCardsQuery = supabase.from('shared_deck_cards') as unknown as {
        insert: (values: unknown[]) => Promise<{ error: Error | null }>;
      };

      const { error: cardsError } = await sharedDeckCardsQuery.insert(cardsToInsert);

      if (cardsError) throw cardsError;

      const shareUrl = `${window.location.origin}?deck_id=${deckData.id}`;
      await navigator.clipboard.writeText(shareUrl);

      showToast('共有URLをコピーしました！SNSに貼り付けよう！', 'success');
    } catch (error: unknown) {
      console.error('Share Error Details:', error);
      const message = error instanceof Error ? error.message : '未知のエラー';
      showToast(`URL作成失敗: ${message}`, 'error');
    }
  };

  const fetchAndPromptImport = async (deckId: string) => {
    try {
      const sharedDeckQuery = supabase.from('shared_decks') as unknown as {
        select: (columns?: string) => {
          eq: (column: string, value: string) => {
            single: () => Promise<{ data: { title: string; description?: string } | null; error: Error | null }>;
          };
        };
      };

      const { data: deck, error: deckError } = await sharedDeckQuery
        .select('title, description')
        .eq('id', deckId)
        .single();

      if (deckError || !deck) return;

      const sharedDeckCardsQuery = supabase.from('shared_deck_cards') as unknown as {
        select: (columns?: string) => {
          eq: (column: string, value: string) => Promise<{ data: DeckCard[] | null; error: Error | null }>;
        };
      };

      const { data: sharedCards, error: cardsError } = await sharedDeckCardsQuery
        .select('front, back, example, category')
        .eq('deck_id', deckId);

      if (cardsError || !sharedCards) return;

      const confirmImport = window.confirm(
        `共有デッキ「${deck.title}」(${sharedCards.length}枚のカード) が見つかりました。\nあなたの単語帳にインポートしますか？`
      );

      if (confirmImport) {
        const importedCards: T[] = sharedCards.map((c: DeckCard) => ({
          ...(c as Partial<T>),
          id: Date.now() + Math.floor(Math.random() * 1000),
          front: c.front,
          back: c.back,
          example: c.example,
          category: c.category || 'Shared',
          interval: 1,
          efactor: 2.5,
          repetition: 0,
          is_public: false,
          next_review_at: new Date().toISOString(),
        } as T));

        setCards((prev) => [...prev, ...importedCards]);
        showToast(`${deck.title} のインポートが完了しました！`, 'success');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err) {
      console.error('インポートエラー:', err);
    }
  };

  return {
    handleShareDeck,
    fetchAndPromptImport,
  };
}
