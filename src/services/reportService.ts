import XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DailySalesReport, CashRegisterReport, PaymentMethod } from '../types';

export class ReportService {
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private static formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  private static formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('pt-BR');
  }

  private static getPaymentMethodLabel(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.PIX:
        return 'PIX';
      case PaymentMethod.DEBIT_CARD:
        return 'Cartão de Débito';
      case PaymentMethod.CREDIT_CARD:
        return 'Cartão de Crédito';
      case PaymentMethod.CASH:
        return 'Dinheiro';
      default:
        return method;
    }
  }

  static async generateDailyReportPDF(reports: DailySalesReport[]): Promise<string> {
    const totalSales = reports.reduce((sum, report) => sum + report.totalSales, 0);
    const totalAmount = reports.reduce((sum, report) => sum + report.totalAmount, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Vendas Diárias</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 15px;
          }
          .summary { 
            background-color: #f5f5f5; 
            padding: 15px; 
            margin-bottom: 20px; 
            border-radius: 5px;
          }
          .report-item { 
            margin-bottom: 20px; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 15px;
          }
          .date { 
            font-size: 18px; 
            font-weight: bold; 
            color: #333;
          }
          .amount { 
            font-size: 16px; 
            color: #2e7d32; 
            font-weight: bold;
          }
          .payment-methods { 
            margin-top: 10px;
          }
          .payment-method { 
            display: inline-block; 
            margin-right: 15px; 
            padding: 5px 10px; 
            background-color: #e3f2fd; 
            border-radius: 3px;
          }
          .print-button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px 0;
            font-size: 16px;
          }
          .print-button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-button" onclick="window.print()">🖨️ Imprimir como PDF</button>
          <p><strong>Instruções:</strong> Clique no botão acima ou use Ctrl+P para imprimir. Selecione "Salvar como PDF" no destino da impressão.</p>
        </div>
        
        <div class="header">
          <h1>Relatório de Vendas Diárias</h1>
          <p>Gerado em: ${this.formatDateTime(new Date())}</p>
        </div>
        
        <div class="summary">
          <h2>Resumo Geral</h2>
          <p><strong>Total de Vendas:</strong> ${totalSales}</p>
          <p><strong>Faturamento Total:</strong> ${this.formatCurrency(totalAmount)}</p>
        </div>
        
        ${reports.map(report => `
          <div class="report-item">
            <div class="date">${this.formatDate(report.date)}</div>
            <p><strong>Vendas:</strong> ${report.totalSales}</p>
            <div class="amount">Faturamento: ${this.formatCurrency(report.totalAmount)}</div>
            <div class="payment-methods">
              <strong>Métodos de Pagamento:</strong><br>
              ${report.paymentMethods.map(pm => `
                <span class="payment-method">
                  ${this.getPaymentMethodLabel(pm.method)}: ${pm.count} (${this.formatCurrency(pm.amount)})
                </span>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const fileName = `relatorio_vendas_diarias_${new Date().toISOString().split('T')[0]}.html`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return filePath;
  }

  static async generateCashRegisterReportPDF(reports: CashRegisterReport[]): Promise<string> {
    const totalSales = reports.reduce((sum, report) => sum + report.totalSales, 0);
    const totalAmount = reports.reduce((sum, report) => sum + report.totalAmount, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Histórico de Caixa</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 15px;
          }
          .summary { 
            background-color: #f5f5f5; 
            padding: 15px; 
            margin-bottom: 20px;
            border-radius: 5px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
            font-size: 12px;
          }
          th { 
            background-color: #4CAF50; 
            color: white;
            font-weight: bold;
          }
          .status { 
            padding: 3px 8px; 
            border-radius: 3px; 
            font-size: 11px;
            font-weight: bold;
          }
          .status.open { 
            background-color: #fff3cd; 
            color: #856404;
          }
          .status.closed { 
            background-color: #d4edda; 
            color: #155724;
          }
          .print-button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 20px 0;
            font-size: 16px;
          }
          .print-button:hover {
            background-color: #45a049;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="print-button" onclick="window.print()">🖨️ Imprimir como PDF</button>
          <p><strong>Instruções:</strong> Clique no botão acima ou use Ctrl+P para imprimir. Selecione "Salvar como PDF" no destino da impressão.</p>
        </div>
        
        <div class="header">
          <h1>Relatório de Histórico de Caixa</h1>
          <p>Gerado em: ${this.formatDateTime(new Date())}</p>
        </div>
        
        <div class="summary">
          <h2>Resumo Geral</h2>
          <p><strong>Total de Vendas:</strong> ${totalSales}</p>
          <p><strong>Faturamento Total:</strong> ${this.formatCurrency(totalAmount)}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Data Abertura</th>
              <th>Data Fechamento</th>
              <th>Status</th>
              <th>Usuário</th>
              <th>Valor Inicial</th>
              <th>Valor Final</th>
              <th>Vendas</th>
              <th>Faturamento</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(report => `
              <tr>
                <td>${this.formatDateTime(report.openedAt)}</td>
                <td>${report.closedAt ? this.formatDateTime(report.closedAt) : 'Em aberto'}</td>
                <td><span class="status ${report.closedAt ? 'closed' : 'open'}">${report.closedAt ? 'Fechado' : 'Aberto'}</span></td>
                <td>${report.user.name}</td>
                <td>${this.formatCurrency(report.openingAmount)}</td>
                <td>${report.closingAmount !== undefined ? this.formatCurrency(report.closingAmount) : '-'}</td>
                <td>${report.totalSales}</td>
                <td>${this.formatCurrency(report.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const fileName = `relatorio_historico_caixa_${new Date().toISOString().split('T')[0]}.html`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return filePath;
  }

  static async generateDailyReportExcel(reports: DailySalesReport[]): Promise<string> {
    const workbook = XLSX.utils.book_new();
    
    // Resumo geral
    const summaryData = [
      ['Relatório de Vendas Diárias'],
      ['Gerado em:', this.formatDateTime(new Date())],
      [''],
      ['Total de Vendas:', reports.reduce((sum, report) => sum + report.totalSales, 0)],
      ['Faturamento Total:', reports.reduce((sum, report) => sum + report.totalAmount, 0)],
      [''],
      ['Data', 'Vendas', 'Faturamento', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Dinheiro']
    ];

    // Dados detalhados
    const detailData = reports.map(report => {
      const paymentMethods = {
        [PaymentMethod.PIX]: 0,
        [PaymentMethod.DEBIT_CARD]: 0,
        [PaymentMethod.CREDIT_CARD]: 0,
        [PaymentMethod.CASH]: 0,
      };

      report.paymentMethods.forEach(pm => {
        paymentMethods[pm.method as keyof typeof paymentMethods] = pm.amount;
      });

      return [
        this.formatDate(report.date),
        report.totalSales,
        report.totalAmount,
        paymentMethods[PaymentMethod.PIX],
        paymentMethods[PaymentMethod.DEBIT_CARD],
        paymentMethods[PaymentMethod.CREDIT_CARD],
        paymentMethods[PaymentMethod.CASH],
      ];
    });

    const allData = [...summaryData, ...detailData];
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas Diárias');

    const fileName = `relatorio_vendas_diarias_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    await FileSystem.writeAsStringAsync(filePath, wbout, { encoding: FileSystem.EncodingType.Base64 });
    
    return filePath;
  }

  static async generateCashRegisterReportExcel(reports: CashRegisterReport[]): Promise<string> {
    const workbook = XLSX.utils.book_new();
    
    // Resumo geral
    const summaryData = [
      ['Relatório de Histórico de Caixa'],
      ['Gerado em:', this.formatDateTime(new Date())],
      [''],
      ['Total de Vendas:', reports.reduce((sum, report) => sum + report.totalSales, 0)],
      ['Faturamento Total:', reports.reduce((sum, report) => sum + report.totalAmount, 0)],
      [''],
      ['Data Abertura', 'Data Fechamento', 'Status', 'Usuário', 'Valor Inicial', 'Valor Final', 'Vendas', 'Faturamento']
    ];

    // Dados detalhados
    const detailData = reports.map(report => [
      this.formatDateTime(report.openedAt),
      report.closedAt ? this.formatDateTime(report.closedAt) : 'Em aberto',
      report.closedAt ? 'Fechado' : 'Aberto',
      report.user.name,
      report.openingAmount,
      report.closingAmount || 0,
      report.totalSales,
      report.totalAmount,
    ]);

    const allData = [...summaryData, ...detailData];
    const worksheet = XLSX.utils.aoa_to_sheet(allData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Caixa');

    const fileName = `relatorio_historico_caixa_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    await FileSystem.writeAsStringAsync(filePath, wbout, { encoding: FileSystem.EncodingType.Base64 });
    
    return filePath;
  }

  static async shareFile(filePath: string, title: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        let mimeType = 'application/octet-stream';
        if (filePath.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (filePath.endsWith('.xlsx')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (filePath.endsWith('.html')) {
          mimeType = 'text/html';
        }
        
        await Sharing.shareAsync(filePath, {
          mimeType,
          dialogTitle: title,
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }
}