import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  useTheme,
  Chip,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppContext } from '../contexts/AppContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiService, ApiUser } from '../services/apiService';
import { User, UserRole } from '../types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const churchIconSvg = `
<svg width="120" height="120" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wallGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E8E8E8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D0D0D0;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="roofGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#654321;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="towerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F5F5F5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E0E0E0;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Main church body -->
  <rect x="18" y="32" width="44" height="40" fill="url(#wallGradient)" stroke="#B0B0B0" stroke-width="1" rx="2"/>
  
  <!-- Main roof -->
  <polygon points="12,32 40,18 68,32" fill="url(#roofGradient)" stroke="#654321" stroke-width="1"/>
  
  <!-- Bell tower -->
  <rect x="33" y="12" width="14" height="28" fill="url(#towerGradient)" stroke="#B0B0B0" stroke-width="1" rx="1"/>
  
  <!-- Tower roof -->
  <polygon points="30,12 40,6 50,12" fill="url(#roofGradient)" stroke="#654321" stroke-width="1"/>
  
  <!-- Cross -->
  <rect x="39" y="2" width="2" height="8" fill="#FFD700" rx="1"/>
  <rect x="37" y="4" width="6" height="2" fill="#FFD700" rx="1"/>
  
  <!-- Main entrance door -->
  <path d="M 36 52 Q 36 48 40 48 Q 44 48 44 52 L 44 70 L 36 70 Z" fill="#8B4513" stroke="#654321" stroke-width="1"/>
  <circle cx="42" cy="61" r="1" fill="#FFD700"/>
  
  <!-- Windows -->
  <rect x="22" y="42" width="6" height="8" rx="3" fill="#4169E1" stroke="#2E4BC7" stroke-width="1"/>
  <rect x="52" y="42" width="6" height="8" rx="3" fill="#4169E1" stroke="#2E4BC7" stroke-width="1"/>
  <rect x="36" y="22" width="8" height="6" rx="3" fill="#4169E1" stroke="#2E4BC7" stroke-width="1"/>
  
  <!-- Window details -->
  <line x1="25" y1="42" x2="25" y2="50" stroke="#E8E8E8" stroke-width="0.5"/>
  <line x1="22" y1="46" x2="28" y2="46" stroke="#E8E8E8" stroke-width="0.5"/>
  <line x1="55" y1="42" x2="55" y2="50" stroke="#E8E8E8" stroke-width="0.5"/>
  <line x1="52" y1="46" x2="58" y2="46" stroke="#E8E8E8" stroke-width="0.5"/>
  <line x1="40" y1="22" x2="40" y2="28" stroke="#E8E8E8" stroke-width="0.5"/>
  <line x1="36" y1="25" x2="44" y2="25" stroke="#E8E8E8" stroke-width="0.5"/>
  
  <!-- Decorative elements -->
  <rect x="18" y="30" width="44" height="2" fill="#B0B0B0"/>
  <rect x="33" y="10" width="14" height="2" fill="#B0B0B0"/>
