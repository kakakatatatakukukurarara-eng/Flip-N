// src/hooks/useAuth.ts
import { useState } from 'react';

export function useAuth(supabase: any, showToast: (msg: string, type: 'success' | 'error' | 'info') => void) {
    const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // ✉️ メール・パスワード認証（ログイン / サインアップ）
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (authMode === 'signup') {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) showToast(error.message, 'error');
            else showToast('アカウント確認メールを送信しました！', 'success');
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) showToast(error.message, 'error');
            else showToast('サインインしました！', 'success');
        }
        setAuthMode(null);
    };

    // 🌐 OAuth（Google / GitHub）ログイン
    const handleOAuthLogin = async (provider: 'google' | 'github') => {
        let redirectUrl = 'https://flip-n.vercel.app';
        if (typeof window !== 'undefined') {
            const host = window.location.host;
            if (host.includes('localhost') || host.includes('github.dev')) {
                redirectUrl = `${window.location.protocol}//${host}`;
            }
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: redirectUrl }
        });
        if (error) showToast(error.message, 'error');
    };

    // 🚪 ログアウト
    const handleLogout = async (setActiveTab: (tab: any) => void) => {
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