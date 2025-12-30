import { db} from '../src/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';

type QuestaoRespondida = {
  index: number;
  acertou: boolean;
  tentativas: number;
};

export const syncOfflineData = async () => {
    try {
        const progressData = await AsyncStorage.getItem('@offline_progress');
        if (!progressData) return;

        const offlineProgress = JSON.parse(progressData);
        const userId = await AsyncStorage.getItem("userId");

        if (!userId) return;

        for (const [activityId, data] of Object.entries(offlineProgress)) {
          
            try {

                const { materia, progresso, concluida } = data as any;
                const progressoRef = doc(db, 'progresso', userId, materia, activityId);
                const todasAcertadas = (progresso.questoesRespondidas as QuestaoRespondida[]).every((q: QuestaoRespondida) => q.acertou);

                await setDoc(progressoRef, {
                  
                    concluida,
                    estrelas: todasAcertadas ? 1 : 0,
                    xp: progresso.acertos * 10,
                    tentativas: progresso.tentativas,
                    acertos: progresso.acertos,
                    dataConclusao: new Date(),
                   
                    questoes: (progresso.questoesRespondidas as QuestaoRespondida[]).reduce(
                        
                        (acc, questao: QuestaoRespondida) => {
                            
                            acc[questao.index] = {
                               
                                concluida: questao.acertou,
                                tentativas: questao.tentativas,
                                ultimaTentativa: new Date()

                            };     

                            return acc;
                        }, {} as Record<number, any>
                    )
                }, { merge: true });

                const usuarioRef = doc(db, 'usuarios', userId);
               
                await updateDoc(usuarioRef, {
                    xp: increment(progresso.acertos * 10),
                    estrelas: increment(todasAcertadas ? 1 : 0),
                });

                await AsyncStorage.removeItem('@offline_progress');
                
            } catch (error) {
                console.error(`Erro ao sincronizar atividade ${activityId}:`, error);
            }
        }
        
    } catch (error) {
        console.error('Erro na sincronização offline:', error);
    }
};
