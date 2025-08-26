import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  IconButton,
  Searchbar,
  Portal,
  Modal,
  TextInput,
  RadioButton,
  ActivityIndicator,
  useTheme,
  Surface,
  Text,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../contexts/AppContext';
import { User, UserRole, CreateUserData } from '../types';

const UserManagementScreen: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER,
  });

  const { state, loadUsers: contextLoadUsers, createUser, updateUser, deleteUser } = useAppContext();
  const { users, loading: contextLoading } = state;

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      await contextLoadUsers();
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Erro', 'Não foi possível carregar os usuários');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: UserRole.USER,
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: UserRole.EMPLOYEE,
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Erro', 'Senha é obrigatória para novos usuários');
      return;
    }

    try {
      setLoading(true);
      
      if (editingUser) {
        // Update user
        const updateData: Partial<CreateUserData> = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
        };
        
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }
        
        await updateUser(editingUser.id, updateData);
        Alert.alert('Sucesso', 'Usuário atualizado com sucesso');
      } else {
        // Create new user
        const newUserData: CreateUserData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        };
        
        await createUser(newUserData);
        Alert.alert('Sucesso', 'Usuário criado com sucesso');
      }
      
      closeModal();
    } catch (error: any) {
      console.error('Error saving user:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar o usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o usuário "${user.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              Alert.alert('Sucesso', 'Usuário excluído com sucesso');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Erro', 'Não foi possível excluir o usuário');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return theme.colors.error;
      case UserRole.USER:
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.USER:
        return 'Usuário';
      default:
        return role;
    }
  };

  const renderUser = ({ item: user }: { item: User }) => (
    <Surface style={[styles.userCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <View style={{ padding: 16 }}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={[styles.userName, { color: theme.colors.onSurface }]}>{user.name}</Text>
            <Text variant="bodyMedium" style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>{user.email}</Text>
          </View>
          <View style={styles.userActions}>
            <Chip
              style={[styles.roleChip, { backgroundColor: getRoleColor(user.role) }]}
              textStyle={[styles.roleChipText, { color: theme.colors.onPrimary }]}
            >
              {getRoleLabel(user.role)}
            </Chip>
          </View>
        </View>
        
        <View style={styles.userFooter}>
          <Text variant="bodySmall" style={[styles.userDate, { color: theme.colors.onSurfaceVariant }]}>
            Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
          </Text>
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => openModal(user)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDelete(user)}
            />
          </View>
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Buscar usuários..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>Nenhum usuário encontrado</Text>
            </View>
          }
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={() => openModal()}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={closeModal}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </Text>

          <TextInput
            label="Nome"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            label={editingUser ? 'Nova Senha (opcional)' : 'Senha'}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.roleContainer}>
            <Text variant="bodyLarge" style={[styles.roleLabel, { color: theme.colors.onSurface }]}>Função:</Text>
            <RadioButton.Group
              onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              value={formData.role}
            >
              <View style={styles.radioOption}>
                <RadioButton value={UserRole.USER} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Usuário</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value={UserRole.ADMIN} />
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>Administrador</Text>
              </View>
            </RadioButton.Group>
          </View>

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={closeModal} 
              style={styles.modalButton}
              textColor={theme.colors.primary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.modalButton}
              loading={contextLoading}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              {editingUser ? 'Atualizar' : 'Criar'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  userCard: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    marginBottom: 4,
  },
  userEmail: {
  },
  userActions: {
    alignItems: 'flex-end',
  },
  roleChip: {
    marginLeft: 8,
  },
  roleChipText: {
    color: 'white',
    fontSize: 12,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  userDate: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default UserManagementScreen;