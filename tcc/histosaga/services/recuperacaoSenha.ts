import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';

export const gerarCodigoVerificacao = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const salvarCodigoVerificacao = async (usuarioId: string, email: string) => {
  
    const codigo = gerarCodigoVerificacao();
    const expiracao = new Date(Date.now() + 10 * 60 * 1000);

    await setDoc(doc(db, 'codigosVerificacao', usuarioId), {
        codigo, email, expiracao, tentativas: 0, usado: false
    });

    return codigo;
};

export const verificarCodigo = async (usuarioId: string, codigoDigitado: string) => {
  
    const docRef = doc(db, 'codigosVerificacao', usuarioId);
    const docSnap = await getDoc(docRef);
  
    if (!docSnap.exists()) {
        return { valido: false, mensagem: 'Código não encontrado' };
    }
 
    const data = docSnap.data();

    if (new Date() > data.expiracao.toDate()) {
        await deleteDoc(docRef);
        return { valido: false, mensagem: 'Código expirado' };
    }

    if (data.tentativas >= 3) {
        await deleteDoc(docRef);
        return { valido: false, mensagem: 'Muitas tentativas inválidas' };
    }

    if (data.codigo !== codigoDigitado) {
        await updateDoc(docRef, { tentativas: data.tentativas + 1});
        return { valido: false, mensagem: 'Código incorreto'};
    }

    await updateDoc(docRef, { usado: true });
    return { valido: true, mensagem: 'Código válido' };
};