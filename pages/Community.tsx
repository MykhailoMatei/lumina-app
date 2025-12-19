import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
    MessageCircle, Heart, Share2, Plus, Users, 
    CheckCircle2, MessageSquare, Send, X, EyeOff, Languages, Loader2, Sparkles
} from 'lucide-react';
import { Post, Comment } from '../types';
import { translateContent } from '../services/geminiService';

export const Community: React.FC = () => {
    const { 
        posts, events, avatar, name, themeClasses, securitySettings, language, t,
        addPost, likePost, addComment, toggleEventJoin 
    } = useApp();

    const [activeTab, setActiveTab] = useState<'Feed' | 'Events'>('Feed');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

    const [translatedPosts, setTranslatedPosts] = useState<Record<string, { title: string, content: string }>>({});
    const [translatingId, setTranslatingId] = useState<string | null>(null);

    const [newPostContent, setNewPostContent] = useState('');
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostCategory, setNewPostCategory] = useState('General');
    const [newPostType, setNewPostType] = useState<'discussion' | 'question' | 'share'>('discussion');

    const [commentInput, setCommentInput] = useState('');

    const CATEGORIES = ['All', 'Habits', 'Goals', 'Mindfulness', 'Productivity', 'Wellness'];

    const filteredPosts = posts.filter((p: Post) => selectedCategory === 'All' || p.category === selectedCategory);

    const isIncognito = securitySettings?.incognitoMode;
    const displayName = isIncognito ? t('anonymous') : name;
    const displayAvatar = isIncognito ? '🕵️' : avatar;

    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newPostTitle.trim() || !newPostContent.trim()) return;

        addPost({
            id: Date.now().toString(),
            author: displayName,
            avatar: displayAvatar,
            category: newPostCategory,
            title: newPostTitle,
            content: newPostContent,
            likes: 0,
            likedBy: [],
            comments: [],
            timestamp: new Date().toISOString(),
            type: newPostType
        });

        setShowCreateModal(false);
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostCategory('General');
    };

    const handleTranslatePost = async (post: Post) => {
        if (translatedPosts[post.id]) {
            const { [post.id]: removed, ...rest } = translatedPosts;
            setTranslatedPosts(rest);
            return;
        }

        setTranslatingId(post.id);
        const result = await translateContent(post.title, post.content, language);
        setTranslatedPosts((prev: any) => ({ ...prev, [post.id]: result }));
        setTranslatingId(null);
    };

    const handleSendComment = (postId: string) => {
        if(!commentInput.trim()) return;
        addComment(postId, {
            id: Date.now().toString(),
            author: displayName,
            avatar: displayAvatar,
            content: commentInput,
            timestamp: new Date().toISOString()
        });
        setCommentInput('');
    };

    const getTimeAgo = (isoDate: string) => {
        const diff = Date.now() - new Date(isoDate).getTime();
        const mins = Math.floor(diff / 60000);
        if(mins < 60) return `${mins}${t('minutes_short')} ${t('ago_suffix')}`;
        const hours = Math.floor(mins / 60);
        if(hours < 24) return `${hours}${t('hours_short')} ${t('ago_suffix')}`;
        return `${Math.floor(hours / 24)}${t('days_short')} ${t('ago_suffix')}`;
    };

    const dateLocale = language === 'Ukrainian' ? 'uk-UA' : (language === 'Spanish' ? 'es-ES' : (language === 'French' ? 'fr-FR' : (language === 'German' ? 'de-DE' : 'en-US')));

    return (
        <div className="pb-24 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t('community')}</h1>
                    {isIncognito && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-fit mt-1.5 font-bold uppercase tracking-wider">
                            <EyeOff size={10} /> {t('incognito')}
                        </div>
                    )}
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl flex text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setActiveTab('Feed')}
                        className={`px-5 py-2.5 rounded-xl transition-all ${activeTab === 'Feed' ? 'bg-white dark:bg-slate-800 shadow-md text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        {t('feed_tab')}
                    </button>
                    <button
                        onClick={() => setActiveTab('Events')}
                        className={`px-5 py-2.5 rounded-xl transition-all ${activeTab === 'Events' ? 'bg-white dark:bg-slate-800 shadow-md text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        {t('events_tab')}
                    </button>
                </div>
            </div>

            {activeTab === 'Feed' && (
                <div className="space-y-4">
                     <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {CATEGORIES.map((cat: string) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border ${selectedCategory === cat ? `${themeClasses.primary} text-white border-transparent shadow-sm` : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600'}`}
                            >
                                {cat === 'All' ? t('all_label') || 'All' : cat}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {filteredPosts.map((post: Post) => {
                            const isLiked = post.likedBy.includes('me');
                            const isExpanded = expandedPostId === post.id;
                            const translation = translatedPosts[post.id];
                            const isTranslating = translatingId === post.id;
                            
                            return (
                                <div key={post.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                                                {post.avatar}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{post.author}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{getTimeAgo(post.timestamp)}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"/>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 uppercase tracking-widest`}>
                                                        {post.category}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleTranslatePost(post)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${translation ? `${themeClasses.secondary} ${themeClasses.text}` : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
                                            {translation ? t('original_btn') : t('translate_btn')}
                                        </button>
                                    </div>

                                    <div onClick={() => setExpandedPostId(isExpanded ? null : post.id)} className="cursor-pointer space-y-2.5">
                                        {translation && (
                                            <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.2em] ${themeClasses.text} mb-1 animate-in fade-in`}>
                                                <Sparkles size={10} /> {t('localized_ai_translation')}
                                            </div>
                                        )}
                                        <h2 className={`font-bold text-slate-800 dark:text-slate-50 text-lg tracking-tight leading-tight ${translation ? 'animate-in slide-in-from-left-2' : ''}`}>
                                            {translation ? translation.title : post.title}
                                        </h2>
                                        <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${translation ? 'animate-in slide-in-from-left-4' : ''}`}>
                                            {isExpanded 
                                                ? (translation ? translation.content : post.content)
                                                : ((translation ? translation.content : post.content).substring(0, 140) + ((translation ? translation.content : post.content).length > 140 ? '...' : ''))}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-50 dark:border-slate-800/50">
                                        <div className="flex gap-6">
                                            <button 
                                                onClick={() => likePost(post.id)}
                                                className={`flex items-center gap-2 text-xs font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} /> {post.likes}
                                            </button>
                                            <button 
                                                onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                                                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                                            >
                                                <MessageSquare size={18} strokeWidth={2.5} /> {post.comments.length}
                                            </button>
                                        </div>
                                        <button className="text-slate-300 dark:text-slate-700 hover:text-slate-500">
                                            <Share2 size={18} />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50 animate-in slide-in-from-top-4">
                                            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto no-scrollbar pr-1">
                                                {post.comments.map((c: Comment) => (
                                                    <div key={c.id} className="flex gap-4 text-sm">
                                                        <span className="text-2xl mt-1">{c.avatar}</span>
                                                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5">
                                                                    {c.author}
                                                                    {c.isExpert && <CheckCircle2 size={12} className="text-indigo-500 fill-indigo-50" />}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{getTimeAgo(c.timestamp)}</span>
                                                            </div>
                                                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{c.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {post.comments.length === 0 && (
                                                    <div className="text-center py-6 opacity-40">
                                                        <MessageCircle className="mx-auto mb-2" size={24} />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest">{t('no_templates_msg')}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 pt-2">
                                                <input 
                                                    value={commentInput}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentInput(e.target.value)}
                                                    placeholder={isIncognito ? t('comment_anon_ph') : t('add_comment_ph')}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                                                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendComment(post.id)}
                                                />
                                                <button 
                                                    onClick={() => handleSendComment(post.id)}
                                                    className={`${themeClasses.primary} text-white p-3.5 rounded-2xl shadow-lg active:scale-90 transition-transform`}
                                                >
                                                    <Send size={20} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'Events' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[100px] opacity-40 -mr-16 -mt-16"/>
                        <div className="relative z-10">
                            <span className="bg-white/10 border border-white/20 backdrop-blur-md text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] mb-4 inline-block">{t('global_challenge')}</span>
                            <h2 className="text-3xl font-black mb-3 tracking-tight">30 Days of Mindfulness</h2>
                            <p className="text-indigo-200/80 text-sm mb-8 max-w-xs font-medium leading-relaxed">Join 1,200+ members in a guided daily journey to discover inner peace and productivity.</p>
                            <button className="bg-white text-indigo-950 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">
                                {t('register_now')}
                            </button>
                        </div>
                    </div>

                    <div className="px-1 flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">{t('events_tab')}</h2>
                        <button className={`text-xs font-bold ${themeClasses.text}`}>{t('view_all')}</button>
                    </div>
                    
                    <div className="space-y-5">
                        {events.map((event: any) => (
                            <div key={event.id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                                <div className="h-44 bg-slate-200 relative shrink-0">
                                    <img src={event.image} className="w-full h-full object-cover" alt={event.title} />
                                    <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur text-slate-800 dark:text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">
                                        {new Date(event.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="absolute bottom-4 left-4 flex -space-x-2">
                                        {[1, 2, 3].map((i: number) => (
                                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 flex items-center justify-center text-[10px] shadow-sm">
                                                {['🏃', '🧘', '🧠'][i-1]}
                                            </div>
                                        ))}
                                        <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-white/20 backdrop-blur text-white flex items-center justify-center text-[8px] font-bold">
                                            +{event.participants}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-50 tracking-[0.2em]">{event.type}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                <Users size={12} /> {event.participants} {t('participants_count')}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 text-lg tracking-tight">{event.title}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium leading-relaxed">{event.description}</p>
                                    </div>
                                    <div className="mt-6">
                                        <button 
                                            onClick={() => toggleEventJoin(event.id)}
                                            className={`w-full py-4 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] ${
                                                event.joined 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' 
                                                : `${themeClasses.primary} text-white shadow-lg ${themeClasses.shadow}`
                                            }`}
                                        >
                                            {event.joined ? t('already_joined') : t('register_now')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button 
                onClick={() => setShowCreateModal(true)}
                className={`fixed bottom-24 right-6 w-16 h-16 rounded-full ${themeClasses.primary} text-white shadow-2xl ${themeClasses.shadow} flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40`}
            >
                <Plus size={32} strokeWidth={3} />
            </button>

            {showCreateModal && (
                <div className="fixed -inset-20 z-[100] bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-50 tracking-tight">{t('create_post_title')}</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('share_world_subtitle')}</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-full text-slate-400 hover:bg-slate-100 transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreatePost} className="space-y-5">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{t('headline_label')}</label>
                                <input 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-sm"
                                    placeholder={t('post_title_ph')}
                                    value={newPostTitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPostTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{t('category_label')}</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-4 text-slate-800 dark:text-white outline-none font-bold text-xs"
                                        value={newPostCategory}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPostCategory(e.target.value)}
                                    >
                                        {CATEGORIES.filter(c => c !== 'All').map((c: string) => <option key={c} value={c}>{c === 'All' ? t('all_label') || 'All' : c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{t('type_label')}</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-4 py-4 text-slate-800 dark:text-white outline-none font-bold text-xs"
                                        value={newPostType}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPostType(e.target.value as any)}
                                    >
                                        <option value="discussion">{t('discuss_label')}</option>
                                        <option value="question">{t('ask_label')}</option>
                                        <option value="share">{t('share_label')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{t('content_label')}</label>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none h-40 font-medium text-sm leading-relaxed"
                                    placeholder={isIncognito ? t('comment_anon_ph') : t('post_content_ph')}
                                    value={newPostContent}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPostContent(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit" 
                                className={`w-full bg-gradient-to-br ${themeClasses.gradient} text-white py-5 rounded-2xl font-bold shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3`}
                            >
                                {t('publish_post')} {isIncognito && t('incognito_suffix')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};