import { memo, useEffect, useState } from 'react';
import { Clock, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSession {
  id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

const ChatHistory = memo(({ onSelectSession, currentSessionId }: ChatHistoryProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadSessions, deleteSession } = useChatPersistence();

  const fetchSessions = async () => {
    setLoading(true);
    const loadedSessions = await loadSessions();
    setSessions(loadedSessions);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const success = await deleteSession(sessionId);
    if (success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageSquare className="h-12 w-12 text-blue-400/50 mb-4" />
        <p className="text-sm text-blue-200">
          Nenhuma conversa salva ainda
        </p>
        <p className="text-xs text-blue-300/70 mt-2">
          Suas conversas salvas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2 p-4">
        <AnimatePresence>
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                  currentSessionId === session.id
                    ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border border-blue-400/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate mb-1">
                      {session.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-blue-200/70">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(session.updated_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(session.id, e)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

ChatHistory.displayName = 'ChatHistory';

export default ChatHistory;
