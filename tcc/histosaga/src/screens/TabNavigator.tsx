import React from 'react';
import { Image }from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TelaInicial from './TelaInicial/index';
import Perfil from './Perfil';
import Resumo from './Resumo';
import Conquistas from './Conquistas';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  
    return (
   
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#1A156B', borderTopColor: '#676565', borderTopWidth: 1, },
    tabBarActiveTintColor: '#8581FF', tabBarInactiveTintColor: 'white',  tabBarShowLabel: false}}>
      
      <Tab.Screen name="Inicio" component={TelaInicial} options={{ tabBarIcon: ({ size }) => (
        <Image source={require('../../assets/images/home.png')} style={{ width: 35, height: 35 }} />
    ), }}
    />
    
    <Tab.Screen name="Resumo" component={Resumo} options={{ tabBarIcon: ({ size }) => (
        <Image source={require('../../assets/images/historia.png')} style={{ width: 35, height: 35 }} />
    ), }}
    />

    <Tab.Screen name="Conquistas" component={Conquistas} options={{ tabBarIcon: ({ size }) => (
        <Image source={require('../../assets/images/trofeu.png')} style={{ width: 35, height: 35 }} />
    ), }}
    />

    <Tab.Screen name="Perfil" component={Perfil} options={{ tabBarIcon: ({ size }) => (
        <Image source={require('../../assets/images/icon.png')} style={{ width: 35, height: 35 }} />
    ), }}
    />

    </Tab.Navigator>
  );
}