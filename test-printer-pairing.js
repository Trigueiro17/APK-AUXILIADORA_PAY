const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Script para verificar se impressoras térmicas estão pareadas no dispositivo Android
 */

async function checkPairedPrinters() {
  console.log('🔍 Verificando impressoras térmicas pareadas...');
  console.log('=' .repeat(60));
  
  try {
    // 1. Verificar se o ADB está funcionando
    console.log('📱 Verificando conexão ADB...');
    const { stdout: devices } = await execAsync('adb devices');
    console.log('Dispositivos conectados:');
    console.log(devices);
    
    if (!devices.includes('device')) {
      console.log('❌ Nenhum dispositivo Android conectado via ADB');
      console.log('💡 Conecte seu dispositivo Android e habilite a depuração USB');
      return;
    }
    
    // 2. Verificar se o Bluetooth está habilitado
    console.log('\n📡 Verificando status do Bluetooth...');
    try {
      const { stdout: bluetoothStatus } = await execAsync('adb shell settings get global bluetooth_on');
      const isBluetoothOn = bluetoothStatus.trim() === '1';
      console.log(`Bluetooth habilitado: ${isBluetoothOn ? '✅ Sim' : '❌ Não'}`);
      
      if (!isBluetoothOn) {
        console.log('💡 Habilite o Bluetooth no dispositivo Android');
        return;
      }
    } catch (error) {
      console.log('⚠️ Não foi possível verificar o status do Bluetooth');
    }
    
    // 3. Listar dispositivos Bluetooth pareados
    console.log('\n🔗 Listando dispositivos Bluetooth pareados...');
    try {
      const { stdout: bluetoothDump } = await execAsync('adb shell dumpsys bluetooth_manager');
      
      // Procurar pela seção de dispositivos pareados
      const lines = bluetoothDump.split('\n');
      let foundBondedSection = false;
      let bondedDevicesLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('Bonded devices:') || line.includes('Paired devices:')) {
          foundBondedSection = true;
          bondedDevicesLines.push(line);
          // Pegar as próximas 20 linhas
          for (let j = 1; j <= 20 && (i + j) < lines.length; j++) {
            bondedDevicesLines.push(lines[i + j]);
          }
          break;
        }
      }
      
      const pairedDevices = bondedDevicesLines.join('\n');
      console.log('Dispositivos pareados:');
      console.log(pairedDevices || 'Nenhum dispositivo pareado encontrado');
      
      // Procurar por palavras-chave de impressoras
      const printerKeywords = [
        'printer', 'print', 'thermal', 'pos', 'receipt', 
        'impressora', 'termica', 'cupom', 'ticket',
        'rp', 'tm', 'ep', 'zj', 'xp', 'mpt', 'mini'
      ];
      
      const foundPrinters = [];
      const pairedLines = pairedDevices.split('\n');
      
      for (const line of pairedLines) {
        const lowerLine = line.toLowerCase();
        for (const keyword of printerKeywords) {
          if (lowerLine.includes(keyword)) {
            foundPrinters.push(line.trim());
            break;
          }
        }
      }
      
      if (foundPrinters.length > 0) {
        console.log('\n🖨️ Possíveis impressoras encontradas:');
        foundPrinters.forEach((printer, index) => {
          console.log(`${index + 1}. ${printer}`);
        });
      } else {
        console.log('\n❌ Nenhuma impressora térmica encontrada nos dispositivos pareados');
        console.log('💡 Verifique se a impressora está pareada nas configurações do Bluetooth');
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao listar dispositivos pareados:', error.message);
    }
    
    // 4. Verificar aplicativos com permissões Bluetooth
    console.log('\n🔐 Verificando permissões Bluetooth do aplicativo...');
    try {
      const packageName = 'com.auxiliadorapay'; // Ajuste conforme necessário
      const { stdout: packageDump } = await execAsync(`adb shell dumpsys package ${packageName}`);
      
      // Procurar por linhas que contenham 'permission' e sejam relacionadas ao Bluetooth
      const lines = packageDump.split('\n');
      const bluetoothPermissions = lines.filter(line => {
        const lowerLine = line.toLowerCase();
        return lowerLine.includes('permission') && 
               (lowerLine.includes('bluetooth') || lowerLine.includes('location'));
      });
      
      if (bluetoothPermissions.length > 0) {
        console.log('Permissões Bluetooth do aplicativo:');
        bluetoothPermissions.forEach(permission => {
          console.log(`  ${permission.trim()}`);
        });
      } else {
        console.log('❌ Nenhuma permissão Bluetooth encontrada para o aplicativo');
        console.log('💡 Verifique se o aplicativo está instalado no dispositivo');
      }
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar permissões do aplicativo:', error.message);
      console.log('💡 O aplicativo pode não estar instalado no dispositivo conectado');
    }
    
    // 5. Dicas de solução de problemas
    console.log('\n💡 Dicas para solução de problemas:');
    console.log('1. Certifique-se de que a impressora térmica está ligada');
    console.log('2. Pareie a impressora manualmente nas configurações do Bluetooth');
    console.log('3. Verifique se a impressora aparece como "Pareado" (não apenas "Disponível")');
    console.log('4. Teste a impressora com outros aplicativos para confirmar o funcionamento');
    console.log('5. Reinicie o Bluetooth do dispositivo se necessário');
    console.log('6. Verifique se o aplicativo tem todas as permissões Bluetooth necessárias');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.log('\n💡 Certifique-se de que:');
    console.log('- O ADB está instalado e no PATH');
    console.log('- O dispositivo Android está conectado via USB');
    console.log('- A depuração USB está habilitada no dispositivo');
  }
}

// Executar o script
checkPairedPrinters().catch(console.error);