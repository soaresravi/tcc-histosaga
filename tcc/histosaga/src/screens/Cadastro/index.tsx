import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, Alert, ImageBackground } from 'react-native';

import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useFonts as usePress, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts as useInter, Inter_400Regular } from '@expo-google-fonts/inter';
import { useFonts as useJersey, Jersey10_400Regular } from '@expo-google-fonts/jersey-10';
import { useFonts as useInria, InriaSans_400Regular } from '@expo-google-fonts/inria-sans';

import { ExitSheet } from '../../components/ExitSheet';

import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

import * as Crypto from 'expo-crypto';
import { KeyboardAvoidingView, Platform, Keyboard, EmitterSubscription } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const telas = [
    { cadastro: 'Como posso te chamar?', key: 'nome', placeholder: 'Digite seu nome' },
    { cadastro: 'Quantos anos você tem?', key: 'idade', placeholder: 'Digite sua idade' },
    { cadastro: 'Digite seu email', key: 'email', placeholder: 'Ex: ravisoares08@gmail.com' },
    { cadastro: 'Digite seu celular', key: 'telefone', placeholder: 'Ex: (+55) 71 XXXX-XXXX' },
    { cadastro: 'Escolha um nome de usuário', key: 'usuario', placeholder: 'Ex: ravitos1929' },
    { cadastro: 'Digite sua senha', key: 'senha', placeholder: 'Dica: utilize letras, números e símbolos', secureTextEntry: true },
    { cadastro: 'parabens', key: 'parabens'},
];

type RootStackParamList = {
    Apresentacao: undefined,
    Cadastro: undefined,
    Login: undefined,
}

type CadastroScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Cadastro'>;
}

