import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReceiptData } from '../services/printService';

interface ReceiptTemplateProps {
  data: ReceiptData;
  preview?: boolean;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ data, preview = false }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string): string => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (preview) {
    return (
      <View style={styles.previewContainer}>
        <View style={styles.receiptContainer}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <Text style={styles.storeName}>{data.storeName || 'AUXILIADORA PAY'}</Text>
            {data.storeAddress && (
              <Text style={styles.storeInfo}>{data.storeAddress}</Text>
            )}
            {data.storePhone && (
              <Text style={styles.storeInfo}>Tel: {data.storePhone}</Text>
            )}
          </View>

          <View style={styles.divider} />
          <Text style={styles.receiptTitle}>CUPOM FISCAL</Text>
          <View style={styles.divider} />

          {/* Informações da venda */}
          <View style={styles.saleInfo}>
            <Text style={styles.saleInfoText}>Venda: {data.saleId}</Text>
            <Text style={styles.saleInfoText}>Data: {data.date}</Text>
            <Text style={styles.saleInfoText}>Hora: {data.time}</Text>
            {data.cashierName && (
              <Text style={styles.saleInfoText}>Operador: {data.cashierName}</Text>
            )}
          </View>

          <View style={styles.itemsDivider} />

          {/* Cabeçalho dos itens */}
          <View style={styles.itemsHeader}>
            <Text style={styles.itemsHeaderText}>ITEM</Text>
            <Text style={styles.itemsHeaderText}>QTD</Text>
            <Text style={styles.itemsHeaderText}>VLR UNIT</Text>
            <Text style={styles.itemsHeaderText}>TOTAL</Text>
          </View>

          <View style={styles.itemsDivider} />

          {/* Itens */}
          {data.items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.itemRow}>
                <Text style={styles.itemNumber}>{index + 1}.</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name}
                </Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetailText}>{item.quantity}x</Text>
                <Text style={styles.itemDetailText}>{formatCurrency(item.price)}</Text>
                <Text style={styles.itemDetailText}>{formatCurrency(item.total)}</Text>
              </View>
            </View>
          ))}

          <View style={styles.itemsDivider} />

          {/* Totais */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>TOTAL:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(data.total)}</Text>
            </View>
          </View>

          {/* Forma de pagamento */}
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentText}>Forma de Pagamento: {data.paymentMethod}</Text>
          </View>

          <View style={styles.divider} />

          {/* Rodapé */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Obrigado pela preferência!</Text>
            <Text style={styles.footerText}>Volte sempre!</Text>
          </View>

          <View style={styles.divider} />
        </View>
      </View>
    );
  }

  // Versão para impressão (texto simples)
  return null;
};

const styles = StyleSheet.create({
  previewContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    alignItems: 'center',
  },
  receiptContainer: {
    backgroundColor: 'white',
    width: 280, // Simula largura de papel térmico 58mm
    padding: 12,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  storeInfo: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 8,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 4,
  },
  saleInfo: {
    marginVertical: 8,
  },
  saleInfoText: {
    fontSize: 12,
    marginBottom: 2,
  },
  itemsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginVertical: 4,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemsHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  itemContainer: {
    marginVertical: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNumber: {
    fontSize: 10,
    width: 20,
  },
  itemName: {
    fontSize: 10,
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
    marginTop: 2,
  },
  itemDetailText: {
    fontSize: 10,
    flex: 1,
    textAlign: 'center',
  },
  totalsContainer: {
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 12,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentContainer: {
    marginVertical: 8,
  },
  paymentText: {
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
});

export default ReceiptTemplate;
export type { ReceiptTemplateProps };