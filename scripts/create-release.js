#!/usr/bin/env node

/**
 * Script para criar uma nova release do Auxiliadora Pay
 * Uso: node scripts/create-release.js [major|minor|patch]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função para incrementar versão
function incrementVersion(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Função para obter data atual formatada
function getCurrentDate() {
  return new Date().toISOString().split('T')[0];
}

// Função principal
function createRelease() {
  try {
    const versionType = process.argv[2] || 'patch';
    
    // Ler package.json atual
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;
    
    // Calcular nova versão
    const newVersion = incrementVersion(currentVersion, versionType);
    
    console.log(`🚀 Criando release ${currentVersion} → ${newVersion}`);
    
    // Atualizar package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ package.json atualizado para v${newVersion}`);
    
    // Criar template de release notes
    const releaseNotesPath = path.join(__dirname, '..', `RELEASE_NOTES_v${newVersion}.md`);
    const releaseNotesTemplate = `# Release Notes - Auxiliadora Pay v${newVersion}

**Data de Lançamento:** ${getCurrentDate()}

## 🎯 Principais Melhorias

### ✨ Novas Funcionalidades
- [ ] Adicionar descrição das novas funcionalidades

### 🔧 Melhorias
- [ ] Adicionar descrição das melhorias

### 🐛 Correções
- [ ] Adicionar descrição das correções

## 📱 Compatibilidade
- **Versão:** ${newVersion}
- **Android:** 6.0+
- **Tecnologias:** React Native, Expo

---

*Preencha as seções acima com as mudanças desta release*
`;
    
    fs.writeFileSync(releaseNotesPath, releaseNotesTemplate);
    console.log(`✅ Release notes criadas: RELEASE_NOTES_v${newVersion}.md`);
    
    // Atualizar CHANGELOG.md
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
    if (fs.existsSync(changelogPath)) {
      const changelog = fs.readFileSync(changelogPath, 'utf8');
      const newEntry = `## [${newVersion}] - ${getCurrentDate()}

### Adicionado
- [ ] Adicionar novas funcionalidades

### Melhorado
- [ ] Adicionar melhorias

### Corrigido
- [ ] Adicionar correções

---

`;
      
      const updatedChangelog = changelog.replace(
        '# Changelog\n\nTodas as mudanças notáveis neste projeto serão documentadas neste arquivo.\n\n',
        `# Changelog\n\nTodas as mudanças notáveis neste projeto serão documentadas neste arquivo.\n\n${newEntry}`
      );
      
      fs.writeFileSync(changelogPath, updatedChangelog);
      console.log(`✅ CHANGELOG.md atualizado`);
    }
    
    console.log(`\n🎉 Release v${newVersion} criada com sucesso!`);
    console.log(`\n📝 Próximos passos:`);
    console.log(`1. Preencher RELEASE_NOTES_v${newVersion}.md`);
    console.log(`2. Atualizar CHANGELOG.md`);
    console.log(`3. Testar a aplicação`);
    console.log(`4. Fazer commit das mudanças`);
    console.log(`5. Criar tag: git tag v${newVersion}`);
    console.log(`6. Fazer push: git push origin v${newVersion}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar release:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createRelease();
}

module.exports = { createRelease, incrementVersion };