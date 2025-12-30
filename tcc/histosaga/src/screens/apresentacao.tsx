import React from 'react';
import { StyleSheet, Text, View, ScrollView, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Apresentacao: undefined;
  Cadastro: undefined;
  Login: undefined;
  telaInicial: undefined,
};

type ApresentacaoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Apresentacao'>;
};

export default function Apresentacao({ navigation }: ApresentacaoScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleBlock}>
          <View style={styles.titleContainer}>
            <Text style={{fontFamily: 'PressStart2P_400Regular', fontSize: 24, color: 'white'}}> HistoSaga </Text>
            <Image source={require('../../assets/images/livro-amarelo.png')} style={styles.livro} />
          </View>
          <Image source={require('../../assets/images/estrelas3.png')} style={styles.estrelas} />
        </View>
      </ScrollView>

      <ImageBackground source={require('../../assets/images/balao-3.png')} style={styles.balao}>
        <Text style={styles.boasVindas}> Olá! Bem vindo ao HistoSaga! Aqui você finalmente vai aprender as ciências humanas sem te entediar!! </Text>
      </ImageBackground>

      <View style={styles.botoesContainer}>
        <TouchableOpacity style={[styles.botao, styles.botao1]} onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.botaoTexto1}> Vamos começar! </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.botao, styles.botao2]} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.botaoTexto2}> Já sou cadastrado </Text>
        </TouchableOpacity>
      </View>

      <Image source={require('../../assets/images/animacao.png')} style={styles.boneco} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#221377',
    position: 'relative',
  },
  contentContainer: {
    paddingTop: 20,
    alignItems: 'center',
    paddingBottom: 220,
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  livro: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  estrelas: {
    width: 400,
    height: 250,
    resizeMode: 'contain',
    paddingLeft: 2,
  },
  boneco: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  balao: {
    width: '90%',
    height: 280,
    resizeMode: 'contain',
    position: 'absolute',
    bottom: 200,
    left: '5%',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  boasVindas: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'black',
    lineHeight: 25,
    textAlign: 'justify',
    maxWidth: '85%',
  },
  botoesContainer: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    gap: 10,
    zIndex: 2,
  },
  botao: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    alignItems: 'center',
  },
  botao1: {
    backgroundColor: 'white',
  },
  botao2: {
    backgroundColor: '#4D48C8',
  },
  botaoTexto1: {
    color: '#4D48C8',
    fontFamily: 'VT323_400Regular',
    fontSize: 24,
  },
  botaoTexto2: {
    color: 'white',
    fontFamily: 'VT323_400Regular',
    fontSize: 24,
  },
});
