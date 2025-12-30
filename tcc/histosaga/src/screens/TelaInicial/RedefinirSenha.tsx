import React, { useState} from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc} from 'firebase/firestore'
import { db } from '../../config/firebase';

import * as Crypto from 'expo-crypto';

export default function RedefinirSenha() {
  
  const navigation = useNavigation();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [senhaAtualVerificada, setSenhaAtualVerificada] = useState(false);
  
  const [erros, setErros] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });
  
  const validarSenha = (senha: string) => {
   
    if (!senha.trim()) return 'A senha é obrigatória.';
    if (senha.length < 6) return 'A senha precisa ter no mínimo 6 caracteres.';
   
    if (!/[a-zA-Z]/.test(senha)) return 'A senha precisa ter pelo menos uma letra.';
    if (!/[0-9]/.test(senha)) return 'A senha precisa ter pelo menos um número';

    return '';

  };

  const verificarSenhaAtual = async () => {
   
    if (!senhaAtual.trim()) {
        setErros(prev => ({ ...prev, senhaAtual: 'Digite sua senha atual.'}));
        return;
    }

    setCarregando(true);

    try {
        
        const userId = await AsyncStorage.getItem('userId');
        
        if (!userId) {
            setErros(prev => ({ ...prev, senhaAtual: 'Usuário não identificado'}));
            return;
        }

        const userDoc = await getDoc(doc(db, 'usuarios', userId));
       
        if (userDoc.exists()) {
            
            const userData = userDoc.data();
           
            const senhaCriptografada = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                senhaAtual
            );

            if (userData.senha === senhaCriptografada) {
                setSenhaAtualVerificada(true);
                setErros(prev => ({ ...prev, senhaAtual: ''}));
            } else {
                setErros(prev => ({ ...prev, senhaAtual: 'Senha incorreta'}));
            }
        }

    } catch (error) {
       
        console.error('Erro ao verificar senha: ', error);
        setErros(prev => ({ ...prev, senhaAtual: 'Erro ao verificar senha' }));
    
    } finally {
        setCarregando(false);
    }
  };

  const handleSenhaAtualChange = (text: string) => {
   
    setSenhaAtual(text);
    setSenhaAtualVerificada(false);

    if (!text.trim()) {
        setErros(prev => ({ ...prev, senhaAtual: 'Digite sua senha atual.'}));
    
    } else {
        setErros(prev => ({ ...prev, senhaAtual: ''}));
    }

  };

  const handleNovaSenhaChange = (text: string) => {
   
    setNovaSenha(text);
    const erro = validarSenha(text);
    setErros(prev => ({ ...prev, novaSenha: erro}));

    if (confirmarSenha && text !== confirmarSenha) {
        setErros(prev => ({ ...prev, confirmarSenha: 'As senhas não conferem' }));
   
    } else if (confirmarSenha) {
        setErros(prev => ({ ...prev, confirmarSenha: ''}));
    }

  };

  const handleConfirmarSenhaChange = (text: string) => {
    
    setConfirmarSenha(text);
    
    if (text !== novaSenha) {
        setErros(prev => ({ ...prev, confirmarSenha: 'As senhas não conferem' }));
   
    } else {
        setErros(prev => ({ ...prev, confirmarSenha: '' }));
    }

  };

  const formularioValido = () => {
    
    return (
       
        senhaAtualVerificada &&
        novaSenha.trim() !== '' &&
        confirmarSenha.trim() !== '' &&
        !erros.novaSenha &&
        !erros.confirmarSenha

    );
  };

  const salvarNovaSenha = async () => {
   
    if (!formularioValido()) return;
    setCarregando(true);

    try {
       
        const userId = await AsyncStorage.getItem('userId');
       
        if (!userId) {
            Alert.alert('Erro', 'Usuário não identificado');
            return;
        }

        const novaSenhaCriptografada = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, novaSenha);

        await updateDoc(doc(db, 'usuarios', userId), {
            senha: novaSenhaCriptografada,
            ultimaAtualizacao: new Date()
        });

        Alert.alert('Sucesso!', 'Senha redefinida com sucesso!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  
    } catch (error) {
        
        console.error('Erro ao atualizar senha: ', error);
        Alert.alert('Erro', 'Não foi possível redefinir a senha.');
   
    } finally {
        setCarregando(false);
    }
  };

   return (
    <View style={styles.container}>
     
      <View style={styles.header}>
        <Text style={styles.titulo}>Redefinir Senha</Text>
      </View>

      <View style={styles.formulario}>
        <View style={styles.campoContainer}>
          
          <Text style={styles.campoLabel}>Senha Atual</Text>
          
          <View style={styles.inputContainer}>
            
            <TextInput style={[ styles.input, erros.senhaAtual ? styles.inputInvalido : senhaAtualVerificada ? styles.inputValido : styles.inputNormal]}
            value={senhaAtual} onChangeText={handleSenhaAtualChange} placeholder="Digite sua senha atual" secureTextEntry={!mostrarSenha}
            editable={!senhaAtualVerificada && !carregando} />
            
            {senhaAtual && !senhaAtualVerificada && (
                
                <TouchableOpacity style={styles.botaoVerificar} onPress={verificarSenhaAtual} disabled={carregando || !senhaAtual.trim()}>
                    
                    {carregando ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    
                    ) : (

                    <Text style={styles.botaoVerificarTexto}>Verificar</Text>

                    )}

              </TouchableOpacity>
            )}
          </View>
          
          {erros.senhaAtual ? <Text style={styles.erroTexto}>{erros.senhaAtual}</Text> : null}
          {senhaAtualVerificada && <Text style={styles.sucessoTexto}>✓ Senha verificada</Text>}

        </View>

        {senhaAtualVerificada && (
          
          <>
          <View style={styles.campoContainer}>
              
              <Text style={styles.campoLabel}>Nova Senha</Text>
              
              <View style={styles.inputWithIcon}>
                <TextInput style={[ styles.inputWithPadding, erros.novaSenha ? styles.inputInvalido : styles.inputNormal ]} value={novaSenha} onChangeText={handleNovaSenhaChange} placeholder="Digite a nova senha"
                secureTextEntry={!mostrarSenha} />
                
                <TouchableOpacity style={styles.olhoButton} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  <Text style={styles.olhoTexto}> {mostrarSenha ? '👁️' : '👁️‍🗨️'} </Text>
                </TouchableOpacity>

              </View>

              {erros.novaSenha ? <Text style={styles.erroTexto}>{erros.novaSenha}</Text> : null}

            </View>

            <View style={styles.campoContainer}>
              
              <Text style={[styles.campoLabel, { marginTop: 15}]}>Confirmar Nova Senha</Text>
              
              <View style={styles.inputWithIcon}>
                
                <TextInput style={[ styles.inputWithPadding, erros.confirmarSenha ? styles.inputInvalido : styles.inputNormal ]} value={confirmarSenha} onChangeText={handleConfirmarSenhaChange}
                placeholder="Confirme a nova senha" secureTextEntry={!mostrarSenha} />
                
                <TouchableOpacity style={styles.olhoButton} onPress={() => setMostrarSenha(!mostrarSenha)}>
                  <Text style={styles.olhoTexto}> {mostrarSenha ? '👁️' : '👁️‍🗨️'} </Text>
                </TouchableOpacity>

              </View>

              {erros.confirmarSenha ? <Text style={styles.erroTexto}>{erros.confirmarSenha}</Text> : null}

            </View>
          </>
        )}
      </View>

      <View style={styles.botoesContainer}>
        
        <TouchableOpacity style={[styles.botaoVoltar, carregando && styles.botaoDesabilitado]} onPress={() => navigation.goBack()} disabled={carregando}>
          <Text style={styles.botaoVoltarTexto}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[ styles.botaoSalvar, (!formularioValido() || carregando) && styles.botaoDesabilitado, carregando && styles.botaoCarregando ]}
        onPress={salvarNovaSenha} disabled={!formularioValido() || carregando}>
         
          {carregando ? (

            <ActivityIndicator size="small" color="#FFFFFF" />

          ) : (

            <Text style={styles.botaoSalvarTexto}>Salvar</Text>

          )}
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
    marginBottom: 5,
  },

  formulario: {
    padding: 20,
  },

  campoContainer: {
    marginBottom: 20,
  },

  campoLabel: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 8,
    marginLeft: 5,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    fontFamily: 'InriaSans_400Regular',
    fontSize: 16,
    borderWidth: 2,
  },

  inputWithIcon: {
    position: 'relative',
  },

  inputWithPadding: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    fontFamily: 'InriaSans_400Regular',
    fontSize: 16,
    borderWidth: 2,
    paddingRight: 50,
  },

  inputNormal: {
    borderColor: '#8581FF',
  },

  inputValido: {
    borderColor: '#00E69D',
  },

  inputInvalido: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFE6E6',
  },

  botaoVerificar: {
    backgroundColor: '#8581FF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },

  botaoVerificarTexto: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
  },

  olhoButton: {
    position: 'absolute',
    right: 15,
    top: 7,
    padding: 5,
  },

  olhoTexto: {
    fontSize: 20,
  },

  erroTexto: {
    color: '#FF6B6B',
    fontSize: 12,
    fontFamily: 'InriaSans_400Regular',
    marginTop: 5,
    marginLeft: 5,
  },

  sucessoTexto: {
    color: '#00E69D',
    fontSize: 12,
    fontFamily: 'InriaSans_400Regular',
    marginTop: 5,
    marginLeft: 5,
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
    fontSize: 20,
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
    backgroundColor: '#00BB80',
  },

  botaoSalvarTexto: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Jersey10_400Regular',
  },

});