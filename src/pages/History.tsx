import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../contexts/CoupleContext';
import { Plan, PlanPhoto } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star, Image as ImageIcon, MessageCircle, MapPin, Calendar, Heart, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

// Extend Plan to include photos from subquery
interface HistoryPlan extends Plan {
  plan_photos?: PlanPhoto[];
}

export function History() {
  const { couple, members } = useCouple();
  const [memories, setMemories] = useState<HistoryPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemories() {
      if (!couple) return;
      
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          plan_photos (
            id, storage_path
          )
        `)
        .eq('couple_id', couple.id)
        .eq('status', 'fizemos')
        .order('completed_at', { ascending: false });
        
      if (!error && data) {
        setMemories(data as HistoryPlan[]);
      }
      setLoading(false);
    }
    
    fetchMemories();
  }, [couple]);

  const getMemberName = (id: string) => {
    return members[id]?.name || 'Alguém';
  };

  const getMemberAvatar = (id: string) => {
    return members[id]?.avatar_url;
  };

  const getPublicUrl = (path: string) => {
    return supabase.storage.from('memories').getPublicUrl(path).data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24 max-w-3xl mx-auto"
    >
      <header className="pt-8 text-center space-y-2">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="fill-emerald-500 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Nossas Memórias
        </h1>
        <p className="text-stone-500">
          A coleção das histórias e experiências que vivemos juntos.
        </p>
      </header>

      {memories.length === 0 ? (
        <EmptyState
          icon={<Award size={48} />}
          title="Ainda não há memórias"
          description="Quando vocês concluírem um plano, ele aparecerá aqui no diário de vocês."
          action={<Link to="/plans" className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-colors">Ver nossos planos</Link>}
        />
      ) : (
        <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-stone-200 before:to-transparent">
          {memories.map((memory, idx) => {
            const completedDate = memory.completed_at ? new Date(memory.completed_at) : new Date(memory.updated_at);
            const authorName = getMemberName(memory.created_by_id);
            const authorAvatar = getMemberAvatar(memory.created_by_id);
            const hasPhotos = memory.plan_photos && memory.plan_photos.length > 0;
            const coverPhoto = hasPhotos ? memory.plan_photos![0].storage_path : null;

            return (
              <motion.div 
                key={memory.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8 md:mb-12"
              >
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                  <Heart size={16} className="fill-emerald-500 text-emerald-500" />
                </div>
                
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border border-stone-200/60 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                  {coverPhoto && (
                    <div className="w-full h-48 md:h-56 bg-stone-100 relative overflow-hidden group-hover:opacity-95 transition-opacity">
                      <img loading="lazy" decoding="async" src={getPublicUrl(coverPhoto)} 
                        alt="Memória" 
                        className="w-full h-full object-cover"
                      />
                      {memory.plan_photos!.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                          <ImageIcon size={12} />
                          +{memory.plan_photos!.length - 1}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-stone-100 text-stone-600 rounded-lg text-[10px] font-semibold uppercase tracking-wider mb-2">
                          {memory.category}
                        </span>
                        <h3 className="text-xl font-medium text-stone-900 leading-tight">
                          <Link to={`/plans/${memory.id}`} className="hover:text-emerald-600 transition-colors">
                            {memory.title}
                          </Link>
                        </h3>
                      </div>
                      {memory.rating && (
                        <div className="flex items-center gap-0.5 shrink-0 bg-orange-50 px-2 py-1 rounded-full">
                          <Star size={14} className="fill-orange-400 text-orange-400" />
                          <span className="text-xs font-bold text-orange-700 ml-1">{memory.rating}</span>
                        </div>
                      )}
                    </div>

                    {memory.evaluation && (
                      <div className="mt-3 mb-4 bg-stone-50 rounded-2xl p-4 text-stone-600 text-sm relative">
                        <MessageCircle size={16} className="text-stone-300 absolute top-4 left-4" />
                        <p className="pl-6 italic">"{memory.evaluation}"</p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {format(completedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <span className="hidden sm:inline">Criado por:</span>
                        <div className="flex items-center gap-1.5 bg-stone-50 pl-2 pr-3 py-1 rounded-full">
                          {authorAvatar ? (
                            <img loading="lazy" decoding="async" src={authorAvatar} alt={authorName} className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold">
                              {authorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-stone-700">{authorName.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
