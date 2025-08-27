/**
 * Script de diagnóstico para problemas de detecção de impressora térmica
 * Execute com: node debug-printer.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando diagnóstico de impressora térmica...');
console.log('=' .repeat(50));

// Função para executar comandos ADB
function runAdbCommand(command) {
  return new Promise((resolve, reject) => {
    exec(`adb ${command}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// Verificar dispositivos Bluetooth pareados via ADB
async function checkBluetoothDevices() {
  try {
    console.log('📱 Verificando dispositivos Bluetooth pareados...');
    
    // Verificar se o Bluetooth está habilitado
    const bluetoothStatus = await runAdbCommand('shell settings get global bluetooth_on');
    console.log(`Bluetooth habilitado: ${bluetoothStatus === '1' ? 'SIM' : 'NÃO'}`);
    
    if (bluetoothStatus !== '1') {
      console.log('⚠️ Bluetooth está desabilitado. Habilite o Bluetooth e tente novamente.');
      return;
    }
    
    // Listar dispositivos Bluetooth pareados
    console.log('\n📋 Dispositivos Bluetooth pareados:');
    const pairedDevices = await runAdbCommand('shell dumpsys bluetooth_manager | grep "Bonded devices:" -A 20');
    console.log(pairedDevices);
    
    // Verificar serviços Bluetooth ativos
    console.log('\n🔧 Serviços Bluetooth ativos:');
    const bluetoothServices = await runAdbCommand('shell dumpsys bluetooth_manager | grep "Profile" -A 5');
    console.log(bluetoothServices);
    
  } catch (error) {
    console.error('❌ Erro ao verificar Bluetooth via ADB:', error.message);
    console.log('💡 Certifique-se de que:');
    console.log('   - O dispositivo Android está conectado via USB');
    console.log('   - A depuração USB está habilitada');
    console.log('   - O ADB está instalado e no PATH');
  }
}

// Verificar permissões do aplicativo
async function checkAppPermissions() {
  try {
    console.log('\n🔐 Verificando permissões do aplicativo...');
    
    const packageName = 'com.auxiliadorapay'; // Ajuste conforme necessário
    
    const permissions = [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION'
    ];
    
    for (const permission of permissions) {
      try {
        const status = await runAdbCommand(`shell dumpsys package ${packageName} | grep "${permission}"`);
        console.log(`${permission}: ${status ? 'CONCEDIDA' : 'NÃO ENCONTRADA'}`);
      } catch (error) {
        console.log(`${permission}: ERRO AO VERIFICAR`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error.message);
  }
}

// Verificar logs do aplicativo
async function checkAppLogs() {
  try {
    console.log('\n📝 Verificando logs recentes do aplicativo...');
    
    // Limpar logs antigos
    await runAdbCommand('logcat -c');
    
    console.log('Aguarde 5 segundos para capturar logs...');
    
    // Capturar logs por 5 segundos
    setTimeout(async () => {
      try {
        const logs = await runAdbCommand('logcat -d | grep -i "bluetooth\|printer\|escpos"');
        console.log('\n📋 Logs relacionados a Bluetooth/Impressora:');
        console.log(logs || 'Nenhum log encontrado');
      } catch (error) {
        console.log('❌ Erro ao capturar logs:', error.message);
      }
    }, 5000);
    
  } catch (error) {
    console.error('❌ Erro ao verificar logs:', error.message);
  }
}

// Verificar configurações do sistema
function checkSystemInfo() {
  console.log('\n🔧 Informações do sistema:');
  console.log(`Node.js: ${process.version}`);
  console.log(`Plataforma: ${process.platform}`);
  console.log(`Arquitetura: ${process.arch}`);
  
  // Verificar se o projeto React Native existe
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`Projeto: ${packageJson.name} v${packageJson.version}`);
    
    // Verificar dependências Bluetooth
    const bluetoothDeps = Object.keys(packageJson.dependencies || {})
      .filter(dep => dep.includes('bluetooth') || dep.includes('ble'));
    
    console.log('\n📦 Dependências Bluetooth encontradas:');
    bluetoothDeps.forEach(dep => {
      console.log(`  - ${dep}: ${packageJson.dependencies[dep]}`);
    });
  }
}

// Executar diagnóstico completo
async function runDiagnostic() {
  console.log('🚀 Executando diagnóstico completo...\n');
  
  checkSystemInfo();
  await checkBluetoothDevices();
  await checkAppPermissions();
  await checkAppLogs();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Diagnóstico concluído!');
  console.log('\n💡 Dicas para resolver problemas:');
  console.log('1. Certifique-se de que a impressora está ligada e em modo pareamento');
  console.log('2. Verifique se a impressora está pareada nas configurações do Android');
  console.log('3. Confirme que todas as permissões Bluetooth foram concedidas');
  console.log('4. Tente reiniciar o Bluetooth do dispositivo');
  console.log('5. Verifique se o nome da impressora contém palavras-chave reconhecidas:');
  console.log('   printer, print, thermal, pos, receipt, impressora, termica, mpt, mini');
}

// Executar diagnóstico
runDiagnostic().catch(console.error);