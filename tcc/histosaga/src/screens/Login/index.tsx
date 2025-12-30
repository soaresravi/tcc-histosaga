import React, { useEffect, useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ImageBackground, Animated } from 'react-native';
import { useNavigation } from "@react-navigation/native";

import { useFonts as usePress, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts as useJersey, Jersey10_400Regular } from '@expo-google-fonts/jersey-10'
import { useFonts as useJersey15, Jersey15_400Regular } from '@expo-google-fonts/jersey-15';

import { WINDOW_WIDTH } from "@gorhom/bottom-sheet";

import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Crypto from 'expo-crypto';

import { KeyboardAvoidingView, Platform, Keyboard, EmitterSubscription } from 'react-native';

async function validarLogin(usuario: string, senha: string) {
   
    const senhaHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, senha);
   
    const q = query(
  
        collection(db, 'usuarios'),
       
        where('usuario', '==', usuario),
        where('senha', '==', senhaHash)
  
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
       
        const docSnap = querySnapshot.docs[0];
        const userId = docSnap.id;
        const userRef = doc(db, 'usuarios', userId);
     
        await updateDoc(userRef, {
            ultimoLogin: serverTimestamp()
        });
        
        return userId;
    }
    
    return null;
}

export default function Cadastro() {
    
    const navigation = useNavigation();

    const [pressLoaded] = usePress({ PressStart2P_400Regular });
    const [jerseyLoaded] = useJersey({ Jersey10_400Regular });
    const [jersey15Loaded] = useJersey15({ Jersey15_400Regular});

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [mensagemErro, setMensagemErro] = useState('');

    const [keyboardOffset] = useState(new Animated.Value(0));

    useEffect(() => {
       
        let keyboardDidShowListener: EmitterSubscription;
        let keyboardDidHideListener: EmitterSubscription;

        keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
            Animated.timing(keyboardOffset, {
                toValue: event.endCoordinates.height,
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

    }, [keyboardOffset]);

    const handleLogin = async () => {
        setMensagemErro(''); 

        if (!usuario || !senha) {
            setMensagemErro('Preencha todos os campos');
            return;
        }

        const userId = await validarLogin(usuario, senha);

        if (userId) {
           
            await AsyncStorage.setItem("userId", userId);
            navigation.navigate('MainTabs' as never);
       
        } else {
            setMensagemErro('Usuário ou senha incorretos');
        }
    };

    if (!pressLoaded || !jerseyLoaded || !jersey15Loaded) return null;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            
            <Animated.View style={{ transform: [{ translateY: Animated.multiply(keyboardOffset, 0.1) }]}}>
                <Text style={{ fontFamily: 'Jersey15_400Regular', fontSize: 90, color: 'white', textAlign: 'center', paddingTop: 20}}> LOGIN </Text>
            </Animated.View>   

            <Animated.View style={[styles.form, { transform: [{ translateY: Animated.multiply(keyboardOffset, -0.3) }]}]}>
                <View style={styles.usuarioContainer}>
                    
                    <Text style={styles.label}> USUÁRIO </Text>

                    <View style={styles.livroContainer}>
                        <ImageBackground source={require('../../../assets/images/livro-amarelo.png')} style={styles.livro}> </ImageBackground>
                    </View>

                </View>

                <TextInput style={[ styles.input, mensagemErro && styles.inputInvalido ]} placeholder='ravito123' placeholderTextColor={'#4D48C8'} 
                value={usuario} onChangeText={(text) => { setUsuario(text); setMensagemErro(''); }} />

                <Text style={styles.label}> SENHA </Text>

                <TextInput style={[ styles.input, {marginBottom: 10}, mensagemErro && styles.inputInvalido ]} placeholder='Digite sua senha' 
                placeholderTextColor={'#4D48C8'} secureTextEntry={!mostrarSenha} value={senha} onChangeText={(text) => { setSenha(text);
                setMensagemErro('');
            }} />

            {mensagemErro ? <Text style={styles.erroTexto}>{mensagemErro}</Text> : null}

                <View style= {{flexDirection: 'row', alignItems: 'center', marginBottom: 30, justifyContent: 'space-between', width: '95%', alignSelf: 'center'}}>
                  
                    <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={{ flexDirection: 'row', alignItems: 'center'}}>
                        <View style={{ width: 18, height: 18, borderWidth: 2, marginStart: 0, borderColor: '#8581FF', backgroundColor: mostrarSenha ? 'white' : '#8581FF', marginRight: 5,}} />
                        <Text style={{ color: 'white', fontFamily: 'Inter_400Regular'}}> {mostrarSenha ? 'Ocultar senha' : 'Exibir senha'} </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => (navigation.navigate('EsqueciSenha' as never))}>
                        <Text style={{ color: 'white', fontSize: 12}}> Esqueceu a senha? </Text>
                    </TouchableOpacity>
                
                </View>
            </Animated.View>

            <Animated.View style={{ transform: [{ translateY: Animated.multiply(keyboardOffset, -0.3) }]}}>
               
                <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: 'white', borderRadius: 30, marginTop: 20, width: '80%', alignSelf: 'center', paddingVertical: 5}}>
                    <Text style={{ fontFamily: 'Jersey10_400Regular', fontSize: 50, color: '#221377', textAlign: 'center'}}> LOGIN </Text>
                </TouchableOpacity>
           
            </Animated.View>

            <Animated.View style={[styles.imageContainer, { opacity: keyboardOffset.interpolate ({ inputRange: [0,100], outputRange: [1,0],
            extrapolate: 'clamp'} )}]}>
                
                <ImageBackground source={require('../../../assets/images/personagem.png')} style={styles.personagem}> </ImageBackground>
          
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    inputInvalido: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFE6E6',
    },

    container: {
        flex: 1,
        backgroundColor: '#221377',
        padding: 20,
    },

    form: {
        alignItems: 'flex-start',
        width: '100%',
        justifyContent: 'center',
        paddingTop: '20%',
    },
    
    label: {
        fontFamily: 'Jersey10_400Regular',
        fontSize: 60,
        color: '#8581FF',
        marginBottom: 10,
        width: '100%',
    },

    input: {
        borderRadius: 40,
        backgroundColor: 'white',
        width: '95%',
        marginBottom: 30,
        fontSize: 14,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginLeft: '3%',
        borderWidth: 2,
        borderColor: '#8581FF', 
    },

    erroTexto: {
        color: '#FF6B6B',
        fontSize: 14,
        fontFamily: 'InriaSans_400Regular',
        paddingLeft: 15,
        paddingBottom: 20,
        width: '100%',
    },

    usuarioContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        width: '100%',
    },

    livroContainer: {
        position: 'absolute',
        right: WINDOW_WIDTH * 0.0010,
        top: 5,

    },

    livro: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },

    imageContainer: {
        position: 'absolute',
        bottom: 20,
        right: '55%',
    },

    personagem: {
        width: 200,
        height: 200,
        resizeMode: 'contain'
    },
});