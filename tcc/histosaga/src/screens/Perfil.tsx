import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Perfil() {

  const navigation = useNavigation();
 
  const [userData, setUserData] = useState({
    nome: '',
    usuario: '',
    email: '',
    xp: 0,
    estrelas: 0,
    level: 1,
    criadoEm: null as any
  });

  const [estatisticas, setEstatisticas] = useState({
    atividadesConcluidas: 0,
    conteudosEstudados: 0,
    streakAtual: 0,
    estrelas: 0,
  });

  useEffect(() => {
    carregarDadosUsuario();
    carregarEstatisticas();
  }, []);

  const carregarDadosUsuario = async () => {
   
    try {
      
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
     
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
     
      if(userDoc.exists()) {
        
        const data = userDoc.data();
       
        setUserData({
          nome: data.nome || '',
          usuario: data.usuario || '',
          email: data.email || '',
          xp: data.xp || 0,
          estrelas: data.estrelas || 0,
          level: Math.floor((data.xp || 0) / 1000) + 1,
          criadoEm: data.criadoEm || null
        });
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário');
    }
  };
  
  const carregarEstatisticas = async () => {
   
    try {

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const progressoRef = collection(db, 'progresso', userId, 'historia');
      const progressoSnapshot = await getDocs(progressoRef);

      let totalQuestoesCorretas = 0;
      let totalConteudosEstudados = 0;
      let totalEstrelasProgresso = 0;
      
      progressoSnapshot.forEach((doc) => {
       
        const atividadesData = doc.data();

        if (atividadesData.concluida === true) {
          
          totalConteudosEstudados += 1;
          totalQuestoesCorretas += atividadesData.acertos || 0;
          totalEstrelasProgresso += atividadesData.estrelas || 0;
       
        }  
      });

      const userDoc = await getDoc(doc(db, 'usuarios', userId));

      if (userDoc.exists()) {
        
        const userData = userDoc.data();
        
        setEstatisticas({
          atividadesConcluidas: totalQuestoesCorretas,
          conteudosEstudados: totalConteudosEstudados,
          streakAtual: userData?.streak || 0,
          estrelas: userData.estrelas || 0,
        });

        setUserData(prev => ({ ...prev, xp: userData.xp || 0, estrelas: userData.estrelas || 0, level: Math.floor((userData.xp || 0) / 1000) + 1 }));
      
      }
    
    } catch (error) {
      console.error('Erro ao carregar estatísticas: ', error);
    }
  }

  const atualizarStreak = async () => {
   
    try {
      
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const hoje = new Date();
      const ontem = new Date(hoje);
     
      ontem.setDate(hoje.getDate() -1);

      const formatarData = (data: Date) => data.toISOString().split('T')[0];
      const hojeFormatado = formatarData(hoje);
      const ontemFormatado = formatarData(ontem);

      const ultimoAcesso = userData.ultimoAcesso ? new Date(userData.ultimoAcesso.seconds * 1000) : null;
      const ultimoAcessoFormatado = ultimoAcesso ? formatarData(ultimoAcesso) : null;

      let novaStreak = userData.streak || 0;

      if (!ultimoAcessoFormatado) {
        novaStreak = 1;
    
      } else if (ultimoAcessoFormatado === ontemFormatado) {
        novaStreak += 1;
     
      } else if (ultimoAcessoFormatado === hojeFormatado) {
        novaStreak = userData.streak || 0;
     
      } else {
        novaStreak = 1;
      }

      const userRef = doc(db, 'usuarios', userId);
    
      await updateDoc(userRef, {
        streak: novaStreak,
        ultimoAcesso: new Date()
      });

      setEstatisticas(prev => ({ ...prev, streakAtual: novaStreak}));

    } catch (error) {
      console.error('Erro ao atualizar streak:', error);
    }
  };

  useEffect(() => {
   
    const carregarTudo = async () => {
      await carregarDadosUsuario();
      await carregarEstatisticas();
      await atualizarStreak();
    };

    carregarTudo();

  }, []);

  useEffect(() => {
   
    const unsubscribe = navigation.addListener('focus', () => {
      carregarDadosUsuario();
      carregarEstatisticas();
    });
    
    return unsubscribe;
    
  }, [navigation]);

  const formatarData = (timestamp: any) => {
    
    if (!timestamp) return 'carregando...';
    
    try {
    
      if (timestamp.seconds) {
       
        const data = new Date(timestamp.seconds * 1000);
       
        return data.toLocaleDateString('pt-BR', {
      
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
      
        });
      
      }
      const data = new Date(timestamp);
      
      return data.toLocaleDateString('pt-BR', {
      
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      
      });
    
    } catch (error) {
      return 'data inválida';
    }
  };

  const xpProximoLevel = 1000;
  const xpLevelAtual = userData.xp % xpProximoLevel;
  const porcentagemProgresso = (xpLevelAtual / xpProximoLevel) * 100;
  
  return (
  
  <ScrollView style={styles.container}>

    <View style={styles.header}>
       <View style={styles.perfilContainer}>
        
        <View style={styles.iconContainer}>
          <Image source={require('../../assets/images/icon-perfil.png')} style={styles.iconImagem} resizeMode="contain" /> 
        </View>

        <View style={styles.infoContainer}>

          <View style={styles.nomeContainer}>
            <Text style={styles.nome}>{userData.nome}</Text>
          </View>

          <View style={styles.usuarioContainer}>
            <Text style={styles.usuario}>@{userData.usuario}</Text>
          </View>

          <View style={styles.dataContainer}>
            <Text style={styles.data}>Aqui desde {formatarData(userData.criadoEm)}</Text>
          </View>

        </View>
      </View>  
    </View>

    <View style={styles.levelContainer}>
      
      <Text style={styles.levelText}>Level {userData.level}</Text>
      
      <View style={styles.xpContainer}>
        
        <View style={styles.xpBar}>
          <View style={[styles.xpProgresso, { width: `${porcentagemProgresso}%` }]} />
        </View>
        
        <Text style={styles.xpText}> {xpLevelAtual}/{xpProximoLevel} XP </Text>
      
      </View>
    </View>

    <View style={styles.statsContainer}>
      
      <Text style={styles.statsTitulo}>Estatísticas</Text>
        
      <View style={styles.statsGrid}>
          
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{estatisticas.atividadesConcluidas}</Text>
          <Text style={styles.statLabel}> Questões acertadas </Text>
        </View>
          
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{estatisticas.conteudosEstudados}</Text>
          <Text style={styles.statLabel}>Conteúdos estudados</Text>
        </View>
          
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{userData.estrelas}</Text>
          <Text style={styles.statLabel}> Estrelas conquistadasc</Text>
        </View>
          
        <View style={styles.statItem}>
          <Text style={styles.statNumero}>{estatisticas.streakAtual}</Text>
          <Text style={styles.statLabel}> Dias seguidos </Text>
        </View>

      </View>
    </View>

    <TouchableOpacity style={styles.botao} onPress={() => navigation.navigate('EditarPerfil' as never)}>
      <Text style={styles.botaoTexto}> Editar Perfil </Text>
    </TouchableOpacity>

  </ScrollView>
  );
}

const styles = StyleSheet.create({
  
  perfilContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },

   data: {
    color: '#B8B5FF',
    fontSize: 14, 
    fontFamily: 'InriaSans_400Regular',
  },

  iconContainer: {
    marginRight: 15,
  },

  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  iconImagem: {
    width: 90, 
    height: 90,
  },

  nomeContainer: {
    marginBottom: 5,
  },

  usuarioContainer: {
    marginBottom: 5,
  },

  dataContainer: {

  },

  nome: {
    color: '#8581FF',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
  },
  
  usuario: {
    color: 'white',
    fontSize: 20, 
    fontFamily: 'Jersey10_400Regular',
  },

  container: {
    flex: 1,
    backgroundColor: '#221377',
    padding: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  
  levelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    alignItems: 'center',
  },

  levelText: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 10,
  },

  xpContainer: {
    width: '100%',
    alignItems: 'center',
  },

  xpBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },

  xpProgresso: {
    height: '100%',
    backgroundColor: '#00E69D',
    borderRadius: 6,
  },

  xpText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'InriaSans_400Regular',
  },

  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
  },

  statsTitulo: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 15,
    textAlign: 'center',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
  },

  statNumero: {
    color: '#00E69D',
    fontSize: 28,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 5,
  },

  statLabel: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'InriaSans_400Regular',
    textAlign: 'center',
  },

  botao: {
    backgroundColor: '#8581FF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 10,
  },

  botaoTexto: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
  },
});