'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { apiClient, User } from '@/lib/api';



export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuários da API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const updatedUser = await apiClient.updateUser(userId, {
        active: !user.active
      });
      
      setUsers(users.map(u => 
        u.id === userId ? updatedUser : u
      ));
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      setError('Erro ao atualizar status do usuário');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      await apiClient.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      setError('Erro ao excluir usuário');
    }
  };







  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários do sistema
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">Todos os perfis</option>
              <option value="ADMIN">Administrador</option>
              <option value="USER">Usuário</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de usuários */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadUsers}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando usuários...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Nenhum usuário encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.active ? "default" : "destructive"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.active}
                          onCheckedChange={() => toggleUserStatus(user.id)}
                        />
                        <Label className="text-sm">Ativo</Label>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteUser(user.id)}
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