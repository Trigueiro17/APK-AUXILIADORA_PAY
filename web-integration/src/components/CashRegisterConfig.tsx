'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Wifi, Printer, CreditCard, Save, TestTube, AlertCircle, CheckCircle } from 'lucide-react';


interface CashRegisterSettings {
  id: string;
  name: string;
  location: string;
  printerEnabled: boolean;
  printerIp?: string;
  printerPort?: number;
  cardReaderEnabled: boolean;
  cardReaderType?: 'usb' | 'bluetooth' | 'network';
  cardReaderConfig?: string;
  pixEnabled: boolean;
  pixKey?: string;
  autoSync: boolean;
  syncInterval: number; // em minutos
  offlineMode: boolean;
  receiptTemplate: string;
  taxRate: number;
  currency: string;
}

interface CashRegisterConfigProps {
  cashRegisterId?: string;
  onSave?: (settings: CashRegisterSettings) => void;
}

export default function CashRegisterConfig({ cashRegisterId, onSave }: CashRegisterConfigProps) {
  const [settings, setSettings] = useState<CashRegisterSettings>({
    id: cashRegisterId || '',
    name: '',
    location: '',
    printerEnabled: false,
    printerIp: '',
    printerPort: 9100,
    cardReaderEnabled: false,
    cardReaderType: 'usb',
    cardReaderConfig: '',
    pixEnabled: true,
    pixKey: '',
    autoSync: true,
    syncInterval: 5,
    offlineMode: false,
    receiptTemplate: 'default',
    taxRate: 0,
    currency: 'BRL'
  });
  
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cashRegisterId) {
      loadSettings();
    }
  }, [cashRegisterId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Aqui você carregaria as configurações da API
      // const data = await apiClient.getCashRegisterSettings(cashRegisterId);
      // setSettings(data);
    } catch (err) {
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Aqui você salvaria as configurações na API
      // await apiClient.saveCashRegisterSettings(settings);
      
      setSuccess('Configurações salvas com sucesso!');
      onSave?.(settings);
    } catch (err) {
      setError('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (type: string) => {
    setTesting(type);
    setTestResults(prev => ({ ...prev, [type]: false }));
    
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui você implementaria os testes reais
      let success = false;
      
      switch (type) {
        case 'printer':
          // Teste de impressora
          success = settings.printerIp ? true : false;
          break;
        case 'cardReader':
          // Teste de leitor de cartão
          success = settings.cardReaderEnabled;
          break;
        case 'pix':
          // Teste de PIX
          success = settings.pixEnabled && settings.pixKey ? true : false;
          break;
        case 'sync':
          // Teste de sincronização
          success = true;
          break;
      }
      
      setTestResults(prev => ({ ...prev, [type]: success }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [type]: false }));
    } finally {
      setTesting(null);
    }
  };

  const updateSetting = (key: keyof CashRegisterSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuração de Caixa</h2>
          <p className="text-muted-foreground">
            Configure as integrações e funcionalidades do caixa registradora
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="printer">Impressora</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
        </TabsList>

        {/* Configurações Gerais */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Configurações básicas do caixa registradora
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Caixa</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => updateSetting('name', e.target.value)}
                    placeholder="Ex: Caixa Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={settings.location}
                    onChange={(e) => updateSetting('location', e.target.value)}
                    placeholder="Ex: Loja Centro"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="offlineMode"
                  checked={settings.offlineMode}
                  onCheckedChange={(checked) => updateSetting('offlineMode', checked)}
                />
                <Label htmlFor="offlineMode">Modo Offline</Label>
                <p className="text-sm text-muted-foreground ml-2">
                  Permite operação sem conexão com a internet
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Impressora */}
        <TabsContent value="printer">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                Configurações de Impressora
              </CardTitle>
              <CardDescription>
                Configure a impressora para cupons fiscais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="printerEnabled"
                  checked={settings.printerEnabled}
                  onCheckedChange={(checked) => updateSetting('printerEnabled', checked)}
                />
                <Label htmlFor="printerEnabled">Habilitar Impressora</Label>
              </div>
              
              {settings.printerEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="printerIp">IP da Impressora</Label>
                      <Input
                        id="printerIp"
                        value={settings.printerIp}
                        onChange={(e) => updateSetting('printerIp', e.target.value)}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="printerPort">Porta</Label>
                      <Input
                        id="printerPort"
                        type="number"
                        value={settings.printerPort}
                        onChange={(e) => updateSetting('printerPort', parseInt(e.target.value) || 9100)}
                        placeholder="9100"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="receiptTemplate">Template do Cupom</Label>
                    <Select value={settings.receiptTemplate} onValueChange={(value) => updateSetting('receiptTemplate', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Padrão</SelectItem>
                        <SelectItem value="compact">Compacto</SelectItem>
                        <SelectItem value="detailed">Detalhado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => testConnection('printer')}
                      disabled={testing === 'printer'}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {testing === 'printer' ? 'Testando...' : 'Testar Impressora'}
                    </Button>
                    {testResults.printer !== undefined && (
                      <Badge variant={testResults.printer ? "default" : "destructive"}>
                        {testResults.printer ? 'Conectado' : 'Falha na conexão'}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Pagamento */}
        <TabsContent value="payment">
          <div className="space-y-4">
            {/* PIX */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  PIX
                </CardTitle>
                <CardDescription>
                  Configure o PIX para pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pixEnabled"
                    checked={settings.pixEnabled}
                    onCheckedChange={(checked) => updateSetting('pixEnabled', checked)}
                  />
                  <Label htmlFor="pixEnabled">Habilitar PIX</Label>
                </div>
                
                {settings.pixEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="pixKey">Chave PIX</Label>
                      <Input
                        id="pixKey"
                        value={settings.pixKey}
                        onChange={(e) => updateSetting('pixKey', e.target.value)}
                        placeholder="sua-chave-pix@email.com"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => testConnection('pix')}
                        disabled={testing === 'pix'}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testing === 'pix' ? 'Testando...' : 'Testar PIX'}
                      </Button>
                      {testResults.pix !== undefined && (
                        <Badge variant={testResults.pix ? "default" : "destructive"}>
                          {testResults.pix ? 'Configurado' : 'Erro na configuração'}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Leitor de Cartão */}
            <Card>
              <CardHeader>
                <CardTitle>Leitor de Cartão</CardTitle>
                <CardDescription>
                  Configure o leitor de cartão para pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cardReaderEnabled"
                    checked={settings.cardReaderEnabled}
                    onCheckedChange={(checked) => updateSetting('cardReaderEnabled', checked)}
                  />
                  <Label htmlFor="cardReaderEnabled">Habilitar Leitor de Cartão</Label>
                </div>
                
                {settings.cardReaderEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cardReaderType">Tipo de Conexão</Label>
                      <Select value={settings.cardReaderType} onValueChange={(value: any) => updateSetting('cardReaderType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usb">USB</SelectItem>
                          <SelectItem value="bluetooth">Bluetooth</SelectItem>
                          <SelectItem value="network">Rede</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cardReaderConfig">Configuração</Label>
                      <Input
                        id="cardReaderConfig"
                        value={settings.cardReaderConfig}
                        onChange={(e) => updateSetting('cardReaderConfig', e.target.value)}
                        placeholder="COM1, 192.168.1.50, etc."
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => testConnection('cardReader')}
                        disabled={testing === 'cardReader'}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        {testing === 'cardReader' ? 'Testando...' : 'Testar Leitor'}
                      </Button>
                      {testResults.cardReader !== undefined && (
                        <Badge variant={testResults.cardReader ? "default" : "destructive"}>
                          {testResults.cardReader ? 'Conectado' : 'Falha na conexão'}
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configurações de Sincronização */}
        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Sincronização
              </CardTitle>
              <CardDescription>
                Configure a sincronização de dados com o servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoSync"
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => updateSetting('autoSync', checked)}
                />
                <Label htmlFor="autoSync">Sincronização Automática</Label>
              </div>
              
              {settings.autoSync && (
                <div className="space-y-2">
                  <Label htmlFor="syncInterval">Intervalo de Sincronização (minutos)</Label>
                  <Select value={settings.syncInterval.toString()} onValueChange={(value) => updateSetting('syncInterval', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minuto</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => testConnection('sync')}
                  disabled={testing === 'sync'}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  {testing === 'sync' ? 'Testando...' : 'Testar Conexão'}
                </Button>
                {testResults.sync !== undefined && (
                  <Badge variant={testResults.sync ? "default" : "destructive"}>
                    {testResults.sync ? 'Conectado' : 'Falha na conexão'}
                  </Badge>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Wifi className="h-4 w-4 mr-2" />
                  Sincronizar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}