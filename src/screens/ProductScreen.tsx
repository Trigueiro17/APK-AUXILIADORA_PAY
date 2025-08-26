import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  IconButton,
  Searchbar,
  Portal,
  Modal,
  TextInput,
  ActivityIndicator,
  useTheme,
  Surface,
  Text,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../contexts/AppContext';
import { Product, CreateProductData } from '../types';

const ProductScreen: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUri: '',
  });

  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  const { state, loadProducts, createProduct, updateProduct, deleteProduct } = useAppContext();
  const { products } = state;

  useFocusEffect(
    useCallback(() => {
      handleLoadProducts();
    }, [])
  );

  const handleLoadProducts = async () => {
    try {
      setLoading(true);
      await loadProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await handleLoadProducts();
    setRefreshing(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        imageUri: product.imageUri || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        imageUri: '',
      });
    }
    setModalVisible(true);
  };

  const pickImageFromGallery = async () => {
    try {
      setImagePickerLoading(true);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Negada', 'É necessário permitir acesso à galeria para selecionar imagens.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setImagePickerLoading(true);
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permissão Negada', 'É necessário permitir acesso à câmera para tirar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({ ...formData, imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageUri: '' });
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      imageUri: '',
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erro', 'Nome do produto é obrigatório');
      return;
    }

    if (!formData.price.trim() || isNaN(Number(formData.price))) {
      Alert.alert('Erro', 'Preço deve ser um número válido');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
      };
      
      if (editingProduct) {
        // Update product
        await updateProduct(editingProduct.id, productData);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso');
      } else {
        // Create new product
        await createProduct(productData);
        Alert.alert('Sucesso', 'Produto criado com sucesso');
      }
      
      closeModal();
    } catch (error: any) {
      console.error('Error saving product:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar o produto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o produto "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              Alert.alert('Sucesso', 'Produto excluído com sucesso');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Erro', 'Não foi possível excluir o produto');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };



  const renderProduct = ({ item: product }: { item: Product }) => (
    <Surface style={[styles.productCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Title style={[styles.productName, { color: theme.colors.onSurface }]}>{product.name}</Title>
            {product.description && (
              <Text style={[styles.productDescription, { color: theme.colors.onSurfaceVariant }]}>
                {product.description}
              </Text>
            )}
            <View style={styles.productDetails}>
              <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
                {formatPrice(product.price)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <View style={styles.productInfo}>
            {product.imageUri && (
              <Text style={[styles.imageInfo, { color: theme.colors.onSurfaceVariant }]}>Imagem: Sim</Text>
            )}
          </View>
          <View style={styles.actionButtons}>
            <IconButton
              icon="pencil"
              size={20}
              iconColor={theme.colors.primary}
              onPress={() => openModal(product)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDelete(product)}
            />
          </View>
        </View>
      </Card.Content>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Buscar produtos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
        iconColor={theme.colors.onSurfaceVariant}
        inputStyle={{ color: theme.colors.onSurface }}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Nenhum produto encontrado</Text>
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
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </Title>

          <TextInput
            label="Nome *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            mode="outlined"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <TextInput
            label="Descrição"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <TextInput
            label="Preço *"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <View style={styles.imageSection}>
            <Title style={[styles.imageSectionTitle, { color: theme.colors.onSurface }]}>Imagem do Produto</Title>
            
            {formData.imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: formData.imageUri }} style={styles.imagePreview} />
                <Button
                  mode="outlined"
                  onPress={removeImage}
                  style={styles.removeImageButton}
                  icon="delete"
                  compact
                  buttonColor={theme.colors.surface}
                  textColor={theme.colors.error}
                >
                  Remover
                </Button>
              </View>
            ) : (
              <View style={[styles.noImageContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.noImageText, { color: theme.colors.onSurfaceVariant }]}>Nenhuma imagem selecionada</Text>
              </View>
            )}
            
            <View style={styles.imageButtonsContainer}>
              <Button
                mode="contained"
                onPress={pickImageFromGallery}
                style={styles.imageButton}
                icon="image"
                loading={imagePickerLoading}
                disabled={imagePickerLoading}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
              >
                Galeria
              </Button>
              
              <Button
                mode="contained"
                onPress={takePhoto}
                style={styles.imageButton}
                icon="camera"
                loading={imagePickerLoading}
                disabled={imagePickerLoading}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
              >
                Câmera
              </Button>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={closeModal} 
              style={styles.modalButton}
              buttonColor={theme.colors.surface}
              textColor={theme.colors.primary}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.modalButton}
              loading={loading}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              {editingProduct ? 'Atualizar' : 'Criar'}
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
  productCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  productHeader: {
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    marginBottom: 4,
  },
  productDescription: {
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },

  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  imageInfo: {
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
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageSectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    marginTop: 4,
  },
  noImageContainer: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  noImageText: {
    fontStyle: 'italic',
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default ProductScreen;