import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Fonte {

  titulo: string;
  url: string;

}

interface Questao {
  
  id: string;
  fonte?: string | Fonte[];
  enunciado?: string;

}

interface Atividade {

  id: string;
  nome: string;
  posicao?: number;
  questoes: Questao[];

}

type RootStackParamList = {

  Resumo: undefined;

  DetalhesFontes: { 

    tipo: 'aviso' | 'atividade';
    titulo?: string;
    conteudo?: string;
    atividade?: Atividade;

  };

};

type ResumoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Resumo'>;

export default function Resumo() {

  const navigation = useNavigation<ResumoScreenNavigationProp>();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarAtividades();
  }, []);

  const carregarAtividades = async () => {
    
    try {

      const atividadesRef = collection(db, 'atividades');
      const q = query(atividadesRef, orderBy('posicao', 'asc'));
      const atividadesSnapshot = await getDocs(q);
      const atividadesCarregadas: Atividade[] = [];

      for (const docSnap of atividadesSnapshot.docs) {

        const atividadeData = docSnap.data();
        
        atividadesCarregadas.push({
          
          id: docSnap.id,
          nome: atividadeData.titulo || docSnap.id, 
          posicao: atividadeData.posicao || 0,
          questoes: atividadeData.questoes || []

        });
      }

      const atividadesOrdenadas = atividadesCarregadas.sort((a, b) => {

        if (a.posicao !== undefined && b.posicao !== undefined) {
          return a.posicao - b.posicao;
        }

        return a.id.localeCompare(b.id);
        
      });

      setAtividades(atividadesOrdenadas);

    } catch (error) {

      console.error('Erro ao carregar atividades:', error);

    } finally {
      setCarregando(false);
    }
    
  };

  const contarFontesDaAtividade = (atividade: Atividade): number => {
    
    let totalFontes = 0;
    
    atividade.questoes.forEach(questao => {
     
      if (questao.fonte) {
        
        if (Array.isArray(questao.fonte)) {
          totalFontes += questao.fonte.length; 
     
        } else if (typeof questao.fonte === 'string' && questao.fonte.trim() !== '') {
          totalFontes += 1; 
        }

      }

    });
    
    return totalFontes;
  };

  const contarQuestoesComFonte = (atividade: Atividade): number => {
   
    return atividade.questoes.filter(questao => {
     
      if (!questao.fonte) return false;
     
      if (Array.isArray(questao.fonte)) {
        return questao.fonte.length > 0;
      }

      return questao.fonte.trim() !== '';

    }).length;

  };

  const abrirAviso = () => {
    
    navigation.navigate('DetalhesFontes', {
     
      tipo: 'aviso',
      titulo: 'IMPORTANTE!!! Leia antes de consultar as fontes',
      conteudo:
      
      `  Infelizmente não foi possível acrescentar resumos de cada conteúdo como material de apoio para a resolução das questões, então a bibliografia deve ser utilizada como material de estudo caso você não saiba responder alguma questão ou queira agregar o conteúdo com mais informações e detalhes sobre os acontecimentos históricos!
      
      O desenvolvedor assegura a autenticidade das informações e garante que nenhuma questão, ou seu conteúdo, foi produzido por inteligência artificial e cada uma das atividades, perguntas, respostas e explicações foram elaboradas, estudadas e produzidas pelo próprio. Os materiais utilizados foram sites e artigos escritos por historiadores com verdadeira credibilidade, jornalistas que leram pesquisas, materiais e dados confidenciais, e o desenvolvedor que vos fala tomou o cuidado de desmintificar fatos históricos contados com base na perspectiva eurocêntrica e liberal.

      O Histosaga foi criado pensando na democratização do estudo e nova perspectiva do mesmo, visando a acessibilidade dele principalmente para jovens pobres, periféricos, interioranos... com ele sendo totalmente gratuito, funcionando sem internet, e em tempos que IAs dominam e o estudo perde a importância, contendo informações verídicas e escritas por uma pessoa real, tendo uma pegada mais "leve", para que assim o aplicativo não faça os jovens saírem daqui sabendo tudo da história, mas para que nasça o interesse de cada um nas ciências humanas e eles aprendam e reconheçam a importância de seu povo, sua ancestralidade e sua sociedade. É importante ressaltar que, sendo assim, o objetivo do Histosaga nunca foi contar a história somente pela periodização clássica, onde a divisão é baseada na perspectiva etnocêntrica e é chamado de "História Geral", porém nesse tempo e recursos, a versão com a História do Brasil e as outras matérias de ciências humanas ainda é beta, um dia será produzida.

      Referente as últimas questões envolvendo a União Soviética, foi utilizado um material mais denso, completo e complexo acerca das informações utilizadas. Para quem sabe um pouco referente o conteúdo, pode se espantar com a divergência entre as informações conhecidas pelas décadas de propaganda nazista, estadunidense e capitalista contra qualquer Estado socialista, principalmente a União Soviética. A grande maioria das informações repassadas foram distorcidas, manipuladas ou completamente inventadas durante a Segunda Guerra Mundial e a Guerra Fria, e o objetivo do desenvolvedor é conscientizá-los com informações reais. As explicações das respectivas questões estão extremamente elaboradas e detalhadas a seu respeito, mas deve-se consultar as fontes que também estão perfeitamente embasadas caso ainda não haja total entendimento ou confiança na credibilidade das informações. E referente as questões acerca da Segunda Guerra Mundial, nazismo e fascismo foi utilizado o material riquíssimo do professor Murilo.
      
      As fontes são organizadas por questão para facilitar a consulta e aprofundamento nos temas. Desejo a todos bons estudos! :)`

    });
  };

  const abrirAtividade = (atividade: Atividade) => {

    navigation.navigate('DetalhesFontes', {
      tipo: 'atividade',
      atividade: atividade
    });

  };

  if (carregando) {

    return (

      <View style={styles.container}>
        <ActivityIndicator size="large" color="#8581FF" />
        <Text style={styles.carregandoTexto}>Carregando fontes...</Text>
      </View>

    );

  }

  return (
    
    <ScrollView style={styles.container}>
      
      <View style={styles.header}>    
        <Text style={styles.titulo}>Fontes e referências</Text>
        <Text style={styles.subtitulo}> Material de apoio e bibliografia </Text>
      </View>

      <TouchableOpacity style={[styles.botao, styles.botaoAviso]} onPress={abrirAviso}>
        
        <Text style={styles.botaoIcone}>ℹ️</Text>
        
        <View style={styles.botaoInfo}>        
          <Text style={[styles.botaoTitulo, { textAlign: 'center' } ]}>IMPORTANTE!!! Leia antes de consultar as fontes</Text>
          <Text style={styles.botaoDescricao}> Informações sobre o aplicativo e acerca do conteúdo presente </Text>
        </View>

      </TouchableOpacity>

      <View style={styles.secaoAtividades}>
        
        <Text style={styles.secaoTitulo}>Atividades</Text>
        
        {atividades.map((atividade) => {
          
          const totalFontes = contarFontesDaAtividade(atividade);
          const questoesComFonte = contarQuestoesComFonte(atividade);
          
          return (
            
            <TouchableOpacity key={atividade.id} style={styles.botao} onPress={() => abrirAtividade(atividade)}>
              
              <Text style={styles.botaoIcone}>📚</Text>
              
              <View style={styles.botaoInfo}> 
                <Text style={styles.botaoTitulo}>{atividade.nome}</Text>
                <Text style={styles.botaoDescricao}> {atividade.questoes.length} questões • {totalFontes} referências </Text> 
              </View>

            </TouchableOpacity>

          );

        }) }

      </View>
    </ScrollView>
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
    textAlign: 'center'
  },

  subtitulo: {
    color: '#B8B5FF',
    fontSize: 16,
    fontFamily: 'InriaSans_400Regular',
    paddingBottom: 20
  },

  carregandoTexto: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center',
    marginTop: 10,
  },

  botao: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 0, 102, 0.66)',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8581FF',
    alignItems: 'center',
  },

  botaoAviso: {
    backgroundColor: '#8581FF',
  },

  botaoIcone: {
    fontSize: 24,
    marginRight: 15,
  },

  botaoInfo: {
    flex: 1,
  },

  botaoTitulo: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Jersey10_400Regular',
    marginBottom: 2,
  },

  botaoDescricao: {
    color: '#cac0faff',
    fontSize: 14,
    fontFamily: 'InriaSans_400Regular',
    marginTop: 10
  },

  secaoAtividades: {
    marginTop: 30,
    marginBottom: 30,
  },

  secaoTitulo: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    marginLeft: 20,
    marginBottom: 15,
    paddingTop: 20
  },

});