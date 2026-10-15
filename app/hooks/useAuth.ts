// src/hooks/useAuth.ts
import { useState } from 'react';
import type { SupabaseClientMinimal, ShowToastFn } from '../types';

function getAuthRedirectUrl() {
    if (typeof window === 'undefined') return 'http://localhost:3000';

    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('github.dev')) {
        return `${window.location.protocol}//${host}`;
    }

    return 'https://flip-n.vercel.app';
}

export function useAuth(supabase: SupabaseClientMinimal, showToast: ShowToastFn) {
    const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const ensureAuthReady = () => {
        if (!supabase?.auth) {
            showToast('認証設定が読み込めていません。Supabase の設定を確認してください。', 'error');
            return null;
        }
        return supabase.auth;
    };

    // ✉️ メール・パスワード認証（ログイン / サインアップ）
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        const auth = ensureAuthReady();
        if (!auth) return;

        const trimmedEmail = email.trim();

        if (!trimmedEmail || !password) {
            showToast('メールアドレスとパスワードを入力してください。', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('パスワードは6文字以上で入力してください。', 'error');
            return;
        }

        try {
            if (authMode === 'signup') {
                const { error } = await auth.signUp({
                    email: trimmedEmail,
                    password,
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
                const { error } = await auth.signInWithPassword({
                    email: trimmedEmail,
                    password,
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
        const auth = ensureAuthReady();
        if (!auth) return;

        const redirectUrl = getAuthRedirectUrl();
        const { error } = await auth.signInWithOAuth({
            provider,
            options: { redirectTo: redirectUrl }
        });
        if (error) showToast(error.message, 'error');
    };

    // 🚪 ログアウト
    const handleLogout = async (setActiveTab: React.Dispatch<React.SetStateAction<'home' | 'study' | 'test' | 'manage' | 'shared' | 'dashboard'>>) => {
        const auth = ensureAuthReady();
        if (!auth) return;
        await auth.signOut({ scope: 'local' });
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