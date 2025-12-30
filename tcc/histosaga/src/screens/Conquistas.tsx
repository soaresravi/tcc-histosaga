import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function Conquistas() {
  
  const [conquistas, setConquistas] = useState([
    
    { 
      id: 1, 
      nome: 'Primeiros Passos', 
      descricao: 'Complete sua primeira atividade', 
      icone: '🎯',
      desbloqueada: false,
      progresso: 0,
      meta: 1,
      tipo: 'primeiraAtividade'
    },

    { 
      id: 2, 
      nome: 'Estudante Dedicado', 
      descricao: 'Mantenha uma streak de 7 dias', 
      icone: '🔥',
      desbloqueada: false,
      progresso: 0,
      meta: 7,
      tipo: 'streak'
    },

    { 
      id: 3, 
      nome: 'Mestre dos Estudos', 
      descricao: 'Mantenha uma streak de 30 dias', 
      icone: '👑',
      desbloqueada: false,
      progresso: 0,
      meta: 30,
      tipo: 'streak'
    },

    { 
      id: 4, 
      nome: 'Viciado em Conhecimento', 
      descricao: 'Mantenha uma streak de 100 dias', 
      icone: '💎',
      desbloqueada: false,
      progresso: 0,
      meta: 100,
      tipo: 'streak'
    },

    { 
      id: 5, 
      nome: 'Colecionador', 
      descricao: 'Ganhe 50 estrelas', 
      icone: '⭐',
      desbloqueada: false,
      progresso: 0,
      meta: 50,
      tipo: 'estrelas'
    },

    { 
      id: 6, 
      nome: 'Caçador de Estrelas', 
      descricao: 'Ganhe 100 estrelas', 
      icone: '🌟',
      desbloqueada: false,
      progresso: 0,
      meta: 100,
      tipo: 'estrelas'
    },

    { 
      id: 7, 
      nome: 'Expert', 
      descricao: 'Alcance o level 10', 
      icone: '🎓',
      desbloqueada: false,
      progresso: 0,
      meta: 10,
      tipo: 'level'
    },

    { 
      id: 8, 
      nome: 'Lenda', 
      descricao: 'Alcance o level 25', 
      icone: '⚡',
      desbloqueada: false,
      progresso: 0,
      meta: 25,
      tipo: 'level'
    },

    { 
      id: 9, 
      nome: 'Perfeição', 
      descricao: 'Acertar 10 questões seguidas', 
      icone: '💯',
      desbloqueada: false,
      progresso: 0,
      meta: 10,
      tipo: 'desempenho'
    },

    { 
      id: 10, 
      nome: 'Impecável', 
      descricao: 'Acertar 20 questões seguidas', 
      icone: '✨',
      desbloqueada: false,
      progresso: 0,
      meta: 20,
      tipo: 'desempenho'
    }

  ]);

  const [dadosUsuario, setDadosUsuario] = useState({
    streak: 0,
    estrelas: 0,
    level: 1,
    primeiraAtividade: false,
    maiorSequenciaAcertos: 0
  });

  useEffect(() => {
    carregarDadosConquistas();
  }, []);

  const carregarDadosConquistas = async () => {
    
    try {
    
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      
      if (userDoc.exists()) {
        
        const userData = userDoc.data();
        
        const novosDados = {
          streak: userData.streak || 0,
          estrelas: userData.estrelas || 0,
          level: Math.floor((userData.xp || 0) / 1000) + 1,
          primeiraAtividade: userData.primeiraAtividade || false,
          maiorSequenciaAcertos: userData.maiorSequenciaAcertos || 0
        };

        console.log('Dados do usuário:', novosDados);
        setDadosUsuario(novosDados);
        atualizarConquistas(novosDados);

      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const atualizarConquistas = (dados: any) => {
   
    const conquistasAtualizadas = conquistas.map(conquista => {
   
      let progresso = 0;
      
      switch(conquista.tipo) {
        
        case 'primeiraAtividade':
          progresso = dados.primeiraAtividade ? 1 : 0;
          break;
        
        case 'streak':
          progresso = Math.min(dados.streak, conquista.meta);
          break;
        
        case 'estrelas':
          progresso = Math.min(dados.estrelas, conquista.meta);
          break;
        
        case 'level':
          progresso = Math.min(dados.level, conquista.meta);
          break;

        case 'desempenho':
          progresso = Math.min(dados.maiorSequenciaAcertos, conquista.meta);
          break;
      }

      return {
        ...conquista, progresso, desbloqueada: progresso >= conquista.meta
      };

    });

    setConquistas(conquistasAtualizadas);
  };

  const ConquistaItem = ({ conquista }: any) => (
    
    <View style={[ styles.conquistaCard, conquista.desbloqueada ? styles.conquistaDesbloqueada : styles.conquistaBloqueada ]}>
      <View style={styles.conquistaHeader}>
        
        <Text style={styles.conquistaIcone}>{conquista.icone}</Text>
        
        <View style={styles.conquistaInfo}>
          <Text style={[ styles.conquistaNome, conquista.desbloqueada ? styles.textoDesbloqueado : styles.textoBloqueado ]}> {conquista.nome} </Text>
          <Text style={[ styles.conquistaDescricao, conquista.desbloqueada ? styles.textoDesbloqueado : styles.textoBloqueado ]}> {conquista.descricao} </Text>
        </View>
      </View>
      
      <View style={styles.progressoContainer}>

        <View style={styles.progressoBar}>
          <View style={[ styles.progressoPreenchido, { width: `${(conquista.progresso / conquista.meta) * 100}%` } ]} />
        </View>

        <Text style={styles.progressoTexto}> {conquista.progresso}/{conquista.meta} </Text>
      </View>

      {conquista.desbloqueada && (

        <View style={styles.badgeDesbloqueada}>
          <Text style={styles.badgeTexto}>CONQUISTADA!</Text>
        </View>
      )}
      
    </View>
  );

  const conquistasDesbloqueadas = conquistas.filter(c => c.desbloqueada).length;
  const totalConquistas = conquistas.length;

  return (
    
    <ScrollView style={styles.container}>
      
      <View style={styles.header}>
        
        <Text style={styles.title}>Conquistas</Text>
        <Text style={styles.subtitle}> {conquistasDesbloqueadas} de {totalConquistas} desbloqueadas </Text>

      </View>

      <View style={styles.conquistasList}>
        
        {conquistas.map(conquista => (
          <ConquistaItem key={conquista.id} conquista={conquista} />
        ))}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
 
  container: {
    flex: 1,
    backgroundColor: '#221377',
  },

  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },

  title: {
    color: 'white',
    fontSize: 35,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 5,
  },

  subtitle: {
    color: '#B8B5FF',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  conquistasList: {
    padding: 20,
    paddingTop: 0,
  },

  conquistaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
  },

  conquistaDesbloqueada: {
    borderColor: '#00E69D',
  },

  conquistaBloqueada: {
    borderColor: '#8581FF',
  },

  conquistaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  conquistaIcone: {
    fontSize: 30,
    marginRight: 15,
  },

  conquistaInfo: {
    flex: 1,
  },
  conquistaNome: {
    fontSize: 18,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 2,
  },

  conquistaDescricao: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },

  textoDesbloqueado: {
    color: 'white',
  },

  textoBloqueado: {
    color: '#B8B5FF',
  },

  progressoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  progressoBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },

  progressoPreenchido: {
    height: '100%',
    backgroundColor: '#00E69D',
    borderRadius: 4,
  },

  progressoTexto: {
    color: '#B8B5FF',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },

  badgeDesbloqueada: {
    backgroundColor: '#00E69D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  badgeTexto: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    fontWeight: 'bold',
  },

});