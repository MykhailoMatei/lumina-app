
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { X, Mail, Lock, Loader2, Sparkles, ArrowRight, Github, ShieldCheck, Chrome } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { themeClasses, t, triggerNotification } = useApp();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                triggerNotification(t('auth_title'), t('check_email_msg'), 'achievement');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                triggerNotification(t('auth_title'), t('welcome_back'), 'achievement');
                onClose();
            }
        } catch (error: any) {
            triggerNotification(t('auth_error'), error.message, 'reminder');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (error: any) {
            triggerNotification(t('auth_error'), error.message, 'reminder');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in fade-in duration-300">
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />
            
            {/* Immersive Bottom Sheet */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[3rem] p-8 pb-12 shadow-2xl relative animate-in slide-in-from-bottom-full duration-500 border-t border-white/10 overflow-hidden">
                {/* Drag Handle Decoration */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                
                <div className={`absolute top-0 right-0 w-48 h-48 ${themeClasses.primary} opacity-5 rounded-full blur-3xl -mr-24 -mt-24`} />
                
                <div className="flex justify-between items-start mb-8 pt-2">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            {isSignUp ? 'Claim Your Map' : 'Welcome Home'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isSignUp ? 'Establish your private growth vault' : 'Resume your personal evolution'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 hover:text-slate-500 transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Social Login Section */}
                <div className="space-y-3 mb-8">
                    <button 
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all hover:bg-slate-50"
                    >
                        <Chrome size={18} className="text-slate-700 dark:text-white" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-white">Continue with Google</span>
                    </button>
                    
                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Or use email</span>
                        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                    </div>
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    <div className="space-y-2">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input 
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold border border-transparent focus:border-indigo-500/30 outline-none dark:text-white transition-all"
                                placeholder="name@domain.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input 
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold border border-transparent focus:border-indigo-500/30 outline-none dark:text-white transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-[2rem] bg-gradient-to-br ${themeClasses.gradient} text-white font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 mt-4`}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} strokeWidth={3} />}
                        {isSignUp ? 'Create Growth Vault' : 'Secure Entry'}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <button 
                        onClick={() => setIsSignUp(!isSignUp)}
                        className={`text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-2 mx-auto`}
                    >
                        {isSignUp ? 'Existing Traveler?' : 'New to Lumina?'} 
                        <span className={themeClasses.text}>{isSignUp ? 'Sign In' : 'Join the Collective'}</span>
                    </button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">
                    <Lock size={10} /> 256-Bit Personal Encryption Active
                </div>
            </div>
        </div>
    );
};
