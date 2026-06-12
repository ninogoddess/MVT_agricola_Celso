/**
 * Script de prueba para verificar conexión con Mercado Pago
 * 
 * Ejecutar con: npx tsx scripts/test-mercadopago.ts
 */

import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

if (!ACCESS_TOKEN) {
  console.error('❌ Error: MERCADOPAGO_ACCESS_TOKEN no está configurado');
  process.exit(1);
}

console.log('🔍 Verificando credenciales de Mercado Pago...\n');
console.log('Access Token:', ACCESS_TOKEN.substring(0, 20) + '...');
console.log('Tipo:', ACCESS_TOKEN.startsWith('TEST-') ? '🧪 TEST (Sandbox)' : '🚀 PRODUCCIÓN');

const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
});

async function testPreApproval() {
  console.log('\n📋 Creando PreApproval de prueba...');
  
  try {
    const preApproval = new PreApproval(client);
    
    const result = await preApproval.create({
      body: {
        reason: 'Test de Suscripción - Plan Pro',
        external_reference: JSON.stringify({ 
          tenantId: 'test-tenant-123', 
          planId: 'pro' 
        }),
        payer_email: 'test_user_12345@testuser.com', // ← Usa tu email de prueba aquí
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: 2990,
          currency_id: 'CLP',
        },
        back_url: 'https://agrencia.vercel.app/dashboard',
        status: 'pending',
      },
    });

    console.log('\n✅ PreApproval creado exitosamente!\n');
    console.log('ID:', result.id);
    console.log('Status:', result.status);
    console.log('Init Point (URL de pago):', result.init_point);
    console.log('\n🔗 Abre esta URL para probar el pago:');
    console.log(result.init_point);
    
    return result;
    
  } catch (error: any) {
    console.error('\n❌ Error al crear PreApproval:');
    console.error('Mensaje:', error.message);
    console.error('Causa:', error.cause);
    
    if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
      console.error('\n💡 Solución: Verifica que tu ACCESS_TOKEN sea correcto');
    }
    
    if (error.message?.includes('preapproval') || error.message?.includes('subscription')) {
      console.error('\n💡 Solución: Tu cuenta MP puede no tener habilitadas las suscripciones');
      console.error('   Contacta soporte de Mercado Pago o prueba con pagos únicos (Preference)');
    }
    
    throw error;
  }
}

// Ejecutar prueba
testPreApproval()
  .then(() => {
    console.log('\n✅ Todas las pruebas pasaron!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Prueba fallida');
    process.exit(1);
  });
