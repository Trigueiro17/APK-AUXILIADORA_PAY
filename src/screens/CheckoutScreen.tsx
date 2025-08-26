import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Searchbar,
  Portal,
  Modal,
  RadioButton,
  Divider,
  useTheme,
  Surface,
  Chip,
  Text,
} from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../contexts/AppContext';
import { Product, PaymentMethod } from '../types';
import { CartItem } from '../contexts/AppContext';
import { apiService, CreateSaleRequest } from '../services/apiService';
import printService, { ReceiptData } from '../services/printService';
import ReceiptTemplate from '../components/ReceiptTemplate';
import NFCPaymentComponent from '../components/NFCPayment';
import { NFCPayment as NFCPaymentType } from '../services/nfcService';

const CheckoutScreen: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH' as PaymentMethod);
  const [pixQrCode, setPixQrCode] = useState('');
  const [cartVisible, setCartVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<ReceiptData | null>(null);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [nfcModalVisible, setNfcModalVisible] = useState(false);
  
  const { 
    state, 
    dispatch,
    loadProducts: contextLoadProducts,
    createSale,
    loadCurrentCashRegister 
  } = useAppContext();
  const { cart, user, currentCashRegister, products, loading: contextLoading } = state;
  const { width, height } = useWindowDimensions();
  
  // Responsive breakpoints
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const isMobile = width < 768;
  const isLandscape = width > height;

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  // Sincronizar produtos do contexto com estado local
  useEffect(() => {
    setAvailableProducts(products.filter(p => p.active));
  }, [products]);

  const loadProducts = async () => {
    try {
      // Verificar se o usuário está autenticado antes de carregar produtos
      if (!user || !state.isAuthenticated) {
        console.log('Usuário não autenticado, não é possível carregar produtos');
        return;
      }
      
      await contextLoadProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    }
  };



  const filteredProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!currentCashRegister) {
      Alert.alert('Erro', 'Não é possível adicionar produtos ao carrinho. Caixa não está aberto.');
      return;
    }
    
    if (quantity <= 0) {
      Alert.alert('Erro', 'Quantidade inválida');
      return;
    }

    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, quantity },
    });
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    dispatch({
      type: 'UPDATE_CART_ITEM',
      payload: { productId, quantity },
    });
  };

  const removeFromCart = (productId: string) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: productId,
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getTotalQuantity = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const generatePixQrCode = () => {
    const totalAmount = getTotalAmount();
    const pixData = {
      version: '01',
      initMethod: '12',
      merchantAccount: '0014BR.GOV.BCB.PIX',
      merchantKey: 'auxiliadorapay@exemplo.com',
      amount: totalAmount.toFixed(2),
      currency: 'BRL',
      country: 'BR',
      merchantName: 'AUXILIADORA PAY',
      merchantCity: 'SAO PAULO',
      txid: `TXN${Date.now()}`,
    };
    
    // Simplified PIX QR Code generation (in production, use proper PIX library)
    const qrCodeData = `00020126580014BR.GOV.BCB.PIX0136${pixData.merchantKey}52040000530398654${String(totalAmount.toFixed(2)).padStart(10, '0')}5802BR5913${pixData.merchantName}6009${pixData.merchantCity}62070503***6304`;
    
    setPixQrCode(qrCodeData);
    setPixModalVisible(true);
  };

  const processSale = async () => {
    if (!currentCashRegister) {
      Alert.alert('Erro', 'Não é possível processar vendas. Caixa não está aberto.');
      return;
    }
    
    if (cart.length === 0) {
      Alert.alert('Erro', 'Carrinho está vazio');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      setLoading(true);
      
      const calculatedTotal = getTotalAmount();
      
      // Validate that calculated total matches sum of individual items
      const itemsTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      if (Math.abs(calculatedTotal - itemsTotal) > 0.01) {
        console.error('Total calculation mismatch:', { calculatedTotal, itemsTotal });
        Alert.alert('Erro', 'Erro na validação do total. Tente novamente.');
        return;
      }
      
      const saleData = {
        cashRegisterId: currentCashRegister?.id || '',
        userId: user?.id || '',
        items: cart.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        total: calculatedTotal,
        paymentMethod: selectedPaymentMethod as 'CASH' | 'CARD' | 'PIX',
        status: 'COMPLETED' as const,
      };
      
      const createdSale = await apiService.createSale(saleData);
      
      // Preparar dados do recibo
      const receiptData: ReceiptData = {
        saleId: createdSale.id || `SALE-${Date.now()}`,
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR'),
        items: cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity
        })),
        subtotal: calculatedTotal,
        total: calculatedTotal,
        paymentMethod: getPaymentMethodLabel(selectedPaymentMethod!),
        cashierName: user?.name,
        storeName: 'AUXILIADORA PAY',
        storeAddress: 'Endereço da Loja',
        storePhone: '(11) 99999-9999'
      };
      
      setLastSaleData(receiptData);
      
      clearCart();
      setPaymentModalVisible(false);
      setPixModalVisible(false);
      
      // Mostrar modal de recibo
      setReceiptModalVisible(true);
      
      // Reload products
      await loadProducts();
    } catch (error: any) {
      console.error('Error processing sale:', error);
      Alert.alert('Erro', error.message || 'Não foi possível processar a venda');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPaymentMethodLabel = (method: PaymentMethod | string) => {
    switch (method) {
      case PaymentMethod.PIX:
        return 'PIX';
      case PaymentMethod.DEBIT_CARD:
        return 'Cartão de Débito';
      case PaymentMethod.CREDIT_CARD:
        return 'Cartão de Crédito';
      case PaymentMethod.CASH:
        return 'Dinheiro';
      case PaymentMethod.NFC:
      case 'NFC':
        return 'NFC';
      default:
        return method;
    }
  };

  const handlePrintReceipt = async () => {
    if (!lastSaleData) return;
    
    setPrintingReceipt(true);
    try {
      const success = await printService.printReceipt(lastSaleData);
      if (success) {
        setReceiptModalVisible(false);
      }
    } catch (error) {
      console.error('Erro ao imprimir recibo:', error);
      Alert.alert('Erro', 'Não foi possível imprimir o recibo.');
    } finally {
      setPrintingReceipt(false);
    }
  };

  const handleCloseReceiptModal = () => {
    setReceiptModalVisible(false);
    Alert.alert(
      'Venda Realizada',
      `Venda de ${formatCurrency(lastSaleData?.total || 0)} realizada com sucesso!`,
      [{ text: 'OK' }]
    );
  };

  const handleNFCPaymentComplete = async (nfcPayment: NFCPaymentType) => {
    try {
      setLoading(true);
      
      // Processar venda com dados do NFC
      await processSaleWithNFC(nfcPayment);
      
      setNfcModalVisible(false);
    } catch (error) {
      console.error('Erro ao processar pagamento NFC:', error);
      Alert.alert('Erro', 'Não foi possível processar o pagamento NFC');
    } finally {
      setLoading(false);
    }
  };

  const processSaleWithNFC = async (nfcPayment: NFCPaymentType) => {
    if (!user || !currentCashRegister) {
      throw new Error('Usuário ou caixa não encontrado');
    }

    const calculatedTotal = getTotalAmount();
    
    const saleData: CreateSaleRequest = {
      userId: user.id,
      cashRegisterId: currentCashRegister.id,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      total: calculatedTotal,
      paymentMethod: 'NFC' as any,
      status: 'COMPLETED' as const,
    };
    
    const createdSale = await apiService.createSale(saleData);
    
    // Preparar dados do recibo
    const receiptData: ReceiptData = {
      saleId: createdSale.id || `SALE-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR'),
      items: cart.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity
      })),
      subtotal: calculatedTotal,
      total: calculatedTotal,
      paymentMethod: 'NFC',
      cashierName: user?.name,
      storeName: 'AUXILIADORA PAY',
      storeAddress: 'Endereço da Loja',
      storePhone: '(11) 99999-9999'
    };
    
    setLastSaleData(receiptData);
    
    clearCart();
    
    // Mostrar modal de recibo
    setReceiptModalVisible(true);
    
    // Reload products
    await loadProducts();
  };

  const renderProduct = ({ item: product }: { item: Product }) => (
    <Surface style={[styles.productCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Title style={[styles.productName, { color: theme.colors.onSurface }]}>{product.name}</Title>
            <Text style={[styles.productPrice, { color: theme.colors.primary }]}>
              {formatCurrency(product.price)}
            </Text>
            <View style={styles.productDetails}>
              {product.description && (
                <Paragraph style={[styles.productDescription, { color: theme.colors.onSurfaceVariant }]}>{product.description}</Paragraph>
               )}
             </View>
           </View>
          <IconButton
            icon="plus"
            size={24}
            iconColor={theme.colors.onPrimary}
            onPress={() => addToCart(product)}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }, !currentCashRegister && styles.disabledButton]}
            disabled={!currentCashRegister}
          />
        </View>
      </Card.Content>
    </Surface>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <Surface style={[styles.cartCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Card.Content>
        <View style={styles.cartItemHeader}>
          <View style={styles.cartItemInfo}>
            <Title style={[styles.cartItemName, { color: theme.colors.onSurface }]}>{item.product.name}</Title>
            <Paragraph style={[styles.cartItemPrice, { color: theme.colors.onSurfaceVariant }]}>
              {formatCurrency(item.product.price)} x {item.quantity}
            </Paragraph>
          </View>
          <View style={styles.cartItemActions}>
            <View style={styles.quantityControls}>
              <IconButton
                icon="minus"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => updateCartItem(item.product.id, item.quantity - 1)}
                disabled={!currentCashRegister}
                style={!currentCashRegister && styles.disabledButton}
              />
              <Text style={[styles.quantity, { color: theme.colors.onSurface }]}>{item.quantity}</Text>
              <IconButton
                icon="plus"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => updateCartItem(item.product.id, item.quantity + 1)}
                disabled={!currentCashRegister}
                style={!currentCashRegister && styles.disabledButton}
              />
            </View>
            <Text style={[styles.itemTotal, { color: theme.colors.primary }]}>
              {formatCurrency(item.product.price * item.quantity)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Surface>
  );

  const renderCartContent = () => (
    <View style={styles.cartContent}>
      <View style={styles.cartHeader}>
        <View style={styles.cartHeaderActions}>
          {cart.length > 0 && (
            <Button 
              mode="text" 
              textColor={theme.colors.error}
              onPress={clearCart}
              disabled={!currentCashRegister}
              style={!currentCashRegister && styles.disabledButton}
            >
              Limpar Carrinho
            </Button>
          )}
        </View>
      </View>
      
      {cart.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={[styles.emptyCart, { color: theme.colors.onSurfaceVariant }]}>Carrinho vazio</Text>
          <Text style={[styles.emptyCartSubtext, { color: theme.colors.onSurfaceVariant }]}>Adicione produtos para começar</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product.id}
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
          />
          
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
          
          <View style={styles.totalSection}>
            <Title style={[styles.total, { color: theme.colors.primary }]}>
              Total: {formatCurrency(getTotalAmount())}
            </Title>
            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => {
                setCartModalVisible(false);
                setPaymentModalVisible(true);
              }}
              style={[styles.checkoutButton, !currentCashRegister && styles.disabledButton]}
              disabled={!currentCashRegister}
            >
              Finalizar Venda
            </Button>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Cart Header Button */}
      <Surface style={[styles.headerContainer, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Button
          mode="contained"
          icon="cart"
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          onPress={() => setCartModalVisible(true)}
          style={styles.cartHeaderButton}
          contentStyle={styles.cartButtonContent}
        >
          {cart.length === 0 ? (
            'Carrinho'
          ) : (
            `Carrinho (${getTotalQuantity()}) - ${formatCurrency(getTotalAmount())}`
          )}
        </Button>
      </Surface>
      
      {/* Warning when cash register is not open */}
      {!currentCashRegister && (
        <Surface style={[styles.cashRegisterWarning, { backgroundColor: theme.colors.errorContainer }]} elevation={1}>
          <Text style={[styles.warningText, { color: theme.colors.onErrorContainer }]}>
            ⚠️ Caixa não está aberto. Não é possível realizar vendas.
          </Text>
        </Surface>
      )}
      
      {isMobile ? (
        // Mobile Layout - Full Screen Products
        <View style={styles.mobileContainer}>
          <View style={styles.mobileProductsSection}>
            <Searchbar
              placeholder="Buscar produtos..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
              iconColor={theme.colors.onSurfaceVariant}
              inputStyle={{ color: theme.colors.onSurface }}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              style={styles.productsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      ) : (
        // Tablet/Desktop Layout - Side by Side
        <View style={[styles.content, isDesktop && styles.desktopContent]}>
          {/* Products Section */}
          <View style={[styles.productsSection, isDesktop && styles.desktopProductsSection]}>
            <Searchbar
              placeholder="Buscar produtos..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
              iconColor={theme.colors.onSurfaceVariant}
              inputStyle={{ color: theme.colors.onSurface }}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              style={styles.productsList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Cart Section */}
          <View style={[styles.cartSection, isDesktop && styles.desktopCartSection]}>
            {renderCartContent()}
          </View>
        </View>
      )}

      {/* Cart Modal */}
      <Portal>
        <Modal
          visible={cartModalVisible}
          onDismiss={() => setCartModalVisible(false)}
          contentContainerStyle={[styles.cartModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={[styles.cartModalHeader, { borderBottomColor: theme.colors.outline }]}>
            <Title style={{ color: theme.colors.onSurface }}>Carrinho de Compras</Title>
            <IconButton
              icon="close"
              iconColor={theme.colors.onSurface}
              onPress={() => setCartModalVisible(false)}
            />
          </View>
          <View style={styles.cartModalContent}>
            {renderCartContent()}
          </View>
        </Modal>
      </Portal>

      {/* Payment Method Modal */}
      <Portal>
        <Modal
          visible={paymentModalVisible}
          onDismiss={() => setPaymentModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Método de Pagamento</Title>
          
          <View style={[styles.totalDisplay, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}>Total a Pagar:</Text>
            <Title style={[styles.totalAmount, { color: theme.colors.primary }]}>{formatCurrency(getTotalAmount())}</Title>
          </View>

          <RadioButton.Group
            onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
            value={selectedPaymentMethod}
          >
            <View style={styles.paymentOption}>
              <RadioButton value="CASH" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurface }}>Dinheiro</Text>
            </View>
            <View style={styles.paymentOption}>
              <RadioButton value="PIX" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurface }}>PIX</Text>
            </View>
            <View style={styles.paymentOption}>
              <RadioButton value="CARD" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurface }}>Cartão</Text>
            </View>
            <View style={styles.paymentOption}>
              <RadioButton value="NFC" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurface }}>NFC</Text>
            </View>
          </RadioButton.Group>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              buttonColor={theme.colors.surface}
              textColor={theme.colors.onSurface}
              onPress={() => setPaymentModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => {
                if (selectedPaymentMethod === 'PIX') {
                  generatePixQrCode();
                } else if (selectedPaymentMethod === 'NFC') {
                  setPaymentModalVisible(false);
                  setNfcModalVisible(true);
                } else {
                  processSale();
                }
              }}
              style={styles.modalButton}
              loading={loading || contextLoading}
            >
              {selectedPaymentMethod === 'PIX' ? 'Gerar QR Code' : selectedPaymentMethod === 'NFC' ? 'Pagar com NFC' : 'Confirmar'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* PIX QR Code Modal */}
      <Portal>
        <Modal
          visible={pixModalVisible}
          onDismiss={() => setPixModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Pagamento PIX</Title>
          
          <View style={styles.qrCodeContainer}>
            <Text style={[styles.qrCodeInstructions, { color: theme.colors.onSurfaceVariant }]}>
              Escaneie o QR Code abaixo para realizar o pagamento:
            </Text>
            
            <Surface style={styles.qrCodeWrapper} elevation={2}>
              <QRCode
                value={pixQrCode}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </Surface>
            
            <Text style={[styles.pixAmount, { color: theme.colors.primary }]}>
              Valor: {formatCurrency(getTotalAmount())}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              buttonColor={theme.colors.surface}
              textColor={theme.colors.onSurface}
              onPress={() => setPixModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={processSale}
              style={styles.modalButton}
              loading={loading || contextLoading}
            >
              Confirmar Pagamento
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Receipt Modal */}
      <Portal>
        <Modal
          visible={receiptModalVisible}
          onDismiss={handleCloseReceiptModal}
          contentContainerStyle={[styles.receiptModal, { backgroundColor: theme.colors.surface }]}
        >
          <Title style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Recibo da Venda</Title>
          
          {lastSaleData && (
            <ReceiptTemplate data={lastSaleData} preview={true} />
          )}

          <View style={styles.receiptModalActions}>
            <Button
              mode="outlined"
              buttonColor={theme.colors.surface}
              textColor={theme.colors.onSurface}
              onPress={handleCloseReceiptModal}
              style={styles.modalButton}
            >
              Fechar
            </Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={handlePrintReceipt}
              style={styles.modalButton}
              loading={printingReceipt}
              icon="printer"
            >
              Imprimir Recibo
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* NFC Payment Modal */}
      <NFCPaymentComponent
        visible={nfcModalVisible}
        onClose={() => setNfcModalVisible(false)}
        amount={getTotalAmount()}
        description={`Compra - ${cart.length} item(s)`}
        onPaymentComplete={handleNFCPaymentComplete}
        mode="payment"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Desktop/Tablet Layout
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  productsSection: {
    flex: 1,
    padding: 16,
    minWidth: 0, // Prevents flex overflow
  },
  desktopProductsSection: {
    flex: 2,
    paddingRight: 8,
  },
  cartSection: {
    width: 350,
    padding: 16,
    paddingLeft: 8,
  },
  desktopCartSection: {
    width: 400,
    minWidth: 350,
  },
  // Mobile Layout
  mobileContainer: {
    flex: 1,
  },
  mobileCartSection: {
    padding: 16,
    paddingTop: 8,
    maxHeight: '40%',
  },
  mobileProductsSection: {
     flex: 1,
     padding: 16,
   },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
  },
  productsList: {
    flex: 1,
  },
  productCard: {
    marginBottom: 8,
    elevation: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: '#4caf50',
  },
  cartCard: {
    elevation: 2,
  },
  mobileCartCard: {
    marginBottom: 0,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCart: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  cartList: {
    maxHeight: 300,
  },
  mobileCartList: {
    maxHeight: 200,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  cartItemActions: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  totalSection: {
    alignItems: 'center',
  },
  total: {
    fontSize: 20,
    color: '#2e7d32',
    marginBottom: 16,
  },
  checkoutButton: {
    width: '100%',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  totalDisplay: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    color: '#2e7d32',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCodeInstructions: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  pixAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
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
  disabledButton: {
    opacity: 0.5,
  },
  cashRegisterWarning: {
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cartHeaderButton: {
    minWidth: 120,
  },
  cartButtonContent: {
    flexDirection: 'row-reverse',
  },
  cartModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
    flex: 1,
  },
  cartModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cartModalContent: {
     flex: 1,
     padding: 16,
   },
   cartContent: {
     flex: 1,
   },
   emptyCartContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     paddingVertical: 40,
   },
   emptyCartSubtext: {
     textAlign: 'center',
     color: '#999',
     fontSize: 12,
     marginTop: 8,
   },
   receiptModal: {
     backgroundColor: 'white',
     margin: 20,
     borderRadius: 8,
     padding: 20,
     maxHeight: '90%',
   },
   receiptModalActions: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     marginTop: 20,
     gap: 12,
   },
});

export default CheckoutScreen;