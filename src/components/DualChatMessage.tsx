/**
 * Componente para renderizar mensagens do chat dual
 */

import { memo } from 'react';
import { DualMessage } from '@/types/dualChat';
import ChatMessage from '@/components/ChatMessage';
import { motion } from 'framer-motion';
import { Check, Clock } from '@/utils/iconMapper';
import { AdvancedSentimentAnalysis } from '@/types/sentimentAnalysis';

interface DualChatMessageProps {
  message: DualMessage;
  side: 'locador' | 'locatario';
}

const DualChatMessage = memo(
  ({ message, side }: DualChatMessageProps) => {
    const responseMessage =
      side === 'locador' ? message.locadorResponse : message.locatarioResponse;

    const sentimentData =
      side === 'locador'
        ? message.locadorSentiment
        : message.locatarioSentiment;

    // Função para obter ícone e cor do sentimento
    const getSentimentIndicator = (sentiment?: AdvancedSentimentAnalysis) => {
      if (!sentiment) return null;

      const indicators = {
        frustrated: {
          icon: '😟',
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          label: 'Frustrado',
        },
        concerned: {
          icon: '😰',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          label: 'Preocupado',
        },
        urgent: {
          icon: '⚡',
          color: 'text-red-600',
          bg: 'bg-red-50',
          label: 'Urgente',
        },
        satisfied: {
          icon: '👍',
          color: 'text-green-600',
          bg: 'bg-green-50',
          label: 'Satisfeito',
        },
        confused: {
          icon: '🤔',
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          label: 'Confuso',
        },
        assertive: {
          icon: '💪',
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          label: 'Assertivo',
        },
        neutral: {
          icon: '😐',
          color: 'text-slate-600',
          bg: 'bg-slate-50',
          label: 'Neutro',
        },
      };

      return indicators[sentiment.emotion] || indicators.neutral;
    };

    const sentimentIndicator = getSentimentIndicator(sentimentData);

    const sideConfig = {
      locador: {
        title: 'Locador',
        subtitle: 'Proprietário',
        bgColor: 'bg-white',
        borderColor: 'border-slate-200/60',
        textColor: 'text-slate-900',
        icon: 'L',
        iconBg: 'bg-slate-100',
        accentColor: 'text-slate-600',
        accentBg: 'bg-slate-50',
      },
      locatario: {
        title: 'Locatário',
        subtitle: 'Inquilino',
        bgColor: 'bg-white',
        borderColor: 'border-slate-200/60',
        textColor: 'text-slate-900',
        icon: 'T',
        iconBg: 'bg-slate-100',
        accentColor: 'text-slate-600',
        accentBg: 'bg-slate-50',
      },
    };

    const config = sideConfig[side];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${config.bgColor} ${config.borderColor} border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}
      >
        {/* Header da mensagem profissional */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 ${config.iconBg} rounded-lg flex items-center justify-center border border-slate-200`}
            >
              <span className="text-slate-600 text-xs font-semibold">
                {config.icon}
              </span>
            </div>
            <div>
              <h3 className={`font-semibold ${config.textColor} text-sm`}>
                {config.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {config.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Indicador de sentimento */}
            {sentimentIndicator && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full ${sentimentIndicator.bg} ${sentimentIndicator.color} text-xs font-medium`}
                title={`Sentimento detectado: ${sentimentIndicator.label} (${Math.round((sentimentData?.confidence || 0) * 100)}% confiança)`}
              >
                <span className="text-sm">{sentimentIndicator.icon}</span>
                <span className="hidden sm:inline">
                  {sentimentIndicator.label}
                </span>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">
                {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Mensagem original (se for do lado que enviou) */}
        {message.detectedSender === side && (
          <div className="mb-4 p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 bg-slate-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">💬</span>
              </div>
              <span className="text-sm font-medium text-slate-600">
                Mensagem original
              </span>
            </div>
            <div className="text-sm text-slate-700 leading-relaxed">
              {message.originalMessage}
            </div>

            {/* Imagem original do WhatsApp */}
            {message.originalImage && (
              <div className="mt-3">
                <img
                  src={message.originalImage.url}
                  alt="Mensagem do WhatsApp"
                  className="max-w-xs rounded-lg border border-slate-200 shadow-sm"
                />
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-slate-500">📷</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Imagem do WhatsApp analisada
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resposta gerada */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/60 p-4">
            <ChatMessage
              message={responseMessage}
              onRetry={() => {}} // Implementar retry se necessário
              onCopy={() => {}} // Implementar copy se necessário
            />
          </div>
        </div>

        {/* Indicador de detecção */}
        {message.detectedSender === side && (
          <div className="mt-4 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200/60">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-medium text-green-700">
                Detectado automaticamente como {side}
              </span>
            </div>

            {/* Indicador de confiança da detecção */}
            {message.detectionConfidence && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-8 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${message.detectionConfidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium">
                  {Math.round(message.detectionConfidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

DualChatMessage.displayName = 'DualChatMessage';

export default DualChatMessage;
