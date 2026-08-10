// src/hooks/useAuth.ts
import { useState } from 'react';

function getAuthRedirectUrl() {
    if (typeof window === 'undefined') return 'http://localhost:3000';

    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('github.dev')) {
        return `${window.location.protocol}//${host}`;
    }

    return 'https://flip-n.vercel.app';
}

export function useAuth(supabase: any, showToast: (msg: string, type: 'success' | 'error' | 'info') => void) {
    const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const ensureAuthReady = () => {
        if (!supabase?.auth) {
            showToast('認証設定が読み込めていません。Supabase の設定を確認してください。', 'error');
            return false;
        }
        return true;
    };

    // ✉️ メール・パスワード認証（ログイン / サインアップ）
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ensureAuthReady()) return;

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            showToast('メールアドレスとパスワードを入力してください。', 'error');
            return;
        }

        if (trimmedPassword.length < 6) {
            showToast('パスワードは6文字以上で入力してください。', 'error');
            return;
        }

        try {
            if (authMode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email: trimmedEmail,
                    password: trimmedPassword,
                    options: {
                        emailRedirectTo: getAuthRedirectUrl(),
                    }
                });

                if (error) {
                    showToast(error.message, 'error');
                    return;
                }

                showToast('アカウント確認メールを送信しました。受信箱を確認してください。', 'success');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: trimmedEmail,
                    password: trimmedPassword,
                });

                if (error) {
                    showToast(error.message, 'error');
                    return;
                }

                showToast('サインインしました！', 'success');
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : '認証に失敗しました。';
            showToast(message, 'error');
            return;
        } finally {
            setAuthMode(null);
        }
    };

    // 🌐 OAuth（Google / GitHub）ログイン
    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        if (!ensureAuthReady()) return;

        const redirectUrl = getAuthRedirectUrl();
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: redirectUrl }
        });
        if (error) showToast(error.message, 'error');
    };

    // 🚪 ログアウト
    const handleLogout = async (setActiveTab: (tab: any) => void) => {
        if (!ensureAuthReady()) return;
        await supabase.auth.signOut();
        showToast('ログアウトしました', 'info');
        setActiveTab('study');
    };

    return {
        authMode,
        setAuthMode,
        email,
        setEmail,
        password,
        setPassword,
        handleAuth,
        handleOAuthLogin,
        handleLogout,
    };
}