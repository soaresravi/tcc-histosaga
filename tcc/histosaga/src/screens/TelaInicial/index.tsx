import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, ScrollView } from 'react-native';

import { useNavigation, useRoute, useIsFocused  } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import { useFonts as usePress, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts as useJersey, Jersey10_400Regular } from '@expo-google-fonts/jersey-10';

import { db } from '../../config/firebase';
import AsyncStorage from "@react-native-async-storage/async-storage";

export type RootStackParamList = {
  Apresentacao: undefined;
  Cadastro: undefined;
  Login: undefined;
  telaInicial: { materia?: string };
  TelaAtividades: { materia: string; atividadeId: string };
  Configuracoes: undefined;
  Notificacoes: undefined;     
  EditarPerfil: undefined;      
  RedefinirSenha: undefined;
};

const icons: Record<string, any> = {
  historia: require("../../../assets/images/historia.png"),
  geografia: require("../../../assets/images/estrela.png"),
  sociologia: require("../../../assets/images/setting.png"),
};

const iconesAtvidades: Record<string, any> = {
  'Pré-História': require('../../../assets/images/fire.png'),
  'Antiguidade Oriental': require('../../../assets/images/parchment.png'),
  'Grécia Antiga': require('../../../assets/images/man.png'),
  'Roma Antiga': require('../../../assets/images/building.png'),
  'Idade Média': require('../../../assets/images/castle.png'),
  'Idade Moderna': require('../../../assets/images/history.png'),
  'Idade Contemporânea': require('../../../assets/images/earth.png'),
  'Brasil Pré-Cabralino': require('../../../assets/images/dancer.png'),
  'Brasil Pré-Colonial': require('../../../assets/images/brazil.png'),
  'Brasil Colonial': require('../../../assets/images/train.png'),
  'Brasil Imperial': require('../../../assets/images/king.png'),
  'Brasil República': require('../../../assets/images/washington.png'),
};

const mapearIdParaFirestore = (id: string): string => {
  
  
  const mapeamento: Record<string, string> = {
   
    'prehistoria': 'prehistoria',
    'antiguidadeoriental': 'antiguidade-oriental',
    'greciaantiga': 'grecia-antiga', 
    'romaantiga': 'roma-antiga',
    'idademedia': 'idade-media',
    'idademoderna': 'idade-moderna',
    'idadecontemporanea': 'idade-contemporanea',
    'brasilprecabralino': 'brasil-precabralino',
    'brasilprecolonial': 'brasil-precolonial',
    'brasilcolonial': 'brasil-colonial',
    'brasilimperial': 'brasil-imperial',
    'brasilrepublica': 'brasil-republica',
    'mitologia': 'mitologia',
    'historiaafrica': 'historia-africa',
    'historiaarte': 'historia-arte',
    'historiaamerica': 'historia-america',
    'historiamedieval': 'historia-medieval'
    
  };
  
  return mapeamento[id] || id;
};

type TelaInicialRouteProp = RouteProp<RootStackParamList, "telaInicial">;

