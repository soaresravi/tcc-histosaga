import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';

import { useRoute, useNavigation } from '@react-navigation/native';

interface Fonte {

  titulo: string;
  url: string;

}

interface Questao {

  id: string;
  fonte?: string | Fonte[];
  enunciado?: string;

}

interface Atividade {

  id: string;
  nome: string;
  questoes: Questao[];

}

type RouteParams = {

  tipo: 'aviso' | 'atividade';
  titulo?: string;
  conteudo?: string;
  atividade?: Atividade;

};

export default function DetalhesFontes() {

  const route = useRoute();
  const navigation = useNavigation();
  const { tipo, titulo, conteudo, atividade } = route.params as RouteParams;

  const abrirLink = (url: string) => {

    Linking.openURL(url).catch(err => 
      console.error('Erro ao abrir link:', err)
    );

  };

  const formatarFonte = (fonte: string | Fonte[]) => {
   
    if (typeof fonte === 'string') {
    
      return (
        
        <TouchableOpacity style={styles.fonteItem} onPress={() => abrirLink(fonte)}>
          <Text style={styles.fonteTexto}>🔗 {fonte}</Text>
        </TouchableOpacity>

      );

    } else if (Array.isArray(fonte)) {
      
      return fonte.map((f, index) => (
      
      <TouchableOpacity key={index} style={styles.fonteItem} onPress={() => abrirLink(f.url)}>
        <Text style={styles.fonteTexto}>📖 {f.titulo}</Text>
      </TouchableOpacity>
      
      ));

    }

    return null;

  };

  return (
   
   <ScrollView style={styles.container}>
      
      <View style={styles.header}>
        
        <TouchableOpacity style={styles.botaoVoltar} onPress={() => navigation.goBack()}>
          <Text style={styles.botaoVoltarTexto}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}> {tipo === 'aviso' ? titulo : atividade?.nome} </Text>

      </View>

      {tipo === 'aviso' ? (

        <View style={styles.conteudo}>
          <Text style={styles.textoAviso}>{conteudo}</Text>
        </View>

      ) : (

        <View style={styles.questoesContainer}>
          
          {atividade?.questoes.map((questao, index) => (
           
           <View key={questao.id || index} style={styles.questaoItem}>
              
              <Text style={styles.questaoTitulo}> Questão {index + 1} </Text>
              
              {questao.enunciado && ( 
                <Text style={styles.questaoEnunciado}> {questao.enunciado} </Text>
              )}

              {questao.fonte ? (
                
                <View style={styles.fontesContainer}>
                  <Text style={styles.fontesTitulo}>Fontes:</Text>
                  {formatarFonte(questao.fonte)}
                </View>

              ) : (

                <Text style={styles.semFonte}>Sem fonte registrada</Text>
                
              )}

            </View>

          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#221377',
  },

  header: {
    padding: 10,
    paddingHorizontal: 50,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  botaoVoltar: {
    marginRight: 15,
  },

  botaoVoltarTexto: {
    color: 'white',
    fontSize: 35,
    fontFamily: 'Jersey10_400Regular',
  },

  title: {
    color: 'white',
    fontSize: 28,
    fontFamily: 'Jersey10_400Regular',
    flex: 1,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },

  conteudo: {
    padding: 20,
    textAlign: 'justify'
  },

  textoAviso: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'InriaSans_400Regular',
    lineHeight: 24,
    textAlign: 'justify'
  },

  questoesContainer: {
    padding: 20,
  },

  questaoItem: {
    backgroundColor: 'rgba(20, 0, 102, 0.66)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#8581FF',
  },

  questaoTitulo: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 8,
  },

  questaoEnunciado: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 10,
    opacity: 0.8,
  },

  fontesContainer: {
    marginTop: 5,
  },

  fontesTitulo: {
    color: '#B8B5FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 5,
  },

  fonteItem: {
    marginBottom: 5,
  },

  fonteTexto: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },

  semFonte: {
    color: '#B8B5FF',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
  },
  
});