export default function Cadastro({ navigation }: CadastroScreenProps) {
    
    const [showExitSheet, setShowExitSheet] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [campoValido, setCampoValido] = useState(false);
    
    const [telaAtual, setTelaAtual] = useState(0);
    const [erroUsuario, setErroUsuario] = useState('');

    const [dados, setDados] = useState<Record<string, string>>({});

    const translateX = useRef(new Animated.Value(0)).current;
    const [keyboardOffset] = useState(new Animated.Value(0));

    useEffect(() => {
     
        const validarCamposSenha = async () => {
            if (telaAtual === telas.length - 2) {
                const senhaValida = await validarCampoAtual('senha', dados.senha || '');
                const confirmacaoValida = dados.senha === dados.confirmarSenha;
                setCampoValido(senhaValida && confirmacaoValida);
            }
        };
     
        validarCamposSenha();
    }, [dados.senha, dados.confirmarSenha, telaAtual]);

    React.useEffect(() => {

        let keyboardDidShowListener: EmitterSubscription;
        let keyboardDidHideListener: EmitterSubscription;

        keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
            Animated.timing(keyboardOffset, {
                toValue: event.endCoordinates.height + 20,
                duration: 300,
                useNativeDriver: false,
            }).start();
        });

        keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            Animated.timing(keyboardOffset, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    function handleConfirmExit() {
        setShowExitSheet(false);
        navigation.goBack();
    }

    function gerarSenha() {
        const novaSenha = Math.random().toString(36).slice(-10);
        setDados((prev) => ({
            ...prev,
            senha: novaSenha,
            confirmarSenha: novaSenha,
        }));
    }

    const abrirAviso = useCallback(() => {
        setShowExitSheet(true);
    }, []);

    const fecharAviso = useCallback(() => {
        setShowExitSheet(false);
    }, []);

    const avancar = async() => {

        const chave = telas[telaAtual].key;
        const valor = dados[chave];

        const valido = await validarCampoAtual(chave, valor);
        if (!valido) {
            Alert.alert('Campo inválido', 'Erro');
            return;
        }

        if (telaAtual < telas.length - 1) {
            Animated.timing(translateX, {
                toValue: -(telaAtual + 1) * width,
                duration: 300,
                useNativeDriver: true,
            }).start();
            const proximaTela = telaAtual + 1;
            const proximaChave = telas[proximaTela].key;
            const proximoValor = dados[proximaChave] || '';
            const validoProximo = await validarCampoAtual(proximaChave, proximoValor);
            setCampoValido(validoProximo);
            setTelaAtual(proximaTela);
        }
    };

    const validarCampoAtual = async (chave: string, valor: string) => {

        if (!valor || valor.trim() === '') {
            return false;
        }

        if (chave === 'nome') {
            const apenasLetras = /^[A-Za-zA-ÿ\s]+$/;
            return apenasLetras.test(valor);
        }

        if (chave === 'idade' || chave === 'telefone') {
            const apenasNumeros = /^[0-9]+$/;
            return apenasNumeros.test(valor);
        }

        if (chave === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(valor);
        }

        if (chave === 'usuario') {

            const querySnapshot = await getDocs(
                query(collection(db, 'usuarios'), where('usuario', '==', valor))
            );

            const usuarioExiste = !querySnapshot.empty;

            if (usuarioExiste) {

                setErroUsuario('O nome de usuário já está em uso.');
                return false;
                
            } else {
                setErroUsuario('');
                return true;
            }
        }

        if (chave === 'senha') {
            const senhaRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;
            return senhaRegex.test(valor);
        }

        if (chave === 'confirmarSenha') {
            return valor === dados.senha && valor.length >= 6; 
        }

        return true;
    };

    const voltar = () => {
        if (telaAtual > 0) {
            Animated.timing(translateX, {
                toValue: -(telaAtual - 1) * width,
                duration: 300,
                useNativeDriver: true,
            }).start();
            setTelaAtual(telaAtual - 1);
        }
    };

    const salvarFirestore = async () => {
        const senhaValida = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;
 
        if (dados.senha !== dados.confirmarSenha) {
            Alert.alert('Erro', `As senhas não conferem.`);
            return;
        }

        if (!senhaValida.test(dados.senha)) {
            Alert.alert('Erro', 'A senha deve conter letras, números e pelo menos 6 caracteres.');
            return;
        }

        try {

            const senhaCriptografada = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                dados.senha
            );

            const docRef = await addDoc(collection(db, 'usuarios'), {
                nome: dados.nome,
                idade: dados.idade,
                email: dados.email,
                telefone: dados.telefone,
                usuario: dados.usuario,
                senha: senhaCriptografada,
                criadoEm: new Date(),
                ultimoLogin: new Date(),
            });

            await AsyncStorage.setItem('userId', docRef.id);

            Animated.timing(translateX, {
                toValue: -(telas.length -1) * width,
                duration: 300,
                useNativeDriver: true,
            }).start();
           
            setTelaAtual(telas.length -1);
            
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar os dados');
            console.log(error);
        }
    };

    const [pressLoaded] = usePress({ PressStart2P_400Regular });
    const [jerseyLoaded] = useJersey({ Jersey10_400Regular });
    const [interLoaded] = useInter({ Inter_400Regular });
    const [inriaLoaded] = useInria({ InriaSans_400Regular});

    if (!pressLoaded || !jerseyLoaded || !interLoaded || !inriaLoaded) return null;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableOpacity style={{ position: 'absolute', top: 40, right: 15, zIndex: 10 }} onPress={abrirAviso}>
                <Text style={ { color: 'white', fontSize: 20, fontFamily: 'PressStart2P_400Regular',}}>X</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 50, marginTop: 20 }}>
                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${((telaAtual + 1) / telas.length) * 100}%` }]} />
                </View>
            </View>

            <Animated.View style={[ styles.slider, { transform: [{ translateX }] }]}>
                {telas.map((tela, index) => (
                    <View key={index} style={styles.tela}>
                        <View style={{ width: '90%' }}>

                            {tela.key === 'parabens' ? (
                                <>

                                <Text style={[styles.pergunta, { fontSize: 40, color: 'white', marginTop: 100}]}> Parabéns, <Text style={{ color: '#8581FF'}}>{dados.nome}</Text> !</Text>
                                <View style={{ width: 200, height: 200, position: 'absolute', top: 180, left: 50, zIndex: 10}}>
                                    <ImageBackground source={require('../../../assets/images/balao-3.png')} style={styles.balao}>
                                    <Text style={styles.parabens}>
                                    Obaaaa, seu cadastro foi criado com sucesso! Agora vamos começar seus estudos :) </Text>
                                    </ImageBackground>
                                </View>
                                </>
                                
                            ) : (
                                <>

                                <Text style={styles.pergunta}>{tela.cadastro}</Text>

                                <View style={styles.inputContainer}>

                                {tela.key === 'senha' ? (
                                <>
                              
                                <View style={styles.inputContainer}>

                                    <TextInput style={styles.input} value={dados['senha'] || ''}

                                    onChangeText={async (texto) => { setDados({ ...dados, senha: texto});
                                        const valido = await validarCampoAtual('senha', texto);
                                        const confirmacaoValida = dados.confirmarSenha === texto;
                                        setCampoValido(valido && confirmacaoValida);
                                    }}

                                    placeholder='Dica: Utilize letras, números e símbolos' placeholderTextColor={'#aaa'} secureTextEntry={!mostrarSenha} />

                                    {dados['senha'] && (
                                        <TouchableOpacity onPress={() => setDados({ ...dados, senha: ''})} style={styles.limpar}>
                                            <Text style={styles.limparTexto}>x</Text>
                                        </TouchableOpacity>
                                    )}

                               </View>
                               
                               <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingBottom: 30, justifyContent: 'space-between'}}>
                                   <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={{ flexDirection: 'row', alignItems: 'center'}}>
                                       <View style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#8581FF', backgroundColor: mostrarSenha ? 'white' : '#8581FF', marginRight: 5,}} />
                                       <Text style={{ color: 'white', fontFamily: 'Inter_400Regular'}}> {mostrarSenha ? 'Ocultar senha' : 'Exibir senha'} </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={gerarSenha} style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Image source={require('../../../assets/images/chave-2.png')} style={{width: 16, height: 16, marginRight: 5}}/>
                                        <Text style={{ color: '#8581FF', fontWeight: 'bold', fontFamily: 'Inter_400Regular'}}> Gerar senha forte </Text>
                                    </TouchableOpacity>

                                </View>

                                <Text style={styles.pergunta}> Confirmar senha </Text>

                                <View style={[ styles.inputContainer, { marginTop: 15}]}>

                                    <TextInput style={styles.input} value={dados['confirmarSenha'] || ''}

                                    onChangeText={async (texto) => { setDados({ ...dados, confirmarSenha: texto});
                                        const valido = await validarCampoAtual('confirmarSenha', texto);
                                        const senhaValida = dados.senha === texto;
                                        setCampoValido(valido && senhaValida);
                                    }} />
                                    
                                    {dados['confirmarSenha'] && (
                                        <TouchableOpacity onPress={() => setDados({ ...dados, confirmarSenha: ''})} style={styles.limpar}>
                                            <Text style={styles.limparTexto}> x </Text>
                                        </TouchableOpacity>
                                    )}

                                </View> 
                                </>

                            ) : (

                            <View style={styles.inputContainer}>
                                <TextInput style={styles.input} value={dados[tela.key] || ''}
                                onChangeText={async (texto) => { setDados({ ...dados, [tela.key]: texto});
                                    const valido = await validarCampoAtual(tela.key, texto); setCampoValido(valido);
                                }} placeholder={tela.placeholder} placeholderTextColor='#aaa' secureTextEntry={tela.secureTextEntry || false} />
                                
                                {dados[tela.key] && (
                                    <TouchableOpacity onPress={() => setDados({ ...dados, [tela.key]: ''})} style={styles.limpar}>
                                        <Text style={styles.limparTexto}> x </Text>
                                    </TouchableOpacity>
                                )}    

                            </View>
                            )}

                            {tela.key === 'usuario' && erroUsuario !== '' && (
                                <Text style={{ color: 'white', marginTop: 5, fontSize: 14, fontFamily: 'Inter_400Regular', paddingLeft: 5}}> {erroUsuario} </Text>
                            )}

                            </View>
                                </>
                            )}

                        </View>
                    </View>
                ))}

            </Animated.View>

            <View style={styles.imageContainer}>
                <Image source={require('../../../assets/images/personagem.png')} style={[styles.boneco, telaAtual === 6 ? { height: 300, width: 300, left: '20%',} : {}]} resizeMode="contain" />
            </View>

            <Animated.View style={[styles.botoesContainer, { justifyContent: telaAtual === 0 ? 'center' : 'space-between',
                bottom: Animated.add(keyboardOffset, new Animated.Value(50)),} ]}>

                {telaAtual > 0 && (

                    <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
                        <Text style={{ fontFamily: 'Jersey10_400Regular', color: '#fff', fontSize: 25 }}> &lt;- </Text>
                    </TouchableOpacity>
                )}

                {telaAtual < telas.length - 1 ? (

                    <TouchableOpacity onPress={telaAtual === telas.length - 2 ? salvarFirestore : avancar} style={[telaAtual === 0 ?
                    styles.botaoProximoFull : styles.botaoProximo, { backgroundColor: campoValido ? 'white' : '#bdbebd'}]} disabled={!campoValido}>
                        <Text style={{ fontFamily: 'Jersey10_400Regular', fontSize: 35, color: campoValido ? '#221377': '#949494',
                        textAlign: 'center',}}> {telaAtual === telas.length - 2 ? 'Finalizar' : 'Próximo'} </Text>
                    </TouchableOpacity>

                ) : (
                    <TouchableOpacity onPress={() => navigation.navigate('MainTabs' as never)} style={[styles.botaoProximo,{ backgroundColor: 'white' }]}>
                        <Text style={{ fontFamily: 'Jersey10_400Regular', fontSize: 35, color: '#221377', textAlign: 'center',}}> Finalizar </Text>
                    </TouchableOpacity>
                )}
                
            </Animated.View>

            {showExitSheet && (
                <View style={styles.overlay}>
                    <ExitSheet fecharTela={() => setShowExitSheet(false)} confirmarSaida={handleConfirmExit} />
                </View>    
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#221377',
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 20,
        position: 'relative',
    },

    progressBarContainer: {
        width: '90%',
        height: 17,
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
    },

    progressBar: {
        height: '100%',
        backgroundColor: '#4D48C8',
        borderRadius: 10,
    },

    slider: {
        flexDirection: 'row',
        width: width * telas.length,
        alignItems: 'flex-start',
    },

    tela: {
        width: width,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },

    pergunta: {
        fontFamily: 'Jersey10_400Regular',
        fontSize: 35,
        color: '#8581FF',
        marginBottom: 20,
        alignSelf: 'flex-start',
    },

    inputContainer: {
        position: 'relative',
        width: '100%',
    },

    input: {
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 10,
        fontSize: 16,
        width: '100%',
    },

    limpar: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -10 }],
        backgroundColor: '#CECECE',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    limparTexto: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 14,
        fontFamily: 'Inter_400Regular',
    },

    imageContainer: {
        position: 'absolute',
        bottom: 80,
        right: '55%',
    },

    boneco: {
        width: 200,
        height: 200,
    },

    botoesContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    botaoVoltar: {
        backgroundColor: '#8581FF',
        borderRadius: 20,
        width: 40,
        height: 31,
        paddingHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },

    botaoProximoFull: {
        width: '100%',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },

    botaoProximo: {
        width: '85%',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        borderRadius: 20,
        alignItems: 'center',
    },

    overlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        top: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        zIndex: 999,
    },

    balao: {
        width: 280,
        height: 250,
        justifyContent: 'space-between',
        alignContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 10,
    },

    parabens: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        color: 'black',
        lineHeight: 30,
        textAlign: 'justify',
        maxWidth: '90%',
        position: 'absolute',
        top: 65,
        left: 20,
        right: 20,
    }
})
