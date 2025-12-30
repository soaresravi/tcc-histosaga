import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function EditarPerfil() {
  
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    nome: '',
    usuario: '',
    email: '',
    telefone: ''
  });

  const [erros, setErros] = useState({
    nome: '',
    usuario: '',
    email: '',
    telefone: ''
  });

  const [salvando, setSalvando] = useState(false);
  const [usuarioOriginal, setUsuarioOriginal] = useState('');

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    
    try {
      
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const userDoc = await getDoc(doc(db, 'usuarios', userId));
     
      if (userDoc.exists()) {
        
        const data = userDoc.data();
        
        setFormData({
          nome: data.nome || '',
          usuario: data.usuario || '',
          email: data.email || '',
          telefone: data.telefone || ''
        });

        setUsuarioOriginal(data.usuario || '');
      }

    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const validarNome = (nome: string) => {
   
    if (!nome.trim()) return 'Nome é obrigatório';
    if (/[0-9]/.test(nome)) return 'Nome não pode conter números';
   
    return '';
  };

  const validarEmail = (email: string) => {
    
    if (!email.trim()) return 'Email é obrigatório';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
    if (!emailRegex.test(email)) return 'Email inválido';
    return '';

  };

  const validarTelefone = (telefone: string) => {
   
    if (!telefone.trim()) return 'Telefone é obrigatório';
    const telefoneRegex = /^[0-9]+$/;
   
    if (!telefoneRegex.test(telefone)) return 'Telefone deve conter apenas números';
    return '';

  };

  const verificarUsuarioExistente = async (usuario: string) => {
   
    if (usuario === usuarioOriginal) return ''; 
    
    try {

      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('usuario', '==', usuario.toLowerCase()));
      const snapshot = await getDocs(q);
      
      return !snapshot.empty ? 'Usuário já existe' : '';

    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      return 'Erro ao verificar usuário';
    }
  };

  const validarUsuario = async (usuario: string) => {
    if (!usuario.trim()) return 'Usuário é obrigatório';
    return await verificarUsuarioExistente(usuario);
  };

  const handleChange = async (campo: string, valor: string) => {
    
    setFormData(prev => ({ ...prev, [campo]: valor }));
    let erro = '';
    
    switch (campo) {
      
      case 'nome':
        erro = validarNome(valor);
        break;
      
      case 'usuario':
        erro = await validarUsuario(valor);
        break;
     
      case 'email':
        erro = validarEmail(valor);
        break;
      
      case 'telefone':
        erro = validarTelefone(valor);
        break;
    }

    setErros(prev => ({ ...prev, [campo]: erro }));
  };

  const todosCamposValidos = () => {
   
    return (

      formData.nome.trim() !== '' &&
      formData.usuario.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.telefone.trim() !== '' &&
      Object.values(erros).every(erro => erro === '')

    );

  };

  const salvarAlteracoes = async () => {
   
    if (!todosCamposValidos()) return;
    setSalvando(true);

    try {

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('Usuário não identificado');

      const userRef = doc(db, 'usuarios', userId);
     
      await updateDoc(userRef, {
        nome: formData.nome.trim(),
        usuario: formData.usuario.toLowerCase().trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim()
      });

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack();

    } catch (error) {
      
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');

    } finally {
      setSalvando(false);
    }
  };

  return (
    
    <ScrollView style={styles.container}>
      
      <View style={styles.header}>
     
        <Text style={styles.titulo}>Editar Perfil</Text>
     
      </View>

      <View style={styles.formulario}>
        <View style={styles.campoContainer}>
          
          <Text style={styles.campoLabel}>Nome</Text>
          
          <TextInput style={[ styles.input, erros.nome ? styles.inputInvalido : styles.inputValido ]} 
          value={formData.nome} onChangeText={(text) => handleChange('nome', text)} placeholder="Seu nome completo" />
          
          {erros.nome ? <Text style={styles.erroTexto}>{erros.nome}</Text> : null}
        
        </View>

        <View style={styles.campoContainer}>
          
          <Text style={styles.campoLabel}>Usuário</Text>
          
          <TextInput style={[ styles.input, erros.usuario ? styles.inputInvalido : styles.inputValido
          ]} value={formData.usuario} onChangeText={(text) => handleChange('usuario', text)} placeholder="Seu nome de usuário" autoCapitalize="none" />
          
          {erros.usuario ? <Text style={styles.erroTexto}>{erros.usuario}</Text> : null}
        
        </View>

        <View style={styles.campoContainer}>
         
          <Text style={styles.campoLabel}>Email</Text>
         
          <TextInput style={[ styles.input, erros.email ? styles.inputInvalido : styles.inputValido ]} 
          value={formData.email} onChangeText={(text) => handleChange('email', text)} placeholder="seu@email.com" keyboardType="email-address" 
          autoCapitalize="none" />
          
          {erros.email ? <Text style={styles.erroTexto}>{erros.email}</Text> : null}

        </View>

        <View style={styles.campoContainer}>
          
          <Text style={styles.campoLabel}>Telefone</Text>
          
          <TextInput style={[ styles.input, erros.telefone ? styles.inputInvalido : styles.inputValido ]} 
          value={formData.telefone} onChangeText={(text) => handleChange('telefone', text)} placeholder="Apenas números" keyboardType="phone-pad" />
          
          {erros.telefone ? <Text style={styles.erroTexto}>{erros.telefone}</Text> : null}

        </View>
      </View>

      <View style={styles.botoesContainer}>
       
        <TouchableOpacity style={[styles.botaoVoltar, salvando && styles.botaoDesabilitado]} onPress={() => navigation.goBack()} disabled={salvando}>
          <Text style={styles.botaoVoltarTexto}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[ styles.botaoSalvar, !todosCamposValidos() && styles.botaoDesabilitado, salvando && styles.botaoCarregando ]}
        onPress={salvarAlteracoes} disabled={!todosCamposValidos() || salvando}>
          
          {salvando ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.botaoSalvarTexto}>Salvar</Text>
          )}

        </TouchableOpacity>
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
    alignItems: 'center',
  },

  titulo: {
    color: 'white',
    fontSize: 35,
    fontFamily: 'Jersey10_400Regular',
    paddingTop: 60
  },

  formulario: {
    padding: 20,
  },

  campoContainer: {
    marginBottom: 20,
    position: 'relative',
  },

  campoLabel: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 8,
    marginLeft: 5,
  },

  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    fontFamily: 'InriaSans_400Regular',
    fontSize: 14,
    borderWidth: 2,
  },

  inputValido: {
    borderColor: '#8581FF',
  },

  inputInvalido: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE6E6',
  },

  erroTexto: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: 'InriaSans_400Regular',
    marginTop: 5,
    marginLeft: 5,
  },

  carregandoIndicator: {
    position: 'absolute',
    right: 15,
    top: 45,
  },

  botoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },

  botaoVoltar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#8581FF',
  },

  botaoVoltarTexto: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
  },

  botaoSalvar: {
    flex: 1,
    backgroundColor: '#8581FF',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginLeft: 10,
  },

  botaoDesabilitado: {
    backgroundColor: '#bdbebd',
    borderColor: '#bdbebd',
  },

  botaoCarregando: {
    backgroundColor: '#8581FF',
  },

  botaoSalvarTexto: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
  },

  carregandoTexto: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'InriaSans_400Regular',
    marginTop: 10,
    textAlign: 'center',
  },

});