import React from 'react';
import { Alert, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { createDrawerNavigator } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { IconButton, Menu, Divider, useTheme, Avatar } from 'react-native-paper';
import { useAppContext } from '../contexts/AppContext';
import { apiService } from '../services/apiService';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ProductScreen from '../screens/ProductScreen';
import CashRegisterScreen from '../screens/CashRegisterScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Checkout: undefined;
  Products: undefined;
  Users: undefined;
  CashRegister: undefined;
  Reports: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// CustomDrawerContent removed - drawer navigation no longer used

function UserMenu({ navigation }: { navigation: any }) {
  const [visible, setVisible] = React.useState(false);
  const { state, dispatch } = useAppContext();
  const { user } = state;

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair do sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.logout();
              dispatch({ type: 'SET_USER', payload: null });
              dispatch({ type: 'SET_AUTHENTICATED', payload: false });
              dispatch({ type: 'CLEAR_CART' });
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          },
        },
      ]
    );
    closeMenu();
  };

  const handleSwitchUser = () => {
    Alert.alert(
      'Trocar Usuário',
      'Deseja trocar para outro usuário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          onPress: async () => {
            try {
              await apiService.logout();
              dispatch({ type: 'SET_USER', payload: null });
              dispatch({ type: 'SET_AUTHENTICATED', payload: false });
              dispatch({ type: 'CLEAR_CART' });
              navigation.replace('Login');
            } catch (error) {
              console.error('Switch user error:', error);
              Alert.alert('Erro', 'Não foi possível trocar usuário');
            }
          },
        },
      ]
    );
    closeMenu();
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <IconButton
            icon="account-circle"
            iconColor="#fff"
            size={24}
            onPress={openMenu}
          />
        }
      >
        <Menu.Item
          onPress={() => {
            closeMenu();
            // Navigate to user profile or show user info
          }}
          title={`Olá, ${user?.name || 'Usuário'}`}
          leadingIcon="account"
        />
        <Divider />
        <Menu.Item
          onPress={handleSwitchUser}
          title="Trocar Usuário"
          leadingIcon="account-switch"
        />
        <Menu.Item
          onPress={handleLogout}
          title="Sair"
          leadingIcon="logout"
        />
      </Menu>
    </View>
  );
}

function MainStackNavigator() {
  const theme = useTheme();
  
  return (
    <MainStack.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ navigation }) => ({
        headerStyle: {
          backgroundColor: theme.colors.primary,
          elevation: 4,
          shadowOpacity: 0.1,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerLeft: undefined,
        headerRight: () => <UserMenu navigation={navigation} />,
      })}
    >
      <MainStack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Início' }}
      />
      <MainStack.Screen 
        name="Checkout" 
        component={CheckoutScreen} 
        options={{ title: 'Vendas' }}
      />
      <MainStack.Screen 
        name="CashRegister" 
        component={CashRegisterScreen} 
        options={{ title: 'Caixa' }}
      />
      <MainStack.Screen 
        name="Products" 
        component={ProductScreen} 
        options={{ title: 'Produtos' }}
      />
      <MainStack.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{ title: 'Relatórios' }}
      />
      <MainStack.Screen 
        name="Users" 
        component={UserManagementScreen} 
        options={{ title: 'Usuários' }}
      />
      <MainStack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Configurações' }}
      />
    </MainStack.Navigator>
  );
}

// Drawer navigator removed - using stack navigation only

export default function AppNavigator() {
  const { state } = useAppContext();
  
  // Show loading screen while initializing
  if (state.isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Carregando...</Text>
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={state.isAuthenticated ? "Main" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainStackNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}