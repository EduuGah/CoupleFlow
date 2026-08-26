import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Settings, LogOut, Copy, Check, Edit2, Camera, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function Profile() {
  const { signOut, user } = useAuth();
  const { couple, refreshCouple } = useCouple();
  
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const copyInviteCode = () => {
    if (couple?.id) {
      navigator.clipboard.writeText(couple.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let avatarUrl = user.user_metadata?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        avatarUrl = supabase.storage.from('memories').getPublicUrl(fileName).data.publicUrl;
      }

      const { error } = await supabase.auth.updateUser({
        data: { name, avatar_url: avatarUrl }
      });

      if (error) throw error;
      
      toast.success('Perfil atualizado!');
      setIsEditing(false);
      refreshCouple(); // Atualiza membros globalmente
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(user?.user_metadata?.name || '');
    setAvatarPreview(user?.user_metadata?.avatar_url || null);
    setAvatarFile(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Nós</h1>
      </header>

      {/* Perfil Pessoal */}
      <section className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm relative overflow-hidden">
        {!isEditing ? (
          <div className="flex flex-col items-center text-center">
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 rounded-full transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <div className="w-24 h-24 rounded-full bg-stone-100 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden mb-4">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserPlaceholder name={user?.user_metadata?.name || user?.email || 'A'} />
              )}
            </div>
            <h2 className="text-xl font-medium text-stone-900">
              {user?.user_metadata?.name || 'Seu nome'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {user?.email}
            </p>
          </div>
        ) : (
          <div className="flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-medium text-stone-900">Editar Perfil</h3>
              <button onClick={cancelEdit} className="p-2 text-stone-400 hover:bg-stone-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-stone-100 border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserPlaceholder name={name || user?.email || 'A'} />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-stone-800 transition-colors">
                  <Camera size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Como seu amor te chama?</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Espaço do Casal */}
      <section className="bg-orange-50/50 rounded-3xl p-6 border border-orange-100 text-center">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Heart size={24} className="fill-orange-500 text-orange-500" />
        </div>
        <h3 className="text-lg font-medium text-stone-900 mb-1">
          {couple?.name || 'Nosso Espaço'}
        </h3>
        
        {/* Invite Code Area */}
        <div className="mt-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Código para convidar seu amor</p>
          <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl p-2 pl-4">
            <code className="text-stone-600 font-mono text-xs truncate max-w-[200px]">
              {couple?.id || 'Carregando...'}
            </code>
            <button
              onClick={copyInviteCode}
              className="p-2 bg-stone-50 rounded-lg border border-stone-100 hover:border-orange-500 hover:text-orange-600 transition-colors text-stone-400"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider px-2">Opções</h3>
        <div className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden shadow-sm">
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <LogOut size={18} />
              </div>
              <span className="font-medium text-red-600">Sair da conta</span>
            </div>
          </button>
        </div>
      </section>
    </motion.div>
  );
}

function UserPlaceholder({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <span className="text-3xl font-bold text-stone-300">
      {initial}
    </span>
  );
}