export default function TelaInicial() {
 
  const route = useRoute<TelaInicialRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "telaInicial">>();
  const materia = route.params?.materia ?? "historia";

  const [stars, setStars] = useState(0);
  const [xp, setXp] = useState(0);
  const isFocused = useIsFocused();

  const [progresso, setProgresso] = useState<Record<string, any>>({});
  const [atividades, setAtividades] = useState<any[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
   
    const carregarTudo = async () => {
      
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
      if (!id) return;
      
      try {

        const userDoc = await getDoc(doc(db, 'usuarios', id));
       
        if (userDoc.exists()) {  
          
          const userData = userDoc.data();
          
          setStars(userData.estrelas || 0);
          setXp(userData.xp || 0);

        }

        await carregarProgresso(id);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }

    };

    if (isFocused) {
      carregarTudo();
    }

  }, [isFocused, materia]); 
  
  const carregarProgresso = async (userId: string) => {
   
    try {

      const progressoRef = collection(db, 'progresso', userId, materia);
      const snapshot = await getDocs(progressoRef);
    
      const progressoData: Record<string, any> = {};
    
      snapshot.forEach(doc => {
        progressoData[doc.id] = doc.data();
        console.log(`Progresso carregado para ${doc.id}:`, doc.data());
      });

      setProgresso(progressoData);
      await carregarAtividades();
      
    } catch (error) {
      console.error('Erro ao carregar progresso: ', error);
      setProgresso({});
    }
  };

  const agruparAtividades = (atividades: any[]) => {
  
  const conteudos = ['historiageral', 'historiabrasil', 'especiais'];
  const grupos = [];
  
  for (const conteudo of conteudos) {
    
    const atividadesDoConteudo = atividades.filter(a => a.conteudo === conteudo);
    
    if (atividadesDoConteudo.length > 0) {

      grupos.push([atividadesDoConteudo[0]]);
      
      for (let i = 1; i < atividadesDoConteudo.length; i += 2) {
        const par = atividadesDoConteudo.slice(i, i + 2);
        grupos.push(par);
      }
      
    }
  }
  
  return grupos;
  };

  const carregarAtividades = async () => {
 
    try {
 
      const atividadesRef = collection(db, 'atividades');
      const q = query(atividadesRef, where('materia','==',materia));
      const snapshot = await getDocs(q);

      const atividadesData = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data()
      }));

      const atividadesOrdem = (atividadesData as any[]).sort((a: any, b: any) => {
        const posA = a.posicao || 0;
        const posB = b.posicao || 0;
        return posA - posB;
      });

      setAtividades(atividadesOrdem);

    } catch (error) {
      console.error('Erro ao carregar atividades.', error);
    }
  };

  const abrirAtividade = (atividadeId: string) => {

    const idFirestore = mapearIdParaFirestore(atividadeId);
  
    console.log('ABRINDO ATIVIDADE:', { 
      idRecebido: atividadeId, 
      idFirestore: idFirestore 
    });
  
    navigation.navigate("TelaAtividades", {
      materia, 
      atividadeId: idFirestore,
    });
  };
  
  const bloqueado = (atividadeId: string, index: number) => {
    
    console.log(`Atividade: ${atividadeId} | Índice: ${index}`);
    
    if (index === 0) {
      
      console.log('Primeira atividade: Liberada');
      return false;

    }
    
    const atividadeAnterior = atividades[index - 1];
    
    if (!atividadeAnterior) {
      
      console.log('Atividade anterior não encontrada');
      return true;

    }
    
    const idAnteriorMapeado = mapearIdParaFirestore(atividadeAnterior.id);
    const progressoAnterior = progresso[idAnteriorMapeado];
    
    console.log(`ID anterior original: ${atividadeAnterior.id}`);
    console.log(`ID anterior mapeado: ${idAnteriorMapeado}`);
    console.log(`Progresso completo da anterior:`, progressoAnterior);
  
    const anteriorConcluida = progressoAnterior?.concluida;

    console.log(`Anterior: ${atividadeAnterior.titulo} (${atividadeAnterior.id})`);
    console.log(`Concluída: ${anteriorConcluida}`);
    console.log(`Status: ${anteriorConcluida ? 'LIBERADA' : 'BLOQUEADA'}`);

    return !anteriorConcluida;

  };

  const [showMaterias, setShowMaterias] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const drawerHeight = useRef(new Animated.Value(0)).current;

  const toggleMaterias = () => {

    if (showMaterias) {

      Animated.parallel([
        Animated.timing(drawerHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),

      ]).start(() => setShowMaterias(false));

    } else {

      setShowMaterias(true);

        Animated.parallel([
          Animated.timing(drawerHeight, {
            toValue: 100,
            duration: 300,
            useNativeDriver: false,
          }),

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })

        ]).start();
    }
  };

  const selecionarMateria = (materiaId: string) => {
    toggleMaterias();
    navigation.setParams({ materia: materiaId});
  };

  const materiasConfig = [
    
    { id: "historia", label: "Hist", color: "#8B4C00", selectedColor: '#6C3B00', },
    { id: "geografia", label: "Geo", color: '#00E69D', selectedColor: '#00BB80' },
    { id: "sociologia", label: "Socio", color: '#FF0000', selectedColor: '#BF0000' },

  ];

  const [pressLoaded] = usePress({ PressStart2P_400Regular });
  const [jerseyLoaded] = useJersey({ Jersey10_400Regular });

  if (!pressLoaded || !jerseyLoaded) return null;

  return (
    
    <View style={styles.container}>
      
      {showMaterias && (
       
       <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={toggleMaterias} activeOpacity={1} />
        </Animated.View>

      )}
      
      <View style={styles.header}>
        
        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
          
          <TouchableOpacity onPress={toggleMaterias}>
              <Image source={icons[materia]} style={{ width: 30, height: 30, marginRight: 8 }} />
          </TouchableOpacity>
          
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center'}}>

          <Image source={require("../../../assets/images/estrela.png")} style={{ width: 30, height: 30 }} />
          <Text style={{color: 'white', fontSize: 30, fontFamily: 'Jersey10_400Regular'}}> {stars} </Text>

          <TouchableOpacity onPress={() => navigation.navigate("Configuracoes") }>
            <Image source={require("../../../assets/images/setting.png")} style={{ width: 25, height: 25, marginLeft: 10}} />
          </TouchableOpacity>
          
        </View>
      </View>
      
      <Animated.View style={{backgroundColor: '#221377', overflow: 'hidden', zIndex: 999, height: drawerHeight }}>
        
        <View style={{ padding: 15, alignItems: 'center' }}>
          <View style={styles.materiasRow}>

            {materiasConfig.map(materiaItem => (
              
              <TouchableOpacity key={materiaItem.id} style={[ styles.materiaBotao, { backgroundColor: materiaItem.color },
              materia === materiaItem.id && { backgroundColor : materiaItem.selectedColor, borderColor: 'white'}]}
              onPress={() => selecionarMateria(materiaItem.id)}>
                
                 <Text style={{ color: 'white', fontSize: 40, fontFamily: 'Jersey10_400Regular', textAlign: 'center'}}> {materiaItem.label}</Text>
             
              </TouchableOpacity>
            ))}

          </View>
        </View>
      </Animated.View>
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <View style={styles.atividades}>
          
          {agruparAtividades(atividades).map((grupo, grupoIndex) => (
            
            <View key={grupoIndex} style={[ styles.grupoAtividades, grupo.length === 1 && styles.grupoUnico ]}>
              
              {grupo.map((atividade, indexNoGrupo) => {
                
                const indexGlobal = atividades.findIndex(a => a.id === atividade.id);
                const block = bloqueado(atividade.id, indexGlobal);
                const concluido = progresso[atividade.id]?.concluido;
                const ehSozinho = grupo.length === 1;
                
                return (
                
                <View key={atividade.id} style={styles.atividadeContainer}>
                  
                  <TouchableOpacity style={[ styles.circulo, ehSozinho && styles.circuloGrande,block && styles.circuloBlock, concluido]}
                  disabled={block} onPress={() => abrirAtividade(atividade.id)}>
                    
                    <Image source={iconesAtvidades[atividade.titulo]} style={[ styles.icone, ehSozinho && styles.iconeGrande]} />
                    
                  </TouchableOpacity>
                  
                  <Text style={[ styles.titulo, ehSozinho && styles.tituloGrande ]}> {atividade.titulo} </Text>
                </View>  
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: '#221377',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 20,
    zIndex: 1000,
    backgroundColor: '#221377'
  },

  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998
  },

  materiasRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10
  },

  materiasDrawer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right:0,
    backgroundColor: 'white',
    zIndex: 999,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 3
  },

  materiaBotao: {
    backgroundColor: '#4D48C8',
    padding: 12,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    marginHorizontal: 5
  },

  materia: { color: "white", fontSize: 22, fontWeight: "bold"},
  
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  
  atividades: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  
  grupoAtividades: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
    minHeight: 150,
  },
  
  grupoUnico: {
    justifyContent: 'center',
  },
  
  atividadeContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
    width: 140,
  },
  
  circulo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  circuloGrande: {
    width: 130,
    height: 130,
    borderRadius: 65
  },
  
  icone: {
    width: 50,
    height: 50,
    resizeMode: 'contain'
  },
  
  iconeGrande: {
    width: 70,
    height: 70,
  },
  
  titulo: {
    color: 'white',
    fontSize: 25,
    textAlign: 'center',
    fontFamily: 'Jersey10_400Regular',
    maxWidth: 120,
  },
  
  tituloGrande: {
    fontSize: 25,
  },
  
  circuloBlock: {
    backgroundColor: '#555',
    opacity: 0.6,
  },

});