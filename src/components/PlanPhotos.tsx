import React, { useEffect, useState, useRef } from 'react';
import { ImagePlus, X, Trash2, Maximize2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PlanPhoto } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanPhotosProps {
  planId: string;
}

export function PlanPhotos({ planId }: PlanPhotosProps) {
  const [photos, setPhotos] = useState<PlanPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PlanPhoto | null>(null);
  
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPhotos();

    const channel = supabase
      .channel(`photos-${planId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_photos',
          filter: `plan_id=eq.${planId}`,
        },
        () => {
          // Simplest approach: refetch on any change
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId]);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plan_photos')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhotos(data as PlanPhoto[]);
    }
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validation
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }
    
    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem é muito grande. O tamanho máximo permitido é 5MB.');
      return;
    }

    if (!user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${planId}/${fileName}`;

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from('plan_photos')
        .insert([
          {
            plan_id: planId,
            user_id: user.id,
            storage_path: filePath,
          }
        ]);

      if (dbError) throw dbError;

    } catch (error: any) {
      console.error(error);
      alert(`Erro ao fazer upload da imagem: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (photo: PlanPhoto) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('memories')
        .remove([photo.storage_path]);
        
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('plan_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;
      
      setPhotos(photos.filter(p => p.id !== photo.id));
      if (previewPhoto?.id === photo.id) {
        setPreviewPhoto(null);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao excluir a imagem: ${error.message}`);
    }
  };

  const getImageUrl = (path: string) => {
    return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="space-y-4">
      
      {/* Upload Action */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider px-2">Galeria</h3>
        
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin"></div>
            ) : (
              <ImagePlus size={16} />
            )}
            {uploading ? 'Enviando...' : 'Adicionar Foto'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 border-dashed rounded-3xl p-8 text-center">
          <ImagePlus size={32} className="mx-auto text-stone-400 mb-3" />
          <h3 className="text-sm font-medium text-stone-900 mb-1">Nenhuma foto ainda</h3>
          <p className="text-sm text-stone-500">
            Adicione fotos para guardar as memórias deste plano!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div 
              key={photo.id} 
              className="relative aspect-square rounded-2xl overflow-hidden group bg-stone-100 cursor-pointer"
              onClick={() => setPreviewPhoto(photo)}
            >
              <img 
                src={getImageUrl(photo.storage_path)} 
                alt="Memória" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <Maximize2 size={16} className="text-white absolute top-3 right-3" />
                <span className="text-[10px] font-medium text-white/90">
                  {format(new Date(photo.created_at), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="absolute top-4 right-4 flex gap-3">
            {user?.id === previewPhoto.user_id && (
              <button 
                onClick={() => handleDelete(previewPhoto)}
                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={() => setPreviewPhoto(null)}
              className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <X size={20} />
            </button>
          </div>
          
          <img 
            src={getImageUrl(previewPhoto.storage_path)} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          
          <div className="absolute bottom-6 text-center w-full text-white/70 text-sm font-medium">
            Adicionado em {format(new Date(previewPhoto.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </div>
        </div>
      )}

    </div>
  );
}
