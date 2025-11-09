/**
 * NotificationService - Serviço para envio de notificações
 * Implementa padrões de notificação para diferentes canais
 */

import { Contract, ContractFormData } from '@/types/domain/contract';
import { ContractTerminationData } from '@/services/contracts/contract-service.interface';

export interface NotificationConfig {
  email: {
    enabled: boolean;
    template?: string;
  };
  sms: {
    enabled: boolean;
    provider?: string;
  };
  push: {
    enabled: boolean;
    vapidKey?: string;
  };
  webhook: {
    enabled: boolean;
    url?: string;
    headers?: Record<string, string>;
  };
}

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  channels?: ('email' | 'sms' | 'push' | 'webhook')[];
}

export interface NotificationResult {
  success: boolean;
  sent: Record<string, boolean>;
  errors: Record<string, string>;
  timestamp: string;
}

export class NotificationService {
  private config: NotificationConfig;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      email: { enabled: true },
      sms: { enabled: false },
      push: { enabled: false },
      webhook: { enabled: false },
      ...config
    };
  }

  /**
   * Notifica criação de contrato
   */
  async notifyContractCreated(contract: Contract): Promise<NotificationResult> {
    const notification: NotificationData = {
      type: 'contract.created',
      title: 'Novo Contrato Criado',
      message: `Contrato ${contract.form_data.numeroContrato} foi criado com sucesso.`,
      data: {
        contractId: contract.id,
        contractNumber: contract.form_data.numeroContrato,
        clientName: contract.form_data.nomeLocatario,
        propertyAddress: contract.form_data.enderecoImovel
      },
      priority: 'medium',
      channels: ['email', 'webhook']
    };

    return this.send(notification);
  }

  /**
   * Notifica renovação de contrato
   */
  async notifyContractRenewed(contract: Contract): Promise<NotificationResult> {
    const notification: NotificationData = {
      type: 'contract.renewed',
      title: 'Contrato Renovado',
      message: `Contrato ${contract.form_data.numeroContrato} foi renovado com sucesso.`,
      data: {
        contractId: contract.id,
        contractNumber: contract.form_data.numeroContrato,
        clientName: contract.form_data.nomeLocatario,
        propertyAddress: contract.form_data.enderecoImovel,
        newEndDate: contract.form_data.dataTerminoRescisao
      },
      priority: 'medium',
      channels: ['email', 'webhook']
    };

    return this.send(notification);
  }

  /**
   * Notifica terminação de contrato
   */
  async notifyContractTerminated(contract: Contract, terminationData: ContractTerminationData): Promise<NotificationResult> {
    const notification: NotificationData = {
      type: 'contract.terminated',
      title: 'Contrato Terminado',
      message: `Contrato ${contract.form_data.numeroContrato} foi terminado: ${terminationData.reason}`,
      data: {
        contractId: contract.id,
        contractNumber: contract.form_data.numeroContrato,
        clientName: contract.form_data.nomeLocatario,
        propertyAddress: contract.form_data.enderecoImovel,
        terminationDate: terminationData.terminationDate,
        terminationReason: terminationData.reason,
        terminationType: terminationData.terminationType
      },
      priority: 'high',
      channels: ['email', 'webhook', 'sms']
    };

    return this.send(notification);
  }

  /**
   * Notifica contrato próximo ao vencimento
   */
  async notifyContractExpiring(contract: Contract, daysUntilExpiry: number): Promise<NotificationResult> {
    const notification: NotificationData = {
      type: 'contract.expiring',
      title: 'Contrato Próximo ao Vencimento',
      message: `Contrato ${contract.form_data.numeroContrato} vence em ${daysUntilExpiry} dia(s).`,
      data: {
        contractId: contract.id,
        contractNumber: contract.form_data.numeroContrato,
        clientName: contract.form_data.nomeLocatario,
        propertyAddress: contract.form_data.enderecoImovel,
        endDate: contract.form_data.dataTerminoRescisao,
        daysUntilExpiry
      },
      priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
      channels: ['email', 'webhook']
    };

    return this.send(notification);
  }

  /**
   * Notifica documento gerado
   */
  async notifyDocumentGenerated(contract: Contract, documentType: string): Promise<NotificationResult> {
    const notification: NotificationData = {
      type: 'document.generated',
      title: 'Documento Gerado',
      message: `Documento ${documentType} foi gerado para o contrato ${contract.form_data.numeroContrato}.`,
      data: {
        contractId: contract.id,
        contractNumber: contract.form_data.numeroContrato,
        documentType,
        clientName: contract.form_data.nomeLocatario
      },
      priority: 'low',
      channels: ['email']
    };

    return this.send(notification);
  }

  /**
   * Notifica erro no sistema
   */
  async notifyError(error: Error, context: Record<string, unknown> = {}): Promise<NotificationResult> {
    const notification: NotificationData = {
      type: 'system.error',
      title: 'Erro no Sistema',
      message: `Erro: ${error.message}`,
      data: {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      },
      priority: 'critical',
      channels: ['email', 'webhook']
    };

    return this.send(notification);
  }

  /**
   * Envia notificação customizada
   */
  async sendCustom(notification: NotificationData): Promise<NotificationResult> {
    return this.send(notification);
  }

  /**
   * Método principal de envio
   */
  private async send(notification: NotificationData): Promise<NotificationResult> {
    const channels = notification.channels || ['email'];
    const sent: Record<string, boolean> = {};
    const errors: Record<string, string> = {};
    const timestamp = new Date().toISOString();

    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            if (this.config.email.enabled) {
              sent.email = await this.sendEmail(notification);
            }
            break;
          case 'sms':
            if (this.config.sms.enabled) {
              sent.sms = await this.sendSms(notification);
            }
            break;
          case 'push':
            if (this.config.push.enabled) {
              sent.push = await this.sendPush(notification);
            }
            break;
          case 'webhook':
            if (this.config.webhook.enabled) {
              sent.webhook = await this.sendWebhook(notification);
            }
            break;
        }
      } catch (error) {
        errors[channel] = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return {
      success: Object.keys(errors).length === 0,
      sent,
      errors,
      timestamp
    };
  }

  /**
   * Envia email
   */
  private async sendEmail(notification: NotificationData): Promise<boolean> {
    const emailData = {
      to: this.getRecipients(notification),
      subject: notification.title,
      html: this.generateEmailTemplate(notification),
      data: notification.data
    };

    // Implementar envio de email
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    return response.ok;
  }

  /**
   * Envia SMS
   */
  private async sendSms(notification: NotificationData): Promise<boolean> {
    const smsData = {
      to: this.getPhoneRecipients(notification),
      message: `${notification.title}: ${notification.message}`,
      data: notification.data
    };

    // Implementar envio de SMS
    const response = await fetch('/api/notifications/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(smsData),
    });

    return response.ok;
  }

  /**
   * Envia push notification
   */
  private async sendPush(notification: NotificationData): Promise<boolean> {
    const pushData = {
      title: notification.title,
      body: notification.message,
      data: notification.data,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png'
    };

    // Implementar envio de push notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notification.title, pushData);
      return true;
    }

    return false;
  }

  /**
   * Envia webhook
   */
  private async sendWebhook(notification: NotificationData): Promise<boolean> {
    if (!this.config.webhook.url) {
      return false;
    }

    const webhookData = {
      ...notification,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(this.config.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.webhook.headers
      },
      body: JSON.stringify(webhookData),
    });

    return response.ok;
  }

  /**
   * Gera template de email
   */
  private generateEmailTemplate(notification: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; }
            .data-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .data-table th, .data-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .data-table th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content">
            <p>${notification.message}</p>
            ${this.generateDataTable(notification.data)}
          </div>
          <div class="footer">
            <p>Este é um email automático do sistema de contratos.</p>
            <p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Gera tabela de dados para email
   */
  private generateDataTable(data?: Record<string, unknown>): string {
    if (!data) return '';

    const rows = Object.entries(data)
      .filter(([key, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `
        <tr>
          <td><strong>${this.formatKey(key)}</strong></td>
          <td>${this.formatValue(value)}</td>
        </tr>
      `).join('');

    return `
      <h3>Detalhes:</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Campo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  /**
   * Formata chave para display
   */
  private formatKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Formata valor para display
   */
  private formatValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    if (value instanceof Date) {
      return value.toLocaleString('pt-BR');
    }
    return JSON.stringify(value);
  }

  /**
   * Obtém destinatários de email
   */
  private getRecipients(notification: NotificationData): string[] {
    // Implementar lógica para obter destinatários baseado no notification.data
    const recipients: string[] = [];

    if (notification.data?.clientEmail) {
      recipients.push(notification.data.clientEmail as string);
    }

    // Adicionar outros destinatários (admin, etc.)
    recipients.push('admin@empresa.com');

    return recipients;
  }

  /**
   * Obtém destinatários de SMS
   */
  private getPhoneRecipients(notification: NotificationData): string[] {
    const recipients: string[] = [];

    if (notification.data?.clientPhone) {
      recipients.push(notification.data.clientPhone as string);
    }

    return recipients;
  }

  /**
   * Configura service
   */
  configure(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): NotificationConfig {
    return { ...this.config };
  }
}