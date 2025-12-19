import React from 'react';
import { Shield, X, Lock, Database, UserCheck, EyeOff } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export const PrivacyPolicy: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Shield className="text-emerald-500" size={24} />
                        <h2 className="text-lg font-bold text-slate-800">Privacy & Data Policy</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed">
                    <section>
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Database size={16}/> 1. Data Storage</h3>
                        <p>Lumina follows a <strong>Local-First</strong> philosophy. All your journal entries, goals, habits, and personal settings are stored locally on your device using browser LocalStorage. We do not host your personal data on external servers.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Lock size={16}/> 2. Security</h3>
                        <p>You can enable an App Lock (PIN) to prevent unauthorized access on your device. While this provides a layer of UI security, please note that because data is stored in the browser, clearing your browser cache may verify deletion of your data.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><EyeOff size={16}/> 3. Incognito Participation</h3>
                        <p>When participating in the Community, you can enable <strong>Incognito Mode</strong>. This masks your display name and avatar, allowing you to share and ask questions anonymously.</p>
                    </section>
                    
                    <section>
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><UserCheck size={16}/> 4. User Rights</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Right to Access:</strong> You can view all your data within the app.</li>
                            <li><strong>Right to Portability:</strong> You can export your full data set as a JSON file at any time.</li>
                            <li><strong>Right to be Forgotten:</strong> You can permanently delete your account and all associated data via the Settings menu.</li>
                        </ul>
                    </section>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-xs">
                        <strong>Note on AI Processing:</strong> Text sent to the AI Assistant for prompts or insights is processed by Google Gemini. This data is transient and not used to train models.
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                    <button onClick={onClose} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold text-sm hover:opacity-90">
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};