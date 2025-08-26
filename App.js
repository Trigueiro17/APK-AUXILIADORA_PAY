import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Provider as PaperProvider, Button, Card } from 'react-native-paper';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AppProvider } from './src/contexts/AppContext';
import { SettingsProvider, useSettings } from './src/contexts/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme, darkTheme } from './src/theme/theme';

// ErrorBoundary para capturar erros JavaScript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Mostrar alerta com detalhes do erro
    Alert.alert(
      'Erro na Aplicação',
      `Erro: ${error.message}\n\nStack: ${error.stack}`,
      [
        { text: 'Reiniciar', onPress: () => this.setState({ hasError: false, error: null, errorInfo: null }) },
        { text: 'OK' }
      ]
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <Card>
            <Card.Content>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Algo deu errado!</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Text>
              </ScrollView>
              <Button 
                mode="contained" 
                onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                style={{ marginTop: 20 }}
              >
                Tentar Novamente
              </Button>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}


export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Reduzir tempo de inicialização para evitar flickering
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Remover tela de loading para evitar flickering desnecessário
  // O SafeAreaProvider é inicializado rapidamente
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppProvider>
        <SettingsProvider>
          <ThemedApp />
        </SettingsProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { settings } = useSettings();
  const theme = settings.darkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <ErrorBoundary>
        <StatusBar style={settings.darkMode ? "light" : "dark"} />
        <AppNavigator />
      </ErrorBoundary>
    </PaperProvider>
  );
}
