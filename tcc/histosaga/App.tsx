import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useFonts as usePress, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts as useVT323, VT323_400Regular } from '@expo-google-fonts/vt323';
import { useFonts as useInter, Inter_400Regular } from '@expo-google-fonts/inter';
import { useFonts as useInria, InriaSans_400Regular} from '@expo-google-fonts/inria-sans';

import { syncOfflineData } from './services/syncService';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/config/firebase';

import Cadastro from './src/screens/Cadastro/index';
import Login from './src/screens/Login/index';
import Home from './src/screens/apresentacao';
import TelaInicial from './src/screens/TelaInicial';
import TelaAtividades from './src/screens/TelaAtividades';
import EsqueciSenha from './src/screens/Login/EsqueciSenha';
import VerificarCodigo from './src/screens/Login/VerificarCodigo';
import NovaSenha from './src/screens/Login/NovaSenha';
import TabNavigator from './src/screens/TabNavigator';
import Configuracoes from './src/screens/TelaInicial/Configuracoes';
import Notificacoes from './src/screens/TelaInicial/Notificacoes';
import EditarPerfil from './src/screens/TelaInicial/EditarPerfil';
import RedefinirSenha from './src/screens/TelaInicial/RedefinirSenha';
import Resumo from './src/screens/Resumo';
import DetalhesFontes from './src/screens/DetalhesFontes';

const Stack = createNativeStackNavigator();

const USER_ID_KEY = 'userId';
const FIRST_ACESS_KEY = 'firstAccess';

export type RootStackParamList = {

  Apresentacao: undefined;
  Cadastro: undefined;
  Login: undefined;
  MainTabs: undefined; 
  telaInicial: { materia?: string };
  TelaAtividades: { materia: string; atividadeId: string };
  EsqueciSenha: undefined;
  VerificarCodigo: { usuarioId: string; email: string };
  NovaSenha: { usuarioId: string };
  Resumo: undefined;
  
  DetalhesFontes: { 

    tipo: 'aviso' | 'atividade';
    titulo?: string;
    conteudo?: string;
    atividade?: any;

  };

};

export default function App() {
  
  const [fontsLoaded] = useFonts({ VT323_400Regular, PressStart2P_400Regular, Inter_400Regular, InriaSans_400Regular });

  function useFonts(fontMap: any) {
    
    const [vt323Loaded] = useVT323({ VT323_400Regular: fontMap.VT323_400Regular });
    const [pressLoaded] = usePress({ PressStart2P_400Regular: fontMap.PressStart2P_400Regular });
    const [interLoaded] = useInter({ Inter_400Regular: fontMap.Inter_400Regular });
    const [inriaLoaded] = useInria({ InriaSans_400Regular: fontMap.InriaSans_400Regular });
    
    return [vt323Loaded && pressLoaded && interLoaded && inriaLoaded];

  }

  const [rotaInicial, setRotaInicial] = useState<string | null>(null);
  const [checarLogin, setChecarLogin] = useState(true);

  const checarUltimoLogin = async (userId: string) => {
   
    try {
     
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
     
      if (userDoc.exists()) {
       
        const userData = userDoc.data();
        const ultimoLogin = userData.ultimoLogin;
      
        if (ultimoLogin) {
         
          const tempoUltimoLogin = ultimoLogin.toDate().getTime();
          const currentTime = new Date().getTime();
          const semanaMilisegundos = 7 * 24 * 60 * 60 * 1000;
         
          return currentTime - tempoUltimoLogin <= semanaMilisegundos;
        }
      }

      return false;
    
    } catch (error) {

      console.error('Erro ao verificar último login: ', error);
      return false;

    }
  };

  const checarAutenticacao = async () => {
   
    try {
     
      const primeiroAcesso = await AsyncStorage.getItem(FIRST_ACESS_KEY);
     
      if (!primeiroAcesso) {
       
        await AsyncStorage.setItem(FIRST_ACESS_KEY, 'false');
       
        setRotaInicial('Apresentacao');
        setChecarLogin(false);
        
        return;
      }

      const userId = await AsyncStorage.getItem(USER_ID_KEY);

      if (!userId) {
        
        setRotaInicial('Login');
        setChecarLogin(false);
        
        return;
      }

      const loginValido = await checarUltimoLogin(userId);

      if (loginValido) {
       
        setRotaInicial('MainTabs');
     
      } else {
        await AsyncStorage.removeItem(USER_ID_KEY);
        setRotaInicial('Login');
      }
   
    } catch (error) {
      console.error('Erro ao verificar autenticação: ', error);
      setRotaInicial('Apresentacao');
  
    } finally {
      setChecarLogin(false);
    }
  };

  useEffect(() => {
    checarAutenticacao();
  }, []);

  useEffect(() => {
   
    const unsubscribe = NetInfo.addEventListener(state => {
     
      if (state.isConnected) {
        syncOfflineData();
      
      }

    });

    return () => unsubscribe();

  }, []);

  if (!fontsLoaded || checarLogin) {
    
    return (
      
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#221377' }}>
        <Text style={{ color: 'white', fontSize: 30, textAlign: 'center'}}>Carregando...</Text>
      </GestureHandlerRootView>
    
    );
  }

  return (

    <GestureHandlerRootView style={{ flex: 1 }}>
      
      <NavigationContainer>
        
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={rotaInicial as keyof RootStackParamList}>
          
          <Stack.Screen name="Apresentacao" component={Home} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="telaInicial" component={TelaInicial} /> 
          <Stack.Screen name="TelaAtividades" component={TelaAtividades} />
          <Stack.Screen name="EsqueciSenha" component={EsqueciSenha} />
          <Stack.Screen name="VerificarCodigo" component={VerificarCodigo as any} />
          <Stack.Screen name="NovaSenha" component={NovaSenha as any} />
          <Stack.Screen name="Configuracoes" component={Configuracoes} />
          <Stack.Screen name="Notificacoes" component={Notificacoes} />
          <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
          <Stack.Screen name="RedefinirSenha" component={RedefinirSenha} />
          <Stack.Screen name="Resumo" component={Resumo} />
          <Stack.Screen name="DetalhesFontes" component={DetalhesFontes} />

        </Stack.Navigator>
        
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
