import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { verificarCodigo } from '../../../services/recuperacaoSenha';

type RootStackParamList = {
    VerificarCodigo: { usuarioId: string; email: string};
    NovaSenha: { usuarioId: string};
};

type Props = NativeStackScreenProps<RootStackParamList, 'VerificarCodigo'>;

const VerificarCodigo = ({ route, navigation }: Props) => {
  
    const { usuarioId, email } = route.params;
    const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
    const [carregando, setCarregando] = useState(false);
    const inputs = useRef<TextInput[]>([]);

    const isCodigoCompleto = codigo.every(digito => digito !== '');

    const focusNext = (index: number, value: string) => {
        
        if (value && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const focusPrevious = (index: number, value: string) => {
    
        if (!value && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const verificarCodigoDigitado = async () => {
    
        const codigoCompleto = codigo.join('');

        if (codigoCompleto.length !== 6) {
            return;
        }

        setCarregando(true);
        
        try {
           
            const resultado = await verificarCodigo(usuarioId, codigoCompleto);
          
            if (resultado.valido) {
                navigation.navigate('NovaSenha', { usuarioId });
            } else {
                Alert.alert('Erro', resultado.mensagem);
            }
    
        } catch (error) {
            Alert.alert('Erro', 'Código incorreto.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <View style={styles.container}>
            
            <Text style={styles.titulo}> Verificação </Text>
            <Text style={styles.subtitulo}>Digite o código enviado para</Text>
            <Text style={styles.email}>{email}</Text>
            
            <View style={styles.codigoContainer}> {[0, 1, 2, 3, 4, 5].map((index) => (
               
               <TextInput key={index} ref={ref => { if (ref) inputs.current[index] = ref; }}
              
               style={[ styles.inputCodigo, codigo[index] && styles.inputCodigoPreenchido ]} maxLength={1} keyboardType="number-pad"
               value={codigo[index]} onChangeText={(text) => {
             
               const numericText = text.replace(/[^0-9]/g, '');
               const novoCodigo = [...codigo];
               
               novoCodigo[index] = numericText;
               
               setCodigo(novoCodigo); focusNext(index, numericText); }} onKeyPress={({ nativeEvent }) => {
                
                if (nativeEvent.key === 'Backspace') {
                        focusPrevious(index, codigo[index]);
                }

               }} editable={!carregando} />

            ))}
            </View>
            
            <TouchableOpacity style={[styles.botao, (!isCodigoCompleto && styles.botaoDesabilitado), (carregando && { backgroundColor: '#403eb3ff'} )]}
            onPress={verificarCodigoDigitado} disabled={!isCodigoCompleto || carregando}>
                <Text style={styles.textoBotao}> {carregando ? 'Verificando...' : 'Verificar Código'} </Text>
            </TouchableOpacity>

            <View style={styles.areaInferior}>
                            
                <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
                <Image source={require('../../../assets/images/personagem.png')} style={styles.imagemPersonagem} resizeMode="contain" />
                                    
                <View style={styles.balaoContainer}>
                    <Image source={require('../../../assets/images/balao-3.png')} style={styles.imagemBalao} resizeMode="stretch" />
                              
                    <View style={styles.textoContainer}>
                        <Text style={styles.textoPergunta}> Lembre-se de verificar na caixa de Spam! </Text>
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
        marginBottom: 10,
    },

    subtitulo: {
        color: '#8581FF',
        fontSize: 25,
        textAlign: 'center',
        marginBottom: 5,
        fontFamily: 'Jersey10_400Regular',
    },

    email: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 40,
        fontFamily: 'InriaSans_400Regular',
        fontWeight: 'bold',
    },

    codigoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
        paddingHorizontal: 10,
    },

    inputCodigo: {
        width: 45,
        height: 60,
        backgroundColor: 'white',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 24,
        fontFamily: 'Inter_400Regular',
        color: '#221377',
        borderWidth: 2,
        borderColor: '#8581FF',
    },

    inputCodigoPreenchido: {
        backgroundColor: '#F0F0FF',
        borderColor: '#6C63FF',
    },

    botao: {
        backgroundColor: '#8581FF',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 100,
    },

    botaoDesabilitado: {
        backgroundColor: '#bdbebd',
    },

    textoBotao: {
        color: 'white',
        fontSize: 30,
        fontFamily: 'Jersey10_400Regular',
    },
    
    link: {
        color: '#CCCCCC',
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        textDecorationLine: 'underline',
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
        width: 250,
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

export default VerificarCodigo;