import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Configuracoes() {
    
    const navigation = useNavigation();

    const handleSairConta = async () => {
       
        try {
            await AsyncStorage.removeItem('userId');
            navigation.navigate('Apresentacao' as never);
        } catch (error) {
            console.error('Erro ao fazer logout: ', error)
        }

    }

    const opcoes = [
        
        {
            titulo: "🔔 Notificações",
            tela: "Notificacoes" as never
        },

        {
            titulo: "👤 Editar perfil",
            tela: "EditarPerfil" as never 
        },

        {
            titulo: "🔐 Redefinir senha",
            tela: "RedefinirSenha" as never
        },

    ]
    
    return (
    
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.titulo}>Configurações</Text>
      </View>

      <View style={styles.conteudo}>
        
        {opcoes.map((opcao, index) => (
          
          <TouchableOpacity key={index} style={ styles.botaoOpcao } onPress={() => navigation.navigate(opcao.tela)}>
           
            <View style={styles.textoContainer}>
              <Text style={styles.botaoTitulo}>{opcao.titulo}</Text>
            </View>
            
            <Text style={styles.seta}>›</Text>
          </TouchableOpacity>

        ))}

        <TouchableOpacity style={styles.botaoSair} onPress={handleSairConta} activeOpacity={0.7}>
            <Text style={styles.botaoSairTexto}> Sair </Text>
        </TouchableOpacity>

      </View>
    </View>
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

  titulo: {
    color: 'white',
    fontSize: 35,
    fontFamily: 'Jersey10_400Regular',
  },

  conteudo: {
    padding: 20,
  },

  botaoOpcao: {
    backgroundColor: '#8581FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },

  textoContainer: {
    flex: 1,
  },

  botaoTitulo: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 5,
  },

  seta: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
  },

   botaoSair: {
    backgroundColor: '#d65858ff',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 8,
    marginTop: 20,
  },

  botaoSairTexto: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
  },
});