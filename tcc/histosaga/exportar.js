import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyD_o7Eo3DDRQfscKZ77FgQj5qpm77souOs",
  authDomain: "histosaga-tcc.firebaseapp.com",
  projectId: "histosaga-tcc"
};

const app = initializeApp(config);
const db = getFirestore(app);

async function explorarFirestoreCompleto() {

  try { 

    const colecoesParaVerificar = [
      'atividades', 'progresso', 'usuarios', 'prehistoria', 'historia'
    ];

    for (const nomeColecao of colecoesParaVerificar) {
      await verificarColecao(nomeColecao);
    }

  } catch (error) {
    console.error('Erro: ', error.message);
  }
}

async function verificarColecao(nomeColecao) {

  try {

    const querySnapshot = await getDocs(collection(db, nomeColecao));
    
    if (querySnapshot.empty) {
      console.log(`\nColeção: ${nomeColecao} - VAZIA ou não existe`);
      return;
    }

    console.log(`\nCOLETÂNEA: ${nomeColecao}`);
    console.log('Documentos encontrados:', querySnapshot.size);
    console.log('-------------------------------------------');

    querySnapshot.forEach((doc, index) => {

      console.log(`\nDOCUMENTO ${index + 1}: ${doc.id}`);
      
      const dados = doc.data();
      const campos = Object.keys(dados);
      
      console.log(`     Campos (${campos.length}):`);
      
      campos.forEach(campo => {

        const valor = dados[campo];
        const tipo = typeof valor;
        const valorExemplo = tipo === 'string' && valor.length > 20 ? valor.substring(0, 20) + '...' : valor;

        console.log(`      • ${campo}: ${tipo} = ${JSON.stringify(valorExemplo)}`);
      });
    });

  } catch (error) {

    if (!error.message.includes('NotFound')) {
      console.log(`\n❌ Erro na coleção ${nomeColecao}:`, error.message);
    }
  }
}

function analisarTipo(valor) {
  if (valor === null) return 'null';
  if (valor instanceof Date) return 'Date';
  if (typeof valor === 'object') return 'object';
  return typeof valor;
}

explorarFirestoreCompleto()
  .then(() => console.log('\n✅ Exploração concluída!'))
  .catch(error => console.error('❌ Falha na exploração:', error));