import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { configureFonts } from 'react-native-paper';

import { Platform } from 'react-native';

// Configuração de fontes para MD3
const fontConfig = {
  bodyLarge: {
    fontFamily: Platform.select({
      web: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
      ios: 'Inter',
      default: 'Roboto',
    }),
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: Platform.select({
      web: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
      ios: 'Inter',
      default: 'Roboto',
    }),
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  titleLarge: {
    fontFamily: Platform.select({
      web: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
      ios: 'Inter',
      default: 'Roboto',
    }),
    fontSize: 22,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
};

// Paleta de cores personalizada
const colors = {
  // Cores primárias (azul/verde)
  primary: '#2E7D32', // Verde confiança
  primaryContainer: '#A5D6A7',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#1B5E20',
  
  // Cores secundárias (cinza)
  secondary: '#6B7280', // Cinza neutro
  secondaryContainer: '#F3F4F6',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#374151',
  
  // Cores terciárias (azul)
  tertiary: '#1976D2', // Azul inovação
  tertiaryContainer: '#BBDEFB',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#0D47A1',
  
  // Cores de ação (laranja/roxo)
  accent: '#FF6B35', // Laranja chamativo
  accentSecondary: '#7C3AED', // Roxo ação
  
  // Cores de erro
  error: '#DC2626',
  errorContainer: '#FEE2E2',
  onError: '#FFFFFF',
  onErrorContainer: '#7F1D1D',
  
  // Cores de sucesso
  success: '#059669',
  successContainer: '#D1FAE5',
  onSuccess: '#FFFFFF',
  onSuccessContainer: '#064E3B',
  
  // Cores de aviso
  warning: '#D97706',
  warningContainer: '#FEF3C7',
  onWarning: '#FFFFFF',
  onWarningContainer: '#92400E',
  
  // Cores de superfície
  surface: '#FFFFFF',
  surfaceVariant: '#F8FAFC',
  surfaceDisabled: '#F1F5F9',
  onSurface: '#1F2937',
  onSurfaceVariant: '#6B7280',
  onSurfaceDisabled: '#9CA3AF',
  
  // Cores de fundo
  background: '#FAFAFA',
  onBackground: '#1F2937',
  
  // Cores de contorno
  outline: '#D1D5DB',
  outlineVariant: '#E5E7EB',
  
  // Cores de sombra
  shadow: '#000000',
  scrim: '#000000',
  
  // Cores inversas
  inverseSurface: '#1F2937',
  inverseOnSurface: '#F9FAFB',
  inversePrimary: '#81C784',
};

// Tema claro personalizado
export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    ...colors,
  },
  roundness: 12, // Bordas arredondadas
};

// Tema escuro personalizado
export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    // Cores primárias (azul/verde) - versão escura
    primary: '#4CAF50', // Verde mais claro para contraste
    primaryContainer: '#2E7D32',
    onPrimary: '#000000',
    onPrimaryContainer: '#C8E6C9',
    
    // Cores secundárias (cinza) - versão escura
    secondary: '#9CA3AF',
    secondaryContainer: '#374151',
    onSecondary: '#000000',
    onSecondaryContainer: '#F3F4F6',
    
    // Cores terciárias (azul) - versão escura
    tertiary: '#42A5F5',
    tertiaryContainer: '#1565C0',
    onTertiary: '#000000',
    onTertiaryContainer: '#E3F2FD',
    
    // Cores de ação (laranja/roxo) - versão escura
    accent: '#FF8A65',
    accentSecondary: '#9C88FF',
    
    // Cores de superfície - versão escura
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    surfaceDisabled: '#2C2C2C',
    onSurface: '#E0E0E0',
    onSurfaceVariant: '#BDBDBD',
    onSurfaceDisabled: '#757575',
    
    // Cores de fundo - versão escura
    background: '#0F0F0F',
    onBackground: '#E0E0E0',
    
    // Cores de contorno - versão escura
    outline: '#424242',
    outlineVariant: '#616161',
    
    // Cores inversas - versão escura
    inverseSurface: '#E0E0E0',
    inverseOnSurface: '#121212',
    inversePrimary: '#2E7D32',
  },
  roundness: 12,
};

// Estilos comuns para componentes
export const commonStyles = {
  card: {
    elevation: 2,
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  fab: {
    borderRadius: 16,
  },
  chip: {
    borderRadius: 20,
  },
  textInput: {
    borderRadius: 8,
  },
};

// Cores específicas para diferentes contextos
export const contextColors = {
  // Cores para status de caixa
  cashRegister: {
    open: colors.success,
    closed: colors.error,
    pending: colors.warning,
  },
  
  // Cores para métodos de pagamento
  paymentMethods: {
    cash: '#4CAF50',
    card: '#2196F3',
    pix: '#FF9800',
    credit: '#9C27B0',
    debit: '#607D8B',
  },
  
  // Cores para níveis de usuário
  userRoles: {
    admin: '#F44336',
    manager: '#FF9800',
    cashier: '#4CAF50',
    operator: '#2196F3',
  },
  
  // Cores para status de produtos
  productStatus: {
    available: colors.success,
    outOfStock: colors.error,
    lowStock: colors.warning,
  },
};

export default lightTheme;