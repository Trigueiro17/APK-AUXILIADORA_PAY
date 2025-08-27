/**
 * Funções de formatação para o sistema Auxiliadora Pay
 */

/**
 * Formatar valores monetários em Real brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatar números com separadores de milhares
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formatar porcentagem
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formatar data e hora
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  };
  
  return new Intl.DateTimeFormat('pt-BR', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Formatar apenas data (sem hora)
 */
export function formatDateOnly(date: Date | string): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formatar apenas hora
 */
export function formatTimeOnly(date: Date | string): string {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formatar tempo relativo (ex: "há 2 minutos")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'agora mesmo';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `há ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `há ${diffInYears} ano${diffInYears > 1 ? 's' : ''}`;
}

/**
 * Formatar duração em milissegundos para formato legível
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  if (seconds > 0) {
    return `${seconds}s`;
  }
  
  return `${milliseconds}ms`;
}

/**
 * Formatar tamanho de arquivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formatar CPF
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formatar CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formatar telefone brasileiro
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Formatar CEP
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Formatar status de pagamento
 */
export function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    CASH: 'Dinheiro',
    CARD: 'Cartão',
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
  };
  
  return methods[method] || method;
}

/**
 * Formatar status de venda
 */
export function formatSaleStatus(status: string): string {
  const statuses: Record<string, string> = {
    PENDING: 'Pendente',
    COMPLETED: 'Concluída',
    CANCELLED: 'Cancelada',
    REFUNDED: 'Reembolsada',
  };
  
  return statuses[status] || status;
}

/**
 * Formatar status de caixa
 */
export function formatCashRegisterStatus(status: string): string {
  const statuses: Record<string, string> = {
    OPEN: 'Aberto',
    CLOSED: 'Fechado',
  };
  
  return statuses[status] || status;
}

/**
 * Formatar role de usuário
 */
export function formatUserRole(role: string): string {
  const roles: Record<string, string> = {
    USER: 'Usuário',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    CASHIER: 'Operador de Caixa',
  };
  
  return roles[role] || role;
}

/**
 * Formatar texto para slug (URL amigável)
 */
export function formatSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
}

/**
 * Formatar texto para título (primeira letra maiúscula)
 */
export function formatTitle(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formatar texto para iniciais
 */
export function formatInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Mascarar dados sensíveis
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);
  
  return masked + visible;
}

/**
 * Formatar código de erro
 */
export function formatErrorCode(code: string): string {
  return `ERR-${code.toUpperCase()}`;
}

/**
 * Formatar ID de transação
 */
export function formatTransactionId(id: string): string {
  return `TXN-${id.toUpperCase()}`;
}