import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import * as Crypto from 'expo-crypto';

type RootStackParamList = {
    NovaSenha: { usuarioId: string };
    Login: undefined;
};

interface Props {
    navigation: NovaSenhaNavigationProp;
    route: {
        params: {
            usuarioId: string;
        };
    };
}

type NovaSenhaNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NovaSenha'>;

const NovaSenha = ({ route, navigation }: Props) => {
  
    const { usuarioId } = route.params;
   
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
    const [erroSenha, setErroSenha] = useState('');
    const [erroConfirmarSenha, setErroConfirmarSenha] = useState('');
    const [mensagemSucesso, setMensagemSucesso] = useState('');

    const [carregando, setCarregando] = useState(false);

    const validarSenha = (senha: string) => {

        if (senha.length === 0) {
            setErroSenha('');
            return false;
        }

        if (senha.length > 0) {
            const senhaRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
            
            if (senha.length < 6) {
                setErroSenha(''); 
                return false;
            }

            if (!senhaRegex.test(senha)) {
                setErroSenha(''); 
                return false;
            }
        }

        setErroSenha('');
        return true;
    };

    const validarConfirmarSenha = (confirmacao: string) => {

        if (confirmacao.length === 0) {
            setErroConfirmarSenha('');
            return false;
        }

        if (confirmacao !== novaSenha && novaSenha.length > 0 && confirmacao.length > 0) {
            setErroConfirmarSenha('As senhas não conferem.');
            return false;
        }

        setErroConfirmarSenha('');
        return true;
    }

    const handleNovaSenhaChange = (text: string) => {

        setNovaSenha(text);
        validarSenha(text);
        
        if (confirmarSenha.length > 0) {
            validarConfirmarSenha(confirmarSenha);
        }
    };

    const handleConfirmarSenhaChange = (text: string) => {
        setConfirmarSenha(text);
        validarConfirmarSenha(text);
    };

    const atualizarSenha = async () => {

        const senhaRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
        
        if (!novaSenha || !confirmarSenha) {
            setErroSenha('Preencha todos os campos');
            return;
        }

        if (novaSenha.length < 6) {
            setErroSenha('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (!senhaRegex.test(novaSenha)) {
            setErroSenha('A senha deve conter pelo menos uma letra e um número');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            setErroConfirmarSenha('As senhas não conferem.');
            return;
        }

        setCarregando(true);
        setMensagemSucesso('');

        try {
          
            const senhaCriptografada = await Crypto.digestStringAsync( Crypto.CryptoDigestAlgorithm.SHA256, novaSenha );

            await updateDoc(doc(db, 'usuarios', usuarioId), {
                senha: senhaCriptografada
            });
            
            setMensagemSucesso('Senha alterada com sucesso! Você será redirecionado...');
            
            setTimeout(() => {
              
                navigation.reset({ 
                    index: 0, 
                    routes: [{ name: 'Login' }], 
                });
          
            }, 3000);

        } catch (error) {
          
            console.error('Erro ao alterar senha:', error);
            Alert.alert('Erro', 'Não foi possível alterar a senha');
      
        } finally {
            setCarregando(false);
        }
    };

    const isBotaoHabilitado = novaSenha.length >= 6 && confirmarSenha.length >= 6 && novaSenha === confirmarSenha && !erroSenha && 
    !erroConfirmarSenha && !carregando;

    return (
        <View style={styles.container}>
            
            <Text style={styles.titulo}>🔑 Nova senha</Text>
    
            <View style={styles.inputContainer}>              
                
                <View style={[ styles.passwordInputContainer, erroSenha ? styles.inputComErro : styles.inputSemErro ]}>
                   
                    <TextInput style={styles.input} placeholder="Ex: ravito123" placeholderTextColor="#8581FF" secureTextEntry={!mostrarSenha} 
                    value={novaSenha} onChangeText={handleNovaSenhaChange} editable={!carregando} />

                    <TouchableOpacity style={styles.eyeButton} onPress={() => setMostrarSenha(!mostrarSenha)}>
                        <Text style={styles.eyeText}> {mostrarSenha ? '👁️' : '👁️‍🗨️'} </Text>
                    </TouchableOpacity>
              
                </View>

                {erroSenha ? <Text style={styles.erroTexto}>{erroSenha}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
                <View style={[ styles.passwordInputContainer, erroConfirmarSenha ? styles.inputComErro : styles.inputSemErro ]}>

                    <TextInput style={styles.input} placeholder="Confirme a nova senha" placeholderTextColor="#8581FF"
                    secureTextEntry={!mostrarConfirmarSenha} value={confirmarSenha} onChangeText={handleConfirmarSenhaChange} editable={!carregando} />
                    
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}>
                       
                        <Text style={styles.eyeText}> 
                            {mostrarConfirmarSenha ? '👁️' : '👁️‍🗨️'} 
                        </Text>
                        
                    </TouchableOpacity>
                </View>

                {erroConfirmarSenha ? <Text style={styles.erroTexto}>{erroConfirmarSenha}</Text> : null}
            </View>

            <TouchableOpacity style={[ styles.botao, carregando ? { backgroundColor: '#403eb3ff'} : (!isBotaoHabilitado && styles.botaoDesabilitado)
    ]}      onPress={atualizarSenha} 
            disabled={!isBotaoHabilitado || carregando}>

                <Text style={styles.textoBotao}> {carregando ? 'Alterando...' : 'Alterar Senha'} </Text>
            </TouchableOpacity>
            
            <Text style={styles.sucessoTexto}>{mensagemSucesso} </Text>

            <View style={styles.areaInferior}>
                
                <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
                <Image source={require('../../../assets/images/personagem.png')} style={styles.imagemPersonagem} resizeMode="contain" />
                        
                <View style={styles.balaoContainer}>
                    <Image source={require('../../../assets/images/balao-3.png')} style={styles.imagemBalao} resizeMode="stretch" />
                  
                    <View style={styles.textoContainer}>
                        <Text style={styles.textoPergunta}> A senha deve conter pelo menos 6 caracteres, uma letra e um número. </Text>
                    </View>

                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#221377',
        padding: 20,
        justifyContent: 'center',
    },

    titulo: {
        color: 'white',
        fontSize: 40,
        fontFamily: 'Jersey10_400Regular',
        textAlign: 'center',
        marginBottom: 30,
    },

    inputContainer: {
        marginBottom: 15,
        width: '100%',
    },

    passwordInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 15,
    },

    inputSemErro: {
        backgroundColor: 'white',
    },

    inputComErro: {
        backgroundColor: '#FFE6E6',
        borderColor: '#FF0000',
        borderWidth: 1,
    },

    input: {
        flex: 1,
        padding: 15,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: '#221377',
    },

    eyeButton: { 
        padding: 5 
    },

    eyeText: { 
        fontSize: 20 
    },

    erroTexto: {
        color: '#FF6B6B',
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        marginTop: 5,
        marginLeft: 15,
    },

    sucessoTexto: {
        color: 'white',
        fontSize: 20,
        fontFamily: 'InriaSans_400Regular',
        textAlign: 'center',
        borderRadius: 5,
        marginBottom: 140,
    },

    botao: {
        backgroundColor: '#8581FF',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 10,
    },
    
    botaoDesabilitado: { 
        backgroundColor: '#bdbebd' 
    },

    textoBotao: {
        color: 'white',
        fontSize: 25,
        fontFamily: 'Jersey10_400Regular',
    },

    areaInferior: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },

    imagemBloco: {
        width: 600,
        height: 50,
        bottom: 0,
    },
    
    imagemPersonagem: {
        position: 'absolute',
        left: 0,
        bottom: 15, 
        width: 200, 
        height: 200,
        zIndex: 2,
    },
      
    balaoContainer: {
        position: 'absolute',
        left: 110, 
        bottom: 120, 
        zIndex: 2,
        width: 300, 
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
      
    imagemBalao: {
        width: 300,
        height: 200,
        position: 'absolute',
    },

    textoContainer: {
        position: 'absolute',
        width: 200, 
        height: 120, 
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        top: 25, 
        left: 50
    },

    textoPergunta: {
        color: '#8581FF',
        fontSize: 22, 
        fontFamily: 'Jersey10_400Regular',
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: 24, 
    },
});

export default NovaSenha;