</svg>
`;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { dispatch } = useAppContext();
  const theme = useTheme();

  // Check API connection status on component mount and periodically
  useEffect(() => {
    checkApiConnection();
    
    // Check connection every 2 minutes to reduce UI flickering
    const interval = setInterval(checkApiConnection, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const checkApiConnection = async () => {
    try {
      const connectionStatus = await apiService.checkConnection();
      setIsOnline(connectionStatus);
    } catch (error) {
      setIsOnline(false);
    }
  };

  const handleLogin = async () => {
    console.log('=== INÍCIO DO PROCESSO DE LOGIN ===');
    
    if (!email.trim() || !password.trim()) {
      console.log('Campos vazios detectados');
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      console.log('1. Definindo loading como true');
      setLoading(true);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      console.log('2. Iniciando autenticação com email:', email.trim());
      const loginResult = await apiService.login(email.trim(), password);
      
      console.log('3. Resultado da autenticação:', loginResult ? 'Sucesso' : 'Falha');
      
      if (loginResult && loginResult.user) {
        console.log('4. Login bem-sucedido, usuário:', loginResult.user.email);
        
        const mappedUser: User = {
          id: loginResult.user.id,
          email: loginResult.user.email,
          name: loginResult.user.name,
          password: '',
          role: loginResult.user.role as UserRole,
          active: loginResult.user.active,
          createdAt: new Date(loginResult.user.createdAt),
          updatedAt: new Date(loginResult.user.updatedAt),
        };
        
        console.log('5. Atualizando estado do usuário...');
        // Atualizar o estado primeiro
        dispatch({ type: 'SET_USER', payload: mappedUser });
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        
        console.log('6. Aguardando antes de navegar...');
        // Aguardar um momento para garantir que o estado seja atualizado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('7. Tentando navegar para Main...');
        // Navegar para a tela principal usando requestAnimationFrame para evitar conflitos
        requestAnimationFrame(() => {
          try {
            console.log('8. Executando navigation.replace(Main)');
            navigation.replace('Main');
            console.log('9. Navegação executada com sucesso');
          } catch (navError) {
            console.error('ERRO NA NAVEGAÇÃO:', navError);
            // Se a navegação falhar, tentar novamente após um delay
            setTimeout(() => {
              try {
                console.log('10. Tentativa de navegação #2');
                navigation.replace('Main');
                console.log('11. Segunda tentativa de navegação bem-sucedida');
              } catch (retryError) {
                console.error('ERRO NA SEGUNDA TENTATIVA DE NAVEGAÇÃO:', retryError);
              }
            }, 100);
          }
        });
      } else {
        console.log('4. Login falhou - credenciais inválidas');
        Alert.alert(
          'Erro de Autenticação',
          'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
        );
      }
    } catch (error) {
      console.error('=== ERRO NO PROCESSO DE LOGIN ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      console.error('Stack trace:', (error as any)?.stack);
      
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? (error as any).message 
        : 'Ocorreu um erro durante o login. Tente novamente.';
      
      console.log('Mensagem de erro a ser exibida:', errorMessage);
      Alert.alert('Erro', errorMessage);
      dispatch({ type: 'SET_ERROR', payload: 'Erro durante o login' });
    } finally {
      console.log('=== FINALIZANDO PROCESSO DE LOGIN ===');
      setLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    
    console.log('=== FIM DO PROCESSO DE LOGIN ===');
  };



  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.header}>
                <View style={[styles.logoContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                  <SvgXml 
                    xml={churchIconSvg} 
                    width={120} 
                    height={120} 
                    style={styles.churchIcon}
                  />
                </View>
                <Title style={[styles.title, { color: theme.colors.primary }]}>
                  Auxiliadora Pay
                </Title>
                <Paragraph style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                  Sistema de Ponto de Venda Profissional
                </Paragraph>
                
                {/* Connection Status Indicator */}
                <View style={styles.connectionStatus}>
                  {isOnline === null ? (
                    <Chip 
                      icon="wifi-strength-outline" 
                      style={[styles.statusChip, { backgroundColor: '#f0f0f0' }]}
                      textStyle={{ color: '#666' }}
                    >
                      Verificando conexão...
                    </Chip>
                  ) : isOnline ? (
                    <Chip 
                      icon="wifi" 
                      style={[styles.statusChip, { backgroundColor: '#e8f5e8' }]}
                      textStyle={{ color: '#2e7d32' }}
                    >
                      Online
                    </Chip>
                  ) : (
                    <Chip 
                      icon="wifi-off" 
                      style={[styles.statusChip, { backgroundColor: '#ffebee' }]}
                      textStyle={{ color: '#c62828' }}
                    >
                      Offline
                    </Chip>
                  )}
                </View>

              </View>

              <View style={styles.form}>
                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  disabled={loading}
                />

                <TextInput
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                  disabled={loading}
                />

                <Button
                  mode="contained"
                  onPress={handleLogin}
                  style={styles.loginButton}
                  disabled={loading}
                  loading={loading}
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                
                {/* Forgot Password Link */}
                <TouchableRipple
                  style={styles.forgotPasswordContainer}
                  onPress={() => Alert.alert('Recuperação de Senha', 'Entre em contato com o administrador do sistema para recuperar sua senha.')}
                  borderless
                >
                  <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                    Esqueci minha senha
                  </Text>
                </TouchableRipple>
              </View>
              
              {/* Footer with version */}
              <View style={[styles.footer, { borderTopColor: theme.colors.outline }]}>
                <Text style={[styles.versionText, { color: theme.colors.onSurfaceVariant }]}>
                  Versão 2.0.0 - Auxiliadora Pay
                </Text>
              </View>
            </Card.Content>
          </Card>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    elevation: 12,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  churchIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  connectionStatus: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  statusChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  versionText: {
    fontSize: 12,
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});

export default LoginScreen;