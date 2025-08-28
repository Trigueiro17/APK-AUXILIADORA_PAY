"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, DollarSign, User, Calendar, Loader2, Settings } from "lucide-react";
import { apiClient, CashRegister, User as UserType } from "@/lib/api";
import CashRegisterConfig from "@/components/CashRegisterConfig";
import { CompactSyncStatus, DetailedSyncStatus } from "@/components/SyncStatus";

export default function CashRegistersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter] = useState("all");
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCashRegister, setNewCashRegister] = useState({
    userId: "",
    initialAmount: 0
  });
  const [selectedCashRegister, setSelectedCashRegister] = useState<CashRegister | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // Carregar caixas registradoras e usuários da API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cashRegistersData, usersData] = await Promise.all([
        apiClient.getCashRegisters(),
        apiClient.getUsers()
      ]);
      setCashRegisters(cashRegistersData);
      setUsers(usersData);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCashRegisters = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCashRegisters();
      setCashRegisters(data);
    } catch (err) {
      setError('Erro ao carregar caixas registradoras');
      console.error('Erro ao carregar caixas registradoras:', err);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter o nome do usuário pelo ID
  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `Usuário ${userId}`;
  };

  // Filtrar caixas registradoras
  const filteredCashRegisters = cashRegisters.filter(cashRegister => {
    const matchesSearch = searchTerm === "" || 
      cashRegister.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || cashRegister.status === statusFilter;
    const matchesUser = userFilter === "all" || cashRegister.userId === userFilter;
    
    return matchesSearch && matchesStatus && matchesUser;
  });

  const createCashRegister = async () => {
    if (!newCashRegister.userId) {
      setError('Usuário é obrigatório');
      return;
    }

    try {
      const createdCashRegister = await apiClient.createCashRegister({
        userId: newCashRegister.userId,
        initialAmount: newCashRegister.initialAmount
      });
      
      setCashRegisters([...cashRegisters, createdCashRegister]);
      setShowCreateForm(false);
      setNewCashRegister({ userId: "", initialAmount: 0 });
      setError(null);
    } catch (err) {
      console.error('Erro ao criar caixa registradora:', err);
      setError('Erro ao criar caixa registradora');
    }
  };

  const updateCashRegisterStatus = async (cashRegisterId: string, newStatus: 'OPEN' | 'CLOSED') => {
    try {
      const updatedCashRegister = await apiClient.updateCashRegister(cashRegisterId, {
        status: newStatus
      });
      
      setCashRegisters(cashRegisters.map(cr => 
        cr.id === cashRegisterId ? updatedCashRegister : cr
      ));
    } catch (err) {
      console.error('Erro ao atualizar caixa registradora:', err);
      setError('Erro ao atualizar status da caixa registradora');
    }
  };

  const deleteCashRegister = async (cashRegisterId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta caixa registradora? Só é possível excluir caixas sem vendas associadas.')) return;
    
    try {
      await apiClient.deleteCashRegister(cashRegisterId);
      setCashRegisters(cashRegisters.filter(cr => cr.id !== cashRegisterId));
    } catch (err) {
      console.error('Erro ao excluir caixa registradora:', err);
      setError('Erro ao excluir caixa registradora. Verifique se não há vendas associadas.');
    }
  };

  // Calcular estatísticas
  const totalCashRegisters = filteredCashRegisters.length;
  const openCashRegisters = filteredCashRegisters.filter(cr => cr.status === 'OPEN').length;
  const closedCashRegisters = filteredCashRegisters.filter(cr => cr.status === 'CLOSED').length;
  const totalAmount = filteredCashRegisters.reduce((sum, cr) => {
    const amount = typeof cr.currentAmount === 'number' ? cr.currentAmount : 0;
    return sum + amount;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caixas Registradoras</h1>
          <p className="text-muted-foreground">Gerencie as caixas registradoras do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <CompactSyncStatus />
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Caixa
          </Button>
        </div>
      </div>

      {/* Status de Sincronização */}
      <DetailedSyncStatus />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Caixas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCashRegisters}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixas Abertos</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{openCashRegisters}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixas Fechados</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{closedCashRegisters}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de criação */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Caixa Registradora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userId">Usuário *</Label>
              <Select
                value={newCashRegister.userId}
                onValueChange={(value) => setNewCashRegister({ ...newCashRegister, userId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="initialAmount">Valor Inicial</Label>
              <Input
                id="initialAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newCashRegister.initialAmount}
                onChange={(e) => setNewCashRegister({ ...newCashRegister, initialAmount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createCashRegister}>Criar Caixa</Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                setNewCashRegister({ userId: "", initialAmount: 0 });
                setError(null);
              }}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar caixas registradoras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="OPEN">Aberto</option>
              <option value="CLOSED">Fechado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de caixas registradoras */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCashRegisters}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando caixas registradoras...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCashRegisters.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhuma caixa registradora encontrada</p>
              </CardContent>
            </Card>
          ) : (
            filteredCashRegisters.map((cashRegister) => (
              <Card key={cashRegister.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">Caixa Registradora</h3>
                        <Badge variant={cashRegister.status === 'OPEN' ? "default" : "destructive"}>
                          {cashRegister.status === 'OPEN' ? "Aberto" : "Fechado"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Usuário: {getUserName(cashRegister.userId)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Inicial: R$ {(typeof cashRegister.initialAmount === 'number' ? cashRegister.initialAmount : 0).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Atual: R$ {(typeof cashRegister.currentAmount === 'number' ? cashRegister.currentAmount : 0).toFixed(2)}
                        </span>
                        {cashRegister.finalAmount !== null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Final: R$ {(typeof cashRegister.finalAmount === 'number' ? cashRegister.finalAmount : 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Criado em: {new Date(cashRegister.createdAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Atualizado em: {new Date(cashRegister.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateCashRegisterStatus(
                          cashRegister.id, 
                          cashRegister.status === 'OPEN' ? 'CLOSED' : 'OPEN'
                        )}
                      >
                        {cashRegister.status === 'OPEN' ? 'Fechar' : 'Abrir'}
                      </Button>
                      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCashRegister(cashRegister)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              Configuração da Caixa Registradora
                            </DialogTitle>
                            <DialogDescription>
                              Configure as integrações e parâmetros da caixa registradora
                            </DialogDescription>
                          </DialogHeader>
                          {selectedCashRegister && (
                            <CashRegisterConfig
                              cashRegisterId={selectedCashRegister.id}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteCashRegister(cashRegister.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}