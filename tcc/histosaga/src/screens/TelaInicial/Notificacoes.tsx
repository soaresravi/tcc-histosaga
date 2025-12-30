import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  
  handleNotification: async () => ({
   
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true,   
 
  } as Notifications.NotificationBehavior),
});

export default function Notificacoes() {
    
  const navigation = useNavigation();

  const [configuracoes, setConfiguracoes] = useState({
    notificacoesAtivas: false,
    lembreteManha: false,
    lembreteTarde: false,
    lembreteNoite: false,
  });

  useEffect(() => {
    carregarConfiguracoes();
    pedirPermissaoNotificacoes();
  }, []);

  const pedirPermissaoNotificacoes = async () => {
      
    const { status } = await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Não será possível enviar notificações');
    } else {
      Alert.alert('✅ Permissão concedida', 'Notificações ativadas!');
    }

  };

  const carregarConfiguracoes = async () => {
     
    try {
        
      const salvo = await AsyncStorage.getItem('@config_notificacoes');
          
      if (salvo) {
        setConfiguracoes(JSON.parse(salvo));
      }

    } catch (error) {
      console.error('Erro ao carregar configurações: ', error);
    }
  };

  const salvarConfiguracoes = async (novasConfig: typeof configuracoes) => {
      
    try {
        
      await AsyncStorage.setItem('@config_notificacoes', JSON.stringify(novasConfig));
      setConfiguracoes(novasConfig);
      await gerenciarNotificacoes(novasConfig);
      
    } catch (error) {
      console.error('Erro ao salvar notificações: ', error);
      
    }
  }

  const gerenciarNotificacoes = async (config: typeof configuracoes) => {
      
    await Notifications.cancelAllScheduledNotificationsAsync();
        
    if (!config.notificacoesAtivas) {
      return;
    }

    if (config.lembreteManha) {
        
      await agendarNotificacaoDiaria(

        'Hora de estudar! 📚',
        'Que tal revisar algum conteúdo histórico?',
        9, 0

      );
    }
      
    if (config.lembreteTarde) {
        
      await agendarNotificacaoDiaria(
         
        'Continue aprendendo! 🎯',
        'Não deixe seu progresso parar!',
        15, 0

      );
    }
      
    if (config.lembreteNoite) {
        
      await agendarNotificacaoDiaria(
          
        'Última chance hoje! 🌙',
        'Complete mais uma atividade antes de dormir',
        20, 0

      );
    }

  };
  
  const agendarNotificacaoDiaria = async (titulo: string, corpo: string, hora: number, minuto: number) => {
        
    try {
        
      const dataAmanha = new Date();
      
      dataAmanha.setDate(dataAmanha.getDate() + 1);
      dataAmanha.setHours(hora, minuto, 0, 0);

      await Notifications.scheduleNotificationAsync({
          
        content: {

          title: titulo,
          body: corpo,
          sound: true,
          data: { type: 'lembrete_estudo' },

        },
          
        trigger: {
           
          type: 'date',
          date: dataAmanha,
          repeats: true,
         
        } as any, 

      });

    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro desconhecido');
    }
  };

  const testarNotificacao = async () => {
      
    try {    
        
      await Notifications.scheduleNotificationAsync({
          
        content: {
           
          title: '🧪 Teste de Notificação',
          body: 'Esta é uma notificação de teste! Funcionou! 🎉',
          sound: true,
          data: { type: 'teste' },
         
        },
          
        trigger: {

          type: 'timeInterval',
          seconds: 5,
          repeats: false,
          
        } as any, 

      });
            
    } catch (error: any) { 
        console.error('Erro no teste:', error);
        Alert.alert('Erro', error.message || 'Falha ao agendar notificação de teste');
    }
  };

  const toggleConfiguracao = (chave: keyof typeof configuracoes) => {
      
    const novasConfig = { ...configuracoes, [chave]: !configuracoes[chave]};
        
      if (chave === 'notificacoesAtivas' && !novasConfig.notificacoesAtivas) {
         
        novasConfig.lembreteManha = false;
        novasConfig.lembreteTarde = false;
        novasConfig.lembreteNoite = false;
        
      }

      salvarConfiguracoes(novasConfig);
  };

  const ItemConfiguracao = ({
     
    titulo,
    descricao,
    valor,
    onToggle,
    desabilitado = false
  
  } : {
      
    titulo: string;
    descricao: string;
    valor: boolean;
    onToggle: () => void;
    desabilitado?: boolean;
    
  }) => (
  
  <View style={[styles.itemContainer, desabilitado && styles.itemDesabilitado]}>
      
    <View style={styles.itemInfo}>
        <Text style={styles.itemTitulo}>{titulo}</Text>
        <Text style={styles.itemDescricao}>{descricao}</Text>
    </View>
        
    <Switch value={valor} onValueChange={onToggle} disabled={desabilitado} trackColor={{ false: '#767577', true: '#00E69D' }}
    thumbColor={valor ? '#FFFFFF' : '#f4f3f4'} />
    
  </View>
  );

  return (
    <View style={styles.container}>
        
      <View style={styles.header}>
        <Text style={styles.titulo}>Notificações</Text>
      </View>

      <ScrollView style={styles.conteudo}>
         
        {/*<TouchableOpacity style={styles.botaoTeste} onPress={testarNotificacao}>*/}
          {/*<Text style={styles.botaoTesteTexto}>🧪 Testar Notificação (5 segundos)</Text>*/}
        {/*</TouchableOpacity>*/}

        <View style={styles.secao}>
                    
          <ItemConfiguracao titulo="📢 Notificações Ativas" descricao="Ativar/desativar todas as notificações" valor={configuracoes.
          notificacoesAtivas} onToggle={() => toggleConfiguracao('notificacoesAtivas')} />

          <ItemConfiguracao titulo="🌅 Manhã (9:00)" descricao="Lembrete para começar o dia estudando" valor={configuracoes.lembreteManha}
          onToggle={() => toggleConfiguracao('lembreteManha')} desabilitado={!configuracoes.notificacoesAtivas} />

          <ItemConfiguracao titulo="☀️ Tarde (15:00)" descricao="Lembrete para continuar os estudos" valor={configuracoes.lembreteTarde}
          onToggle={() => toggleConfiguracao('lembreteTarde')} desabilitado={!configuracoes.notificacoesAtivas} />

          <ItemConfiguracao titulo="🌙 Noite (20:00)" descricao="Lembrete final do dia" valor={configuracoes.lembreteNoite} onToggle={() =>
          toggleConfiguracao('lembreteNoite')} desabilitado={!configuracoes.notificacoesAtivas} />
          
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTexto}> 💡 As notificações vão te ajudar a manter uma rotina de estudos consistente! </Text>
        </View>

      </ScrollView>
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

    secao: {
      marginBottom: 30,
    },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
    },

    itemDesabilitado: {
      opacity: 0.5,
    },

    itemInfo: {
      flex: 1,
    },

    itemTitulo: {
      color: 'white',
      fontSize: 20,
      fontFamily: 'Jersey10_400Regular',
      marginBottom: 4,
    },

    itemDescricao: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 12,
      fontFamily: 'InriaSans_400Regular',
    },

    botaoTeste: {
      backgroundColor: '#8581FF',
      padding: 15,
      borderRadius: 30,
      alignItems: 'center',
       marginBottom: 20,
    },

    botaoTesteTexto: {
      color: 'white',
      fontSize: 16,
      fontFamily: 'Jersey10_400Regular',
    },

    infoBox: {
      backgroundColor: 'rgba(0, 230, 157, 0.1)',
      padding: 15,
      borderRadius: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#00E69D',
    },

    infoTexto: {
      color: 'white',
      fontSize: 14,
      fontFamily: 'InriaSans_400Regular',
      textAlign: 'center',
    },
});