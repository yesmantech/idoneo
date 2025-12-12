import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Camera, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfileSetupPage() {
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();

    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load existing data if available
    useEffect(() => {
        if (profile) {
            if (profile.nickname) setNickname(profile.nickname);
            if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
        }
    }, [profile]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            setError(null);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Devi selezionare un\'immagine da caricare.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);

        } catch (error: any) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setSaving(true);
            setError(null);

            const updates = {
                id: user.id,
                nickname,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;

            // Refresh context to reflect changes
            await refreshProfile();

            // Redirect to waitlist success page
            navigate('/waitlist/success');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col justify-center overflow-hidden relative">

            {/* Content Container */}
            <div className="w-full max-w-md mx-auto px-6 flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 relative z-10 pb-8">

                {/* Cloud Mascot (Simplified/Static for now, or just generic icon) */}
                <div className="w-24 h-24 bg-sky-50 rounded-full flex items-center justify-center animate-bounce-slow">
                    <User className="w-10 h-10 text-sky-500" strokeWidth={2} />
                </div>

                {/* Header */}
                <div className="space-y-3 text-center w-full">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                        Completa il profilo
                    </h1>
                    <h2 className="text-[17px] md:text-lg font-medium text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">
                        Scegli una foto e un nickname per iniziare
                    </h2>
                </div>

                {/* Avatar Upload */}
                <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg shadow-slate-200 transition-all group-hover:scale-105 group-hover:shadow-xl">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-slate-300" />
                        )}

                        {/* Overlay when uploading */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Camera Button */}
                    <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-1 right-1 bg-[#00B1FF] text-white p-2.5 rounded-full shadow-lg cursor-pointer hover:bg-[#0099e6] transition-colors"
                    >
                        <Camera className="w-5 h-5" />
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Nickname</label>
                        <input
                            type="text"
                            placeholder="Inserisci il tuo nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            required
                            className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F5] text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B1FF]/50 focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-medium text-center animate-in fade-in">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving || uploading || !nickname.trim()}
                        className="w-full h-14 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[17px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Salvataggio...' : 'Continua'}
                    </button>

                    <p className="text-[11px] text-slate-400 font-medium text-center">
                        Potrai modificare queste informazioni in seguito
                    </p>
                </form>
            </div>
        </div>
    );
}
