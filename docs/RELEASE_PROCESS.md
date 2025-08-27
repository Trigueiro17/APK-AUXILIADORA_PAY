# Processo de Release - Auxiliadora Pay

Este documento descreve o processo para criar e publicar novas releases do Auxiliadora Pay.

## 📋 Pré-requisitos

- Node.js instalado
- Ambiente de desenvolvimento configurado
- Acesso ao repositório
- Permissões para criar tags e releases

## 🚀 Criando uma Nova Release

### Método Automático (Recomendado)

1. **Execute o script de release:**
   ```bash
   node scripts/create-release.js [major|minor|patch]
   ```

   - `patch`: Para correções (1.6.0 → 1.6.1)
   - `minor`: Para novas funcionalidades (1.6.0 → 1.7.0)
   - `major`: Para mudanças incompatíveis (1.6.0 → 2.0.0)

2. **Preencha a documentação:**
   - Edite `RELEASE_NOTES_vX.X.X.md`
   - Atualize `CHANGELOG.md`

3. **Teste a aplicação:**
   ```bash
   npm run android
   # ou
   npm run ios
   ```

4. **Commit e tag:**
   ```bash
   git add .
   git commit -m "Release v1.X.X"
   git tag v1.X.X
   git push origin main
   git push origin v1.X.X
   ```

### Método Manual

1. **Atualize a versão no package.json:**
   ```json
   {
     "version": "1.X.X"
   }
   ```

2. **Crie as release notes:**
   - Copie o template de `RELEASE_NOTES_v1.6.0.md`
   - Adapte para a nova versão

3. **Atualize o CHANGELOG.md**

4. **Siga os passos 3-4 do método automático**

## 📝 Estrutura das Release Notes

Cada release deve incluir:

### Seções Obrigatórias
- **Data de Lançamento**
- **Principais Melhorias**
- **Novas Funcionalidades**
- **Melhorias Técnicas**
- **Arquivos Modificados**
- **Como Usar**
- **Compatibilidade**

### Seções Opcionais
- **Correções de Bugs**
- **Problemas Conhecidos**
- **Próximos Passos**
- **Notas de Migração**

## 🏷️ Convenções de Versionamento

Seguimos o [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (1.X.0): Novas funcionalidades compatíveis
- **PATCH** (1.1.X): Correções de bugs compatíveis

### Exemplos
- `1.6.0 → 1.6.1`: Correção de bug na impressora
- `1.6.0 → 1.7.0`: Nova funcionalidade de relatórios
- `1.6.0 → 2.0.0`: Mudança na estrutura da API

## 📦 Tipos de Release

### Release Estável
- Versão principal para produção
- Testada completamente
- Documentação completa
- Exemplo: `v1.6.0`

### Release Candidata (RC)
- Versão de teste antes da estável
- Para validação final
- Exemplo: `v1.6.0-rc.1`

### Release Beta
- Versão de teste com novas funcionalidades
- Pode conter bugs
- Exemplo: `v1.6.0-beta.1`

## 🧪 Checklist de Release

### Antes da Release
- [ ] Todos os testes passando
- [ ] Código revisado
- [ ] Documentação atualizada
- [ ] Versão incrementada
- [ ] Release notes criadas
- [ ] CHANGELOG atualizado

### Durante a Release
- [ ] Build da aplicação executado
- [ ] Testes em dispositivo real
- [ ] Verificação de funcionalidades críticas
- [ ] Commit e tag criados
- [ ] Push para repositório

### Após a Release
- [ ] Release publicada no GitHub
- [ ] Equipe notificada
- [ ] Documentação publicada
- [ ] Monitoramento de issues

## 🔧 Ferramentas Utilizadas

- **Node.js**: Script de automação
- **Git**: Controle de versão e tags
- **GitHub**: Hospedagem e releases
- **Expo**: Build e distribuição
- **React Native**: Framework da aplicação

## 📞 Suporte

Para dúvidas sobre o processo de release:

1. Consulte este documento
2. Verifique releases anteriores como exemplo
3. Entre em contato com a equipe de desenvolvimento

## 📚 Recursos Adicionais

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Expo Release Channels](https://docs.expo.dev/distribution/release-channels/)

---

*Última atualização: Janeiro 2025*