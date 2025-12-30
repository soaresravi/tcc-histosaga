import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';

import { enviarCodigoVerificacao } from '../../../services/emailService';
import { salvarCodigoVerificacao } from '../../../services/recuperacaoSenha';

type RootStackParamList = {
    EsqueciSenha: undefined;
    VerificarCodigo: { usuarioId: string; email: string};
};

type EsqueciSenhaNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EsqueciSenha'>;

interface Props {
    navigation: EsqueciSenhaNavigationProp;
}

const EsqueciSenha = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erroEmail, setErroEmail] = useState('');
    const [emailNaoEncontrado, setEmailNaoEncontrado] = useState('');

    const validarEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isEmailValido = validarEmail(email);
    
    const handleEmailChange = (text: string) => {
       
        setEmail(text);
        setEmailNaoEncontrado(''); 
        
        if (text.length === 0) {
            setErroEmail('');
     
        } else if (!validarEmail(text)) {
            setErroEmail('Digite um email válido');
     
        } else {
            setErroEmail(''); 
        }
    };
    
    const verificarEmail = async () => {
        if (!email) {
            setErroEmail('Digite um email');
            return;
        }

        if (!isEmailValido) {
            setErroEmail('Digite um email válido');
            return;
        }
        
        setCarregando(true);
        setErroEmail(''); 
        setEmailNaoEncontrado(''); 

        try {
            
            console.log('Verificando email:', email);
            
            const q = query(collection(db, 'usuarios'), where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            console.log('Resultado:', querySnapshot.size, 'documentos');
            
            if (querySnapshot.empty) {
                
                setEmailNaoEncontrado('Email não encontrado');
                setCarregando(false);
                
                return;
            }
            
            const usuarioDoc = querySnapshot.docs[0];
            const usuarioId = usuarioDoc.id;
            const usuarioData = usuarioDoc.data();

            const emailParaEnviar = email; 
            const nomeUsuario = usuarioData.nome || 'Usuário';

            console.log('Gerando código para:', emailParaEnviar);
            const codigo = await salvarCodigoVerificacao(usuarioId, emailParaEnviar);
            
            console.log('Enviando email...');
            await enviarCodigoVerificacao(emailParaEnviar, codigo, nomeUsuario);

            console.log('Navegando...');
            navigation.navigate('VerificarCodigo', { usuarioId, email: emailParaEnviar });
            
        } catch (error) {
          
            console.error('Erro:', error);
            Alert.alert('Erro', 'Não foi possível processar a solicitação');
       
        } finally {
            setCarregando(false);
        }
    };

    return (
        <View style={styles.container}>
            
            <Text style={styles.titulo}> 🔐 Recuperar senha </Text>
            
            <View style={styles.inputContainer}>
               
                <TextInput style={[ styles.input, email && !isEmailValido && styles.inputInvalido, emailNaoEncontrado && styles.inputInvalido ]} 
                placeholder="Digite o email cadastrado" value={email} onChangeText={handleEmailChange} keyboardType="email-address" autoCapitalize="none" />
                
                {erroEmail ? <Text style={styles.erroTexto}>{erroEmail}</Text> : null}
                {emailNaoEncontrado ? <Text style={styles.erroTexto}>{emailNaoEncontrado}</Text> : null}
           
            </View>

            <TouchableOpacity style={[ styles.botao, (!isEmailValido || carregando) && styles.botaoDesabilitado, carregando &&
            styles.botaoCarregando ]} onPress={verificarEmail} disabled={!isEmailValido || carregando}>
                
                <Text style={styles.textoBotao}> {carregando ? 'Enviando...' : 'Enviar código'} </Text>

            </TouchableOpacity>

            <View style={styles.areaInferior}>
               
                <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
                <Image source={require('../../../assets/images/personagem.png')} style={styles.imagemPersonagem} resizeMode="contain" />
            
                <View style={styles.balaoContainer}>
                    
                    <Image source={require('../../../assets/images/balao-3.png')} style={styles.imagemBalao} resizeMode="stretch" />
                    
                    <View style={styles.textoContainer}>
                        <Text style={styles.textoPergunta}> Enviaremos um código de verificação para o email cadastrado. </Text>
                    </View>

                </View>
            </View>
        </View>
    )
}

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
        marginBottom: 10,
    },

    input: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 30,
        fontFamily: 'Inter_400Regular',
        borderWidth: 2,
        borderColor: '#8581FF',
    },

    inputInvalido: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFE6E6',
    },

    erroTexto: {
        color: '#FF6B6B',
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        marginTop: 5,
        marginLeft: 15,
    },

    botao: {
        backgroundColor: '#8581FF',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 50,
    },

    botaoDesabilitado: { 
        backgroundColor: '#bdbebd' 
    },

    botaoCarregando: {
        backgroundColor: '#403eb3',
    },

    textoBotao: {
        color: 'white',
        fontSize: 30,
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
        width: 250, 
        height: 120, 
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        top: 30, 
        left: 25,
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

export default EsqueciSenha;