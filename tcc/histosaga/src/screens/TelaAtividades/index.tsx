import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Animated, Dimensions, Image, PanResponder} from 'react-native';

import { Platform } from 'react-native';

import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { doc, getDoc, updateDoc, increment, setDoc,  } from 'firebase/firestore';
import { db, saveActivityOffline, getOfflineActivity } from '../../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { KeyboardAvoidingView, Keyboard, EmitterSubscription } from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';

import { ExitSheet } from '../../components/ExitSheet';

const { width } = Dimensions.get('window'); 

export type RootStackParamList = {

  TelaAtividades: {
    materia: string;
    atividadeId: string;
  };

  telaInicial: undefined;

};

interface FeedbackProps {

  visivel: boolean,
  correto: boolean;
  explicacao: string;
  onContinuar: () => void;
  tipoQuestao?: string;
  respostaEsperada?: string;

}

const Feedback = ({ visivel, correto, explicacao, onContinuar, tipoQuestao, respostaEsperada}: FeedbackProps) => {
 
  const translateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const calcularAltura = () => {

    if (correto) return 0.2;

    const tamanhoTexto = explicacao.length;

    if (tipoQuestao === 'discursiva') return 0.9;
    if (tipoQuestao === 'discursiva' && respostaEsperada) return 0.3;
    if (tipoQuestao === 'preencher-lacunas' || tipoQuestao === 'ordenar-lacunas') return 0.6;

    if (tamanhoTexto < 100) return 0.3;
    if (tamanhoTexto < 300) return 0.4;
    if (tamanhoTexto < 500) return 0.55;
    if (tamanhoTexto < 700) return 0.7;
    if (tamanhoTexto < 1500) return 0.9;

    return 1.01;

  };

  const altura = calcularAltura();
  const ehAlturaMaxima = altura === 0.9 || altura === 1.01;

  useEffect(() => {

    if (visivel) {
      
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true, 
      }).start();

    } else {

      Animated.spring(translateY, {
        toValue: Dimensions.get('window').height,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

    }

  }, [visivel]);

  if (!visivel) return null;
 
  return (
    
    <View style={StyleSheet.absoluteFillObject}>
      
      <TouchableOpacity style={styles.overlayFeedback} activeOpacity={1} onPress={() => {}}>
      
      <Animated.View style={[ styles.feedbackContainer, { transform: [{ translateY }], height: Dimensions.get('window').height * altura,
      justifyContent: correto ? 'space-around' : 'flex-start' } ]}>
        
        <View style={styles.feedbackHeader}>
          
          <Text style={styles.feedbackIcon}> {correto ? '🎉' : '❌'} </Text>
          <Text style={styles.feedbackTitulo}> {correto ? 'Parabéns!' : 'Incorreta.'} </Text>

        </View>

        {!correto && (
          
          <View style={styles.feedbackExplicacao}>
            
            <Text style={styles.feedbackMensagem}> Resposta correta: </Text>
            <Text style={[ styles.feedbackExplicacaoTexto, ehAlturaMaxima && styles.feedbackExplicacaoTextoPequeno ]}> {explicacao}</Text>
        
          </View>
          )}

          <TouchableOpacity style={styles.feedbackBotaoContinuar} onPress={onContinuar}>
            <Text style={styles.feedbackBotaoTexto}>Continuar</Text>
          </TouchableOpacity>

        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

interface QuestaoMultiplaProps {

  questao: {

    pergunta: string;
    opcoes: string[];
    correta: string;
    subtipo?: string; 

  };

  onResponder: (resposta: string) => void;
  resposta: string | null;
}

interface QuestaoVerdadeiroFalsoProps {

  questao: {

    afirmativa: string;
    correta: boolean;
    subtipo?: string;

  };

  onResponder: (resposta: boolean) => void;
  resposta: boolean | null;
}

interface QuestaoLinhaTempoProps {

  questao: {

    instrucao: string;
    explicacao: string;
    ordemCorreta: string[];
    periodos: Array<{ id: string; texto: string }>;

  };

  onResponder: (acertou: boolean) => void;
  resposta: boolean | null;
}

interface QuestaoDiscursivaProps {

  questao: {

    pergunta: string;
    "palavras-chave"?: string[];
    minimo?: number;
    respostaEsperada?: string;
    aceitarSinonimos?: boolean;

  };

  onResponder: (acertou: boolean) => void;
  resposta: boolean | null;

}

interface QuestaoPreencherLacunasProps {

  questao: {

    explicacao: string;
    texto: string;
    ordem: Array<{ id: string; posicao: number}>;
    palavras: Array<{ id: string; texto: string}>;

  };

  onResponder: (acertou: boolean) => void;
  resposta: boolean | null;

}

interface QuestaoAssociarColunasProps {

  questao: {
   
    pergunta: string;
    opcoes: string[];

    pares: Array<{
      item: string;
      correto: string;
    }>;

  };

  onResponder: (acertou: boolean) => void;
  resposta: boolean | null;
}

interface ItemOrdenar {
  
  id: string;
  texto: string;

}

interface QuestaoOrdenarProps {

  questao: {

    instrucao: string;
    itens: ItemOrdenar[];
    ordemCorreta: string[];
 
  };

  onResponder: (acertou: boolean) => void;
  resposta: boolean | null;

}

interface ClassificarColunasProps {
  
  questao: {
    pergunta: string;
    itens: string[];
    ordemCorreta: string[];
    subtipo?: string;
  };

  onResponder: (acertou: boolean) => void;
  resposta: boolean | null;

}

const QuestaoClassificarColunas = ({ questao, onResponder, resposta }: ClassificarColunasProps) => {
  
  const [classificacoes, setClassificacoes] = useState<{[key: string]: string}>({});
  const [itemSelecionado, setItemSelecionado] = useState<string | null>(null);

  const colunasUnicas = [...new Set(questao.ordemCorreta)];
  const colunas = colunasUnicas.slice(0, questao.subtipo === 'trescolunas' ? 3 : 2);
  const ehTresColunas = questao.subtipo === 'trescolunas';

  const handleSelecionarItem = (item: string) => {
    if (resposta !== null || classificacoes[item]) return;
    setItemSelecionado(item);
  };

  const handleClassificar = (coluna: string) => {
   
    if (!itemSelecionado || resposta !== null) return;
   
    setClassificacoes(prev => ({ ...prev, [itemSelecionado]: coluna }));
    setItemSelecionado(null);
  
  };

  const reiniciar = () => {
    setClassificacoes({});
    setItemSelecionado(null);
  };

  const verificarResposta = () => {
   
    const acertou = questao.itens.every((item, index) => 
      classificacoes[item] === questao.ordemCorreta[index]
    );
   
    onResponder(acertou);
  
  };

  const todosClassificados = Object.keys(classificacoes).length === questao.itens.length;
  const algumClassificado = Object.keys(classificacoes).length > 0;
  
  return (
    
    <View style={styles.tipoContainer}>
      
      <Text style={[ styles.pergunta, { paddingHorizontal: 30, marginBottom: ehTresColunas ? -20 : -20 } ]}> {questao.pergunta} </Text>
    
      <View style={ehTresColunas ? styles.colunasContainerTres : styles.colunasContainer}>
        <View style={[ styles.linhaColunas,ehTresColunas && { marginBottom: 20 } ]} >
        
          {colunas.slice(0, 2).map((coluna) => (
          
            <TouchableOpacity key={coluna} style={[ styles.coluna, ehTresColunas && styles.colunaTres, itemSelecionado && styles.colunaAtiva ]} 
            onPress={() => handleClassificar(coluna)} disabled={!itemSelecionado || resposta !== null}>
            
              <Text style={styles.tituloColuna}>{coluna}</Text>
            
              {questao.itens.map((item) => classificacoes[item] === coluna && (
                <Text key={item} style={styles.itemNaColuna}>{item}</Text>
              ))}

            </TouchableOpacity>
          ))}
        </View>

        {ehTresColunas && colunas[2] && (
        
          <View style={[styles.linhaUnica, { paddingBottom: 150}]}>
          
            <TouchableOpacity style={[ styles.coluna, styles.colunaTresUnica, itemSelecionado && styles.colunaAtiva ]} onPress={() =>
            handleClassificar(colunas[2])} disabled={!itemSelecionado || resposta !== null}>
            
              <Text style={styles.tituloColuna}>{colunas[2]}</Text>

              {questao.itens.map((item) => classificacoes[item] === colunas[2] && (
                <Text key={item} style={styles.itemNaColuna}>{item}</Text>
              ))}

            </TouchableOpacity>

          </View>
        )}
      </View>

      <View style={[ styles.areaItensClassificar, ehTresColunas && { marginBottom: 20 } ]}>
 
        {questao.itens.map((item) => {
        
          const jaClassificado = classificacoes[item];
          const estaSelecionado = itemSelecionado === item;
        
          if (jaClassificado) return null;
        
          return (
          
            <TouchableOpacity key={item} style={[ styles.botaoClassificar, ehTresColunas && styles.botaoClassificarTres, estaSelecionado &&
            styles.botaoSelecionado ]} onPress={() => handleSelecionarItem(item)} disabled={resposta !== null}>
            
              <Text style={[ styles.textoClassificar,  ehTresColunas && styles.textoClassificarTres, estaSelecionado && styles.textoSelecionado]}>{item}</Text>
          
            </TouchableOpacity>

          );
        })}
      </View>

      <View style={styles.botoesInferiores}>
      
        {algumClassificado && resposta === null && (
        
          <TouchableOpacity style={[styles.botaoContinuar, { backgroundColor: 'rgba(255, 255, 255, 0.1)', marginRight: 200, borderWidth: 2,
          borderColor: '#8581FF', bottom: 40 }]} onPress={reiniciar}>

            <Text style={styles.textoContinuar}>Reiniciar</Text>

          </TouchableOpacity>

        )}
      
        <TouchableOpacity style={[styles.botaoContinuar, { bottom: 40 }, !todosClassificados && styles.botaoContinuarDesabilitado]} onPress=
        {verificarResposta} disabled={!todosClassificados || resposta !== null}>

          <Text style={styles.textoContinuar}>Continuar</Text>

        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuestaoOrdenar = ({ questao, onResponder, resposta }: QuestaoOrdenarProps) => {
  
  const [itensOrdenados, setItensOrdenados] = useState<ItemOrdenar[]>(questao.itens);

  const verificarResposta = () => {
    
    const ordemAtual = itensOrdenados.map(item => item.texto);
    const acertou = JSON.stringify(ordemAtual) === JSON.stringify(questao.ordemCorreta);
    
    onResponder(acertou);

  };

  const renderItem = ({ item, drag, isActive }: { item: ItemOrdenar; drag: any; isActive: boolean }) => {
   
    return (
      
      <TouchableOpacity style={[ styles.item, isActive && styles.itemArrastando,]} onLongPress={resposta === null ? drag : undefined}
      disabled={resposta !== null}>
        
        <Text style={styles.textoItem}>{item.texto}</Text>

      </TouchableOpacity>

    );
  };

  return (
    
    <View style={styles.container}>
      
      <DraggableFlatList data={itensOrdenados} renderItem={renderItem} keyExtractor={(item) => item.id} onDragEnd={({ data }) =>
      setItensOrdenados(data)} scrollEnabled={false} />

      {!resposta && (
        
        <View style={styles.areaInferior}>
          
          <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
          <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem]} resizeMode="contain" />

          <View style={[styles.balaoContainer, { left: 50, bottom: 140}]}>
            
            <Image source={require('../../../assets/images/balao-3.png')} style={stylesAssociarColunas.imagemBalao} resizeMode="stretch" />
            <Text style={stylesAssociarColunas.textoPergunta}>{questao.instrucao}</Text>
        
          </View>

          <TouchableOpacity style={styles.botaoContinuar} onPress={verificarResposta}>
            <Text style={styles.textoContinuar} >Continuar </Text>
          </TouchableOpacity>
      
        </View>
      )}
    </View>
  );
};

const QuestaoAssociarColunas = ({ questao, onResponder, resposta }: QuestaoAssociarColunasProps) => {
  
  const [selecionadoEsquerda, setSelecionadoEsquerda] = useState<string | null>(null);
  const [selecionadoDireita, setSelecionadoDireita] = useState<string | null>(null);
  const [paresCorretos, setParesCorretos] = useState<string[]>([]);
  const [paresIncorretos, setParesIncorretos] = useState<string[]>([]);

  const { pergunta, opcoes, pares } = questao;
  const civilizacoes = [...new Set(pares.map(par => par.item))];

  const handleClicarCivilizacao = (civilizacao: string) => {
   
    if (resposta !== null) return;
    setSelecionadoEsquerda(civilizacao);
   
    if (selecionadoDireita) {
      verificarPar(civilizacao, selecionadoDireita);
    }

  };

  const handleClicarContribuicao = (contribuicao: string) => {
    
    if (resposta !== null) return;
    setSelecionadoDireita(contribuicao);

    if (selecionadoEsquerda) {
      verificarPar(selecionadoEsquerda, contribuicao);
    }

  };

  const verificarPar = (civilizacao: string, contribuicao: string) => {
    
    const parCorreto = pares.find(par => par.item === civilizacao && par.correto === contribuicao);
    const acertou = !!parCorreto;
    const parId = `${civilizacao}-${contribuicao}`;

    if (acertou) {
      setParesCorretos(prev => [...prev, parId]);

    } else {
      setParesIncorretos(prev => [...prev, parId]);
    }

    setSelecionadoEsquerda(null);
    setSelecionadoDireita(null);

    setTimeout(() => {

      const paresCompletos = paresCorretos.length + (acertou ? 1 : 0);
      const todosParesFeitos = paresCompletos === pares.length;

      if (todosParesFeitos) {

        const todosCorretos = pares.every(par => paresCorretos.includes(`${par.item}-${par.correto}`) || (acertou && civilizacao === par.item &&
        contribuicao === par.correto));

        onResponder(todosCorretos);

      }
    }, 0);
  };

  const getEstiloCivilizacao = (civilizacao: string) => {
    
    const estaSelecionada = selecionadoEsquerda === civilizacao;
    const estaCorreta = paresCorretos.some(parId => parId.startsWith(civilizacao + '-'));
    const estaIncorreta = paresIncorretos.some(parId => parId.startsWith(civilizacao + '-'));

    if (estaCorreta) return stylesAssociarColunas.itemCorreto;
    if (estaIncorreta) return stylesAssociarColunas.itemIncorreto;
    if (estaSelecionada) return stylesAssociarColunas.itemSelecionado;

    return stylesAssociarColunas.itemNormal;

  };

  const getEstiloContribuicao = (contribuicao: string) => {

    const estaSelecionada = selecionadoDireita === contribuicao;
    const estaCorreta = paresCorretos.some(parId => parId.endsWith('-' + contribuicao));
    const estaIncorreta = paresIncorretos.some(parId => parId.endsWith('-' + contribuicao));

    if (estaCorreta) return stylesAssociarColunas.itemCorreto;
    if (estaIncorreta) return stylesAssociarColunas
    .itemIncorreto;
    if (estaSelecionada) return stylesAssociarColunas.itemSelecionado;

    return stylesAssociarColunas.itemNormal;

  };

  return (

    <View style={stylesAssociarColunas.container}>
      <View style={stylesAssociarColunas.colunasContainer}>
        <View style={[stylesAssociarColunas.coluna, {justifyContent: 'center'}]}>
          
          {civilizacoes.map((civilizacao, index) => (
            
            <TouchableOpacity key={index} style={[stylesAssociarColunas.botaoEsquerdo, getEstiloCivilizacao(civilizacao)]} onPress={() => handleClicarCivilizacao
            (civilizacao)} disabled={resposta !== null}>
              
              <Text style={stylesAssociarColunas.textoOpcoes}>{civilizacao}</Text>
            
            </TouchableOpacity>
          ))}

        </View>

        <View style={stylesAssociarColunas.coluna}>
                    
          {opcoes.map((contribuicao, index) => (
            
            <TouchableOpacity key={index} style={[stylesAssociarColunas.botao, getEstiloContribuicao(contribuicao)]} onPress={() => handleClicarContribuicao
            (contribuicao)} disabled={resposta !== null}>

              <Text style={stylesAssociarColunas.textoOpcoes}>{contribuicao}</Text>

            </TouchableOpacity>

          ))}
        </View>

        {!resposta && (

        <View style={styles.areaInferior}>
          
          <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
          <Image source={require('../../../assets/images/personagem.png')} style={styles.imagemPersonagem} resizeMode="contain" />

          <View style={[styles.balaoContainer, { left: 100, bottom: 100}]}>
            <Image source={require('../../../assets/images/balao-3.png')} style={stylesAssociarColunas.imagemBalao} resizeMode="stretch" />
            <Text style={stylesAssociarColunas.textoPergunta}>{questao.pergunta}</Text>
          </View>
      
        </View>
        )}
      </View>
    </View>
  );
};

const QuestaoMultipla = ({ questao, onResponder, resposta }: QuestaoMultiplaProps) => {
  
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const ehMultiplaGrande = questao.subtipo === 'multipla-grande';

  const handleResponder = (opcao: string) => {
    setRespostaSelecionada(opcao);
  };

  const handleContinuar = () => {
    if (respostaSelecionada) {
      onResponder(respostaSelecionada);
    }
  };

  return (
   
   <View style={styles.tipoContainer}>
      <View style={styles.opcoesContainer}>

        {questao.opcoes.map((opcao, index) => {
          
          const selecionada = respostaSelecionada === opcao;

          return (
            
            <TouchableOpacity key={index} style={[ styles.botao, selecionada && styles.botaoSelecionado, { minWidth: 350 } ]} onPress={() =>
            handleResponder(opcao)} disabled={!!resposta}>

              <Text style={[ styles.textoOpcao, selecionada && styles.textoSelecionado, ehMultiplaGrande && { fontSize: 20 } ]}> {opcao} </Text>
            
            </TouchableOpacity>

          );
        })}
      </View>

      {!resposta && (
        
        <View style={styles.areaInferior}>
          
          <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
          <Image source={require('../../../assets/images/personagem.png')} style={styles.imagemPersonagem} resizeMode="contain" />

          <View style={styles.balaoContainer}>
            <Image source={require('../../../assets/images/balao-3.png')} style={[styles.imagemBalao, { height: 215}]} resizeMode="stretch" />
            <Text style={styles.textoPergunta}>{questao.pergunta}</Text>
          </View>

          <TouchableOpacity style={[ styles.botaoContinuar, { right: 20}, !respostaSelecionada && styles.botaoContinuarDesabilitado ]} onPress={handleContinuar} 
          disabled={!respostaSelecionada || !!resposta}>
            
            <Text style={styles.textoContinuar}>Continuar</Text>

          </TouchableOpacity>
          
        </View>
      )}
    </View>
  );
};

const QuestaoVerdadeiroFalso = ({ questao, onResponder, resposta }: QuestaoVerdadeiroFalsoProps) => {
  
  const [respostaSelecionada, setRespostaSelecionada] = useState<boolean | null>(null);
  const ehVFGrande = questao.subtipo === 'vf-grande';
  const ehVFExtraGrande = questao.subtipo === 'vf-extragrande';

  const posicaoBoneco = ehVFGrande || ehVFExtraGrande 
    ? { left: 10 }  
    : { right: 40 }; 

  const posicaoBotaoContinuar = ehVFGrande || ehVFExtraGrande
    ? { right: 10 } 
    : { left: 30 };

  const handleResponder = (valor: boolean) => {
    setRespostaSelecionada(valor);
  };

  const handleContinuar = () => {
    if (respostaSelecionada !== null) {
      onResponder(respostaSelecionada);
    }
  };

  return (
    
    <View style={styles.tipoContainer}>
      
      {(ehVFGrande || ehVFExtraGrande) && (
        
        <View style={[ styles.afirmativaContainer, ehVFExtraGrande && styles.afirmativaContainerExtra ]}>    
          <Text style={[ styles.afirmativaGrande, ehVFExtraGrande && styles.afirmativaExtraGrande ]}>{questao.afirmativa}</Text>
        </View>

      )}

      <View style={[ styles.areaSuperior, ehVFGrande && { paddingTop: 50 }, ehVFExtraGrande && { paddingTop: 30 } ]}>
        
        <View style={[ { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, gap: 15, width: '100%', paddingHorizontal: 50 },
        ehVFExtraGrande && { paddingHorizontal: 30, gap: 10, marginBottom: 20 } ]}>
          
          <TouchableOpacity style={[ styles.botaoVF, { backgroundColor: 'white'}, respostaSelecionada === true && styles.botaoSelecionado,
          ehVFExtraGrande && styles.botaoVFExtra ]} onPress={() => handleResponder(true)} disabled={resposta !== null}>
            
            <Text style={[ styles.textoOpcao, respostaSelecionada === true && styles.textoSelecionado, ehVFExtraGrande && styles.textoOpcaoExtra
            ]}> Verdadeiro </Text>

          </TouchableOpacity>

          <TouchableOpacity style={[ styles.botaoVF, { backgroundColor: 'white'}, respostaSelecionada === false && styles.botaoSelecionado,
          ehVFExtraGrande && styles.botaoVFExtra ]} onPress={() => handleResponder(false)} disabled={resposta !== null}>
            
            <Text style={[ styles.textoOpcao, respostaSelecionada === false && styles.textoSelecionado, ehVFExtraGrande && styles.textoOpcaoExtra
            ]}> Falso </Text>
          
          </TouchableOpacity>
        
        </View>
      </View>
      
      {!resposta && (
        
        <View style={styles.areaInferior}>
          
          <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" /> 
          <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem, posicaoBoneco]} resizeMode="contain" />
            
          {!(ehVFGrande || ehVFExtraGrande) && (
            
            <View style={[styles.balaoContainer, { left: Platform.OS === 'web' ? width * 0.2 : width * -0.05 }]}>
              <Image source={require('../../../assets/images/balao-3.png')} style={styles.imagemBalao} resizeMode="stretch" />
              <Text style={styles.textoPergunta}>{questao.afirmativa}</Text>
            </View>

          )}
            
          <TouchableOpacity style={[ styles.botaoContinuar, posicaoBotaoContinuar, respostaSelecionada === null && styles.botaoContinuarDesabilitado, ehVFExtraGrande && { bottom: 100 }
          ]} onPress={handleContinuar} disabled={respostaSelecionada === null || !!resposta}>
            
            <Text style={styles.textoContinuar}>Continuar</Text>

          </TouchableOpacity>

        </View>
      )}
    </View>
  );
};

const QuestaoLinhaTempo = ({ questao, onResponder, resposta, }: QuestaoLinhaTempoProps) => {

  const [preenchimentos, setPrenchimentos] = useState<(string | null)[]>(Array(questao.ordemCorreta.length).fill(null));
  const [opcoesDisponiveis, setOpcoesDisponiveis] = useState(questao.periodos);
  
  const ehGreciaAntiga = questao.ordemCorreta.length === 5;
  const anos = ehGreciaAntiga ? ["3.000 a.C", "1.100 a.C", "800 a.C", "480 a.C", "323 a.C"] : ["10.000 a.C", "8.000 a.C", "5.000 a.C", "3.500 a.C"];

  const preencherProxima = (texto: string) => {
  
    if (resposta !== null) return;
    const indexVazio = preenchimentos.findIndex(p => p === null);
   
    if (indexVazio === -1) return;
    const novos = [...preenchimentos];
  
    novos[indexVazio] = texto;
   
    setPrenchimentos(novos);
    setOpcoesDisponiveis(prev => prev.filter(p => p.texto !== texto));

  };

  const removerPreenchimento = (index: number) => {
    
    if (resposta !== null) return;
   
    const novos = [...preenchimentos];
    const removido = novos[index];
   
    novos[index] = null;
    setPrenchimentos(novos);
   
    if (removido) {
      setOpcoesDisponiveis(prev => [...prev, { id: String(Date.now()), texto: removido}]);
    }

  };

  const verificarResposta = () => {
    const acertou = preenchimentos.every((texto, index) => texto === questao.ordemCorreta[index]);
    onResponder(acertou);
  };

  return (

    <View style={[styles.tipoContainer]}>

      <Text style={[styles.pergunta, { paddingHorizontal: 40, marginBottom: 10}]}>{questao.instrucao}</Text>

      <View style={{ paddingHorizontal: 10, marginBottom: Platform.OS === 'web' ? 80 : 100}}>
        
        <Text style={[styles.ano, { marginRight: 50}]}> {anos[0]} </Text>
       
        <View style={{ width: 4, height: 60, backgroundColor: 'white', position: 'absolute', right: 100, top: 40}} />
        
          <TouchableOpacity onPress={() => removerPreenchimento(0)} disabled={resposta !== null}>
            <Text style={[styles.lacuna, { position: 'relative', left: 30, top: 20}]}> {preenchimentos[0]} </Text>
          </TouchableOpacity>
        
          <Text style={[styles.ano, {marginRight:  Platform.OS === 'web' ? 60 : 80, marginTop: 50}]}> {anos[1]} </Text>

          <TouchableOpacity onPress={() => removerPreenchimento(1)} disabled={resposta !== null}>
            <Text style={[styles.lacuna, { position: 'absolute', left: 0, bottom: -20, width: 200}]}> {preenchimentos[1]} </Text>
          </TouchableOpacity>

          <View style={{ width: 4, height: 60, backgroundColor: 'white', position: 'absolute', right: 170, top: 160}} />
          <View style={{ width:  Platform.OS === 'web' ? '20%' : '25%', height: 4, backgroundColor: 'white', position: 'absolute', left:
          Platform.OS === 'web' ? 130 : 110, top: 240}} />

          <Text style={[styles.ano, { textAlign: 'left', marginTop: 70, marginLeft: 10}]}> {anos[2]} </Text>

          <TouchableOpacity onPress={() => removerPreenchimento(2)} disabled={resposta !== null}>
            <Text style={[styles.lacuna, { position: 'absolute', right: 0, bottom: 0, width: 160}]}> {preenchimentos[2]} </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => removerPreenchimento(3)} disabled={resposta !== null}>
            <Text style={[styles.lacuna, { position: 'absolute', left: 10, top: 30, width: 200}]}> {preenchimentos[3]} </Text>
          </TouchableOpacity>

          <Text style={[styles.ano, { textAlign: 'right', marginTop: 40, marginBottom: 40, marginRight:  Platform.OS === 'web' ? 50 : 70}]}> {anos[3]} </Text>

          {ehGreciaAntiga && (
            
            <>
            
            <View style={{ width: 4, height: 50, backgroundColor: 'white', position: 'absolute', right: 50, top: 315 }} />

              <TouchableOpacity onPress={() => removerPreenchimento(4)} disabled={resposta !== null}>
                <Text style={[styles.lacuna, { position: 'absolute', right: 60, top: -10, width: 180 }]}>{preenchimentos[4]}</Text>
              </TouchableOpacity>

              <Text style={[styles.ano, { textAlign: 'left', marginTop: 5, marginLeft: 45, marginBottom: 40 }]}>{anos[4]}</Text>

            </>

          )}

          <View style={[styles.opcoesPreencher, { marginBottom: 100}]}>
           
            {opcoesDisponiveis.map((opcao) => (
             
             <TouchableOpacity key={opcao.id} style={[styles.botaoOpcoes, { position: 'relative', top: 40}]} onPress={() => preencherProxima(opcao.texto)} disabled={resposta !== null}>
                <Text style={styles.textoOpcoes}> {opcao.texto} </Text>
              </TouchableOpacity>

            ))}
          </View>
      </View>

      <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem, { width: 250, position: 'absolute',
      left: -60, bottom: -50}]} resizeMode="contain" />
     
      <TouchableOpacity style={[styles.botaoContinuar, (preenchimentos.some(p => !p) || !!resposta) && styles.botaoContinuarDesabilitado,
      { minWidth: 220, position: 'absolute', bottom: 50, right: 30}]} onPress={verificarResposta} disabled={preenchimentos.some(p => !p) ||
      !!resposta}>
          
        <Text style={styles.textoContinuar}> Continuar </Text>

      </TouchableOpacity>

    </View>
  );
};

const QuestaoDiscursiva = ({ questao, onResponder, resposta }: QuestaoDiscursivaProps) => {
 
  const [textoResposta, setTextoResposta] = useState('');
  const ehQuestaoUmaPalavra = !!questao.respostaEsperada;

  const verificarResposta = () => {
    
    if (!textoResposta.trim()) {
      onResponder(false);
      return;
    }

    if (ehQuestaoUmaPalavra && questao.respostaEsperada) {

      const respostaUsuario = textoResposta.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const respostaEsperada = questao.respostaEsperada.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      const palavrasChave = questao["palavras-chave"] || [];
      const acertou = respostaUsuario === respostaEsperada || 
        
      palavrasChave.some(palavra => palavra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === respostaUsuario );
      onResponder(acertou);

    } else {

      const palavrasChave = questao["palavras-chave"] || [];
      const minimo = questao.minimo || Math.ceil(palavrasChave.length / 2);

      const textoSemAcento = textoResposta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      const acertos = palavrasChave.filter(palavra => {
        
        const palavraSemAcento = palavra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return textoSemAcento.includes(palavraSemAcento);
     
      }).length;

      onResponder(acertos >= minimo);
    }
  };

  const inputVazio = !textoResposta.trim();

  if (ehQuestaoUmaPalavra) {
    
    return (
      
      <View style={styles.tipoContainer}>
        
        <Text style={[styles.pergunta, { paddingTop: 130, marginLeft: 50, textAlign: 'center' }]}> {questao.pergunta} </Text>

        <View style={styles.containerUmaPalavra}>
          
          <TextInput style={styles.inputUmaPalavra} placeholder="Digite sua resposta..." value={textoResposta} onChangeText={setTextoResposta}
          editable={!resposta} maxLength={30} autoCapitalize="none" autoCorrect={false} />
          
        </View>

        {!resposta && (
          
          <View style={styles.areaInferior}>
           
            <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
            <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem, { left: 0 }]} resizeMode="contain" />

            <TouchableOpacity style={[ styles.botaoContinuar, { marginRight: 20 }, inputVazio && styles.botaoContinuarDesabilitado ]} onPress=
            {verificarResposta} disabled={inputVazio}>

              <Text style={styles.textoContinuar}>Continuar</Text>

            </TouchableOpacity>

          </View>
        )}

      </View>
    );
  }

  return (
  
  <View style={styles.tipoContainer}>
    
    <Text style={[styles.pergunta, { paddingTop: 100, marginLeft: 50 }]}> {questao.pergunta} </Text>
      
    <TextInput style={styles.inputDiscursiva} multiline numberOfLines={4} placeholder='Digite sua resposta aqui...' value={textoResposta} 
    onChangeText={setTextoResposta} editable={!resposta} />
      
    {!resposta && (
      
      <View style={styles.areaInferior}>
        
        <Image source={require('../../../assets/images/bloco.png')} style={styles.imagemBloco} resizeMode="stretch" />
        <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem, { paddingLeft: 15 }]} resizeMode="contain" />

        <TouchableOpacity style={[ styles.botaoContinuar, { marginRight: 20 }, inputVazio && styles.botaoContinuarDesabilitado ]} onPress=
        {verificarResposta} disabled={inputVazio}>

          <Text style={styles.textoContinuar}>Continuar</Text>

        </TouchableOpacity>

      </View>
    )}
  </View>
  );
};

const QuestaoPreencherLacunas = ({ questao, onResponder, resposta}: QuestaoPreencherLacunasProps) => {

  const [lacunasPreenchidas, setLacunasPreenchidas] = useState<{[key: string]: string}>({});
  const [palavrasDisponiveis, setPalavrasDisponiveis] = useState(questao.palavras);
  const todasLacunasPreenchidas = questao.ordem.every(item => lacunasPreenchidas[item.id]);

  const preencherProximaLacuna = (palavraId: string) => {
    
    if (resposta != null) return;
    const palavra = questao.palavras.find(p => p.id === palavraId);
    
    if (!palavra) return;
    const lacunaVazia = questao.ordem.find(item => !lacunasPreenchidas[item.id]);    

    if (lacunaVazia) {
     
      if (lacunasPreenchidas[lacunaVazia.id]) {
        
        const palavraAntigaId = lacunasPreenchidas[lacunaVazia.id];
        const palavraAntiga = questao.palavras.find(p => p.id === palavraAntigaId);

        if (palavraAntiga) {
          setPalavrasDisponiveis(prev => [...prev, palavraAntiga]);
        }

      }

      setLacunasPreenchidas(prev => ({...prev, [lacunaVazia.id]: palavraId}));
      setPalavrasDisponiveis(prev => prev.filter(p => p.id != palavraId));
    }
  };

  const removerPreenchimento = (lacunaId: string) => {

    if (resposta != null) return;
    
    const palavraId = lacunasPreenchidas[lacunaId];
    if (!palavraId) return;

    const palavra = questao.palavras.find(p => p.id === palavraId);

    if (palavra) {
      setPalavrasDisponiveis(prev => [...prev, palavra]);
    }

    setLacunasPreenchidas(prev => { 
      
      const novasLacunas = { ...prev };
      delete novasLacunas[lacunaId];
      return novasLacunas;
   
    });

  };

  const verificarResposta = () => {

    let acertou = true;
    questao.ordem.forEach(item => {
      
      if (lacunasPreenchidas[item.id] !== item.id) {
        acertou = false;
      }

    });
    
    onResponder(acertou);
  };

  const partesTexto = questao.texto.split(/(____)/g);
  let lacunaIndex = 0;

  return (
    
    <View style={styles.tipoContainer}>
    
      <Text style={styles.pergunta}> Preencha as lacunas </Text>
  
      <Text style={styles.texto}>
        
        {partesTexto.map((parte, index) => {
          
          if (parte === '____') {

            const lacunaCorreta = questao.ordem[lacunaIndex];
            const palavraId = lacunasPreenchidas[lacunaCorreta.id];
            const palavra = palavraId ? questao.palavras.find(p => p.id === palavraId) : null;

            lacunaIndex++;

            return (
              <Text key={lacunaCorreta.id} onPress={() => removerPreenchimento(lacunaCorreta.id)} style={{color: palavraId ? '#8581FF' : 'white',
              fontFamily: 'Jersey10_400Regular'}}> {palavra ? palavra.texto : '_______'} </Text>
            );

          } else {
            return <Text key={index}> {parte} </Text>
          }

        })}   
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 180}}>    
        {palavrasDisponiveis.map(palavra => (
        
          <TouchableOpacity key={palavra.id} style={styles.botaoOpcoes} onPress={() => preencherProximaLacuna(palavra.id)}
          disabled={resposta !== null}>

            <Text style={styles.textoOpcoes}> {palavra.texto} </Text>

          </TouchableOpacity>

        ))}
      </View>

      <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem, { width: 250, position: 'absolute',
      left: -60, bottom: -50}]} resizeMode="contain" />

      <TouchableOpacity style={[styles.botaoContinuar, (!todasLacunasPreenchidas || resposta !== null) && styles.botaoContinuarDesabilitado,
      { minWidth: 220, position: 'absolute', bottom: 50, right: 30} ]} onPress={verificarResposta} disabled={!todasLacunasPreenchidas ||
      resposta !== null}>

        <Text style={styles.textoContinuar}> Continuar </Text>

      </TouchableOpacity>

    </View>
  );
};

export default function TelaAtividades() {
  
  const route = useRoute<RouteProp<RootStackParamList, "TelaAtividades">>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "telaInicial">>();

  const [isConnected, setIsConnected] = useState(true);
  const unsubscribeNetworkListenerRef = useRef<(() => void) | null>(null);
 
  const { materia, atividadeId } = route.params;

  const [questao, setQuestao] = useState<any>(null);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);

  const [resposta, setResposta] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [mostrarTelaRevisao, setMostrarTelaRevisao] = useState(false);

  const [feedbackVisivel, setFeedbackVisivel] = useState(false);
  const [feedbackCorreto, setFeedbackCorreto] = useState(false);
  const [feedbackExplicacao, setFeedbackExplicacao] = useState('');

  const translateX = useRef(new Animated.Value(0)).current;
  const [keyboardOffset] = useState(new Animated.Value(0));

  const [showExitSheet, setShowExitSheet] = useState(false);

  const [progressoLocal, setProgressoLocal] = useState({
    
    acertos: 0,
    tentativas: 0,
    concluida: false,
    
    questoesRespondidas: [] as Array<{
      index: number;
      acertou: boolean;
      tentativas: number;
    }>
  });

  interface OfflineProgress {

    atividadeId: string;
    materia: string;
    progresso: typeof progressoLocal;
    concluida: boolean;
    timestamp: string;

  }

  const abrirAviso = useCallback(() => {
    setShowExitSheet(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
   
    setShowExitSheet(false);
    navigation.goBack();
  
  }, [navigation]);

  const saveOfflineProgress = async (progressData: OfflineProgress) => {
    
    try {
     
      const existingProgress = await AsyncStorage.getItem('@offline_progress');
      const progress = existingProgress ? JSON.parse(existingProgress) : {};
      progress[atividadeId] = progressData;
      await AsyncStorage.setItem('@offline_progress', JSON.stringify(progress));
 
    } catch (error) {
      console.error('Erro ao salvar progresso offline:', error);
    }
  };

  const clearOfflineProgress = async (activityId: string) => {
   
    try {
     
      const existingProgress = await AsyncStorage.getItem('@offline_progress');
      if (!existingProgress) return;
     
      const progress = JSON.parse(existingProgress);
      delete progress[activityId];
      await AsyncStorage.setItem('@offline_progress', JSON.stringify(progress));
   
    } catch (error) {
      console.error('Erro ao limpar progresso offline:', error);
    }
  };

  const syncOfflineProgress = useCallback(async () => {
    
    try {
     
      const activitiesData = await AsyncStorage.getItem('@offline_progress');
      if (!activitiesData) return; 
      const offlineProgress: Record<string, OfflineProgress> = JSON.parse(activitiesData);

      for (const [activityId, progress] of Object.entries(offlineProgress)) {
        await salvarProgressoFinal(progress.concluida, progress);
        await clearOfflineProgress(activityId);
      }
  
    } catch (error) {
      console.error('Erro ao sincronizar progresso offline:', error);
    }
  }, []);

  useEffect(() => {

    const setupNetworkListener = async () => {
      
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
    
      unsubscribeNetworkListenerRef.current = NetInfo.addEventListener(state => {
        setIsConnected(state.isConnected ?? false);
       
        if (state.isConnected) {
          syncOfflineProgress();
       
        }

      });
    };

    setupNetworkListener();
  
    return () => {

      if (unsubscribeNetworkListenerRef.current) {
        unsubscribeNetworkListenerRef.current();
      }
   
    };
  }, [syncOfflineProgress])

  useEffect(() => {
    carregarQuestao();
  }, []);

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

    keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
    
      Animated.timing(keyboardOffset, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    
    }).start());

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };

  }, [keyboardOffset]);

  const carregarQuestao = async () => {

    try {

      const questaoRef = doc(db, 'atividades', atividadeId);
      const questaoDoc = await getDoc(questaoRef);

      if (questaoDoc.exists()) {
      
        const questaoData = questaoDoc.data();
        setQuestao(questaoDoc.data()); 
        await saveActivityOffline(atividadeId, questaoData);
     
      } else {
        
        const offlineQuestao = await getOfflineActivity(atividadeId);
       
        if (offlineQuestao) {
          
          setQuestao(offlineQuestao);
          Alert.alert('Modo Offline', 'Carregando atividade salva localmente.');
      
        } else {
          Alert.alert('Erro', 'Questão não encontrada.');
          navigation.goBack();
        }

      }

    } catch (error) {

      console.error('Erro ao carregar questão.', error);
      const offlineQuestao = await getOfflineActivity(atividadeId);
  
      if (offlineQuestao) {
        setQuestao(offlineQuestao);
        Alert.alert('Modo Offline', 'Carregando atividade salva localmente.');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar a questão.');
        navigation.goBack();
      }

    } finally {
      setCarregando(false);
    }
  };
  
  const verificarResposta = async (respostaUsuario: any) => {
   
    if (!questao) return;

    const questaoData = questao.questoes[questaoAtual];
    let acertou = false;

    switch (questaoData.tipo) {

      case 'multipla-escolha':

        acertou = respostaUsuario === questaoData.correta;
        break;

      case 'verdadeiro-falso':

        acertou = respostaUsuario === questaoData.correta;
        break;

      case 'linha-tempo':
      case 'discursiva':
      case 'preencher-lacunas':
      case 'associar-colunas':
      case 'ordenar-lacunas':
      case 'classificar-colunas':

        acertou = respostaUsuario; 
        break;

      default:
        acertou = false;
    }

    setResposta(acertou);

    setProgressoLocal(prev => {
      
      const questaoRespondida = prev.questoesRespondidas.find(q => q.index === questaoAtual);
      let novasQuestoesRespondidas;

      if (questaoRespondida) {
        
        novasQuestoesRespondidas = prev.questoesRespondidas.map(q => q.index === questaoAtual ?
        { ...q, tentativas: q.tentativas + 1, acertou: q.acertou || acertou} : q);
      
      } else {
        novasQuestoesRespondidas = [...prev.questoesRespondidas, { index: questaoAtual, acertou, tentativas: 1}];
      }

      return {
        ...prev,
        acertos: prev.acertos + (acertou && !questaoRespondida?.acertou ? 1 : 0),
        tentativas: prev.tentativas + 1,
        questoesRespondidas: novasQuestoesRespondidas,
      };

    });

    let novasQuestoesErradas = [...questoesErradas];

    if (modoRevisao) {

      if (acertou) {
        novasQuestoesErradas = novasQuestoesErradas.filter(q => q !== questaoAtual);
      }

    } else {

      if (!acertou && !novasQuestoesErradas.includes(questaoAtual)) {
        novasQuestoesErradas.push(questaoAtual);
      }
    }

    setQuestoesErradas(novasQuestoesErradas);

    setFeedbackCorreto(acertou);
    setFeedbackExplicacao(questaoData.explicacao || '');
    setFeedbackVisivel(true);
  };

  const handleContinuarFeedback = () => {
   
    setFeedbackVisivel(false);
    
    setTimeout(() => {
      avancarQuestao(feedbackCorreto, questoesErradas);
    }, 300);

  };
  
  const avancarQuestao = async (acertou: boolean, novasQuestoesErradas: number[]) => {
    
    setQuestoesErradas(novasQuestoesErradas);
    
    if (modoRevisao) {

      if (novasQuestoesErradas.length === 0) {

        const xpGanho = progressoLocal.acertos * 10;
        
        salvarProgressoFinal(true).then(() => {
          Alert.alert('🏆 Parabéns!', `Você acertou todas as questões! Você ganhou 1 estrela e ${xpGanho} XP!`);
          navigation.goBack();
        });

        return;

      }

      const currentIndex = novasQuestoesErradas.indexOf(questaoAtual);
      const nextIndex = (currentIndex + 1) % novasQuestoesErradas.length;
      const proximaQuestao = novasQuestoesErradas[nextIndex];

      setQuestaoAtual(proximaQuestao);

      Animated.timing(translateX, {
        
        toValue: -proximaQuestao * width,
        duration: 300,
        useNativeDriver: true,
    
      }).start(() => setResposta(null));

    } else {

      if (questaoAtual < questao.questoes.length - 1) {

        const proximaQuestao = questaoAtual + 1;
        setQuestaoAtual(proximaQuestao);

        Animated.timing(translateX, {
         
          toValue: -proximaQuestao * width,
          duration: 300,
          useNativeDriver: true,
       
        }).start(() => setResposta(null));

      } else {

        if (novasQuestoesErradas.length > 0) {
          setMostrarTelaRevisao(true);

        } else {

          salvarProgressoFinal(true).then(() => {
            Alert.alert('🏆 Parabéns!', 'Atividade concluída com sucesso!');
            navigation.goBack();
          });

        }

      }
    }
  };

  const iniciarRevisao = () => {
    
    setModoRevisao(true);
    setMostrarTelaRevisao(false);
    setQuestaoAtual(questoesErradas[0]);

    Animated.timing(translateX, {
    
      toValue: -questoesErradas[0] * width,
      duration: 300,
      useNativeDriver: true,
    
    }).start(() => setResposta(null));

};

  const TelaInicioRevisao = () => (
   
   <View style={styles.telaRevisao}>
      
      <Image source={require('../../../assets/images/personagem.png')} style={[styles.imagemPersonagem, { width: '80%', height: '80%',
      right: 80, top: 120, position: 'relative'}]} resizeMode="contain" />

        <Text style={[styles.textoPergunta, {position: 'absolute', right: 60, bottom: 170, fontSize: 40}]}>
          Vamos revisar as {questoesErradas.length} questão{questoesErradas.length > 1 ? 'es' : ''} que você errou!
        </Text>

      <TouchableOpacity style={[styles.botaoContinuar, { marginRight: 30}]} onPress={iniciarRevisao}>
        <Text style={styles.textoContinuar}> Continuar </Text>
      </TouchableOpacity>

    </View>
  );
  
  const salvarProgressoFinal = async (concluida: boolean, progressoData?: OfflineProgress) => {
    
    const progresso = progressoData?.progresso || progressoLocal;
    
    try {

      const userId = await AsyncStorage.getItem("userId");

      if (!userId) {
        Alert.alert('Erro', 'Usuário não identificado.');
        return;
      }

      if (!isConnected) {

        const offlineProgress: OfflineProgress = {
          atividadeId, materia, progresso, concluida, timestamp: new Date().toISOString()
        };

        await saveOfflineProgress(offlineProgress);
        
        Alert.alert('Modo Offline', 'Seu progresso foi salvo localmente e será sincronizado quando você estiver online.');
        navigation.goBack();
        return;
      }

      const todasQuestoesCorretas = progressoLocal.questoesRespondidas.every(q => q.acertou);
      const estrelaGanha = todasQuestoesCorretas ? 1 : 0;
      const xpGanho = progressoLocal.acertos * 10;

      const progressoRef = doc(db, 'progresso', userId, materia, atividadeId);

      const progressoAtualDoc = await getDoc(progressoRef);
      const progressoAtual = progressoAtualDoc.exists() ? progressoAtualDoc.data() : {};

      await setDoc(progressoRef, {
        
        concluida,
        estrelas: (progressoAtual.estrelas || 0) + estrelaGanha, 
        xp: (progressoAtual.xp || 0) + xpGanho,
        tentativas: (progressoAtual.tentativas || 0) + progressoLocal.tentativas, 
        acertos: (progressoAtual.acertos || 0) + progressoLocal.acertos,
        dataConclusao: new Date(),
     
        questoes: {

          ...(progressoAtual.questoes || {}),
          ...progressoLocal.questoesRespondidas.reduce((acc, questao) => {
            
            acc[questao.index] = {
              concluida: questao.acertou,
              tentativas: (progressoAtual.questoes?.[questao.index]?.tentativas || 0) + questao.tentativas,
              ultimaTentativa: new Date()
            };

            return acc;

          }, {} as any)
        }
      }, { merge: true });

      if (estrelaGanha > 0 || xpGanho > 0) {
        
        const usuarioRef = doc(db, 'usuarios', userId);
      
        await updateDoc(usuarioRef, {
          xp: increment(xpGanho),
          estrelas: increment(estrelaGanha),
          ultimoLogin: new Date(),
          primeiraAtividade: true
        });
      }

    } catch (error) {
      console.error('Erro ao salvar progresso final:', error);

      if (!progressoData) {
        
        const offlineProgress: OfflineProgress = {
          atividadeId, materia, progresso: progressoLocal, concluida, timestamp: new Date().toISOString()
        };

        await saveOfflineProgress(offlineProgress);
        Alert.alert('Modo Offline', 'Seu progresso foi salvo localmente e será sincronizado quando você estiver online.');
      }
    }
  };

  const renderizarQuestaoEspecifica = (questaoData: any, index: number) => {
    
    if (index !== questaoAtual) return null;

    const propsComuns = {
      
      questao: questaoData,
      onResponder: verificarResposta,
      resposta: resposta
    
    };

    switch (questaoData.tipo) {

      case 'multipla-escolha':
        return <QuestaoMultipla {...propsComuns} />;
      
      case 'verdadeiro-falso':
        return <QuestaoVerdadeiroFalso {...propsComuns} />;
      
      case 'linha-tempo':
        return <QuestaoLinhaTempo {...propsComuns} />;
    
      case 'discursiva':
        return <QuestaoDiscursiva {...propsComuns} />;
    
      case 'preencher-lacunas':
        return <QuestaoPreencherLacunas {...propsComuns} />;

      case 'associar-colunas':
        return <QuestaoAssociarColunas {...propsComuns} />;  

      case 'ordenar-lacunas':
        return <QuestaoOrdenar {...propsComuns} />;
      
      case 'classificar-colunas':
        return <QuestaoClassificarColunas {...propsComuns} />;
        
      default:
        return <Text>Tipo de questão não suportado.</Text>;
    }
  };

  if (carregando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={{ color: 'white', fontSize: 30, textAlign: 'center', fontFamily: 'Jersey10_400Regular'}}>Carregando...</Text>
      </View>
    );
  }

  if (!questao) {

    return (
      <View style={styles.container}>
        <Text>Questão não encontradaa</Text>
      </View>
    );

  }

  return (
    
    <View style={styles.container}>

      <TouchableOpacity style={{ position: 'absolute', top: 40, right: 15, zIndex: 10 }} onPress={abrirAviso}>
        <Text style={{ color: 'white', fontSize: 20, fontFamily: 'PressStart2P_400Regular', }}>X</Text>
      </TouchableOpacity>

      {!mostrarTelaRevisao && (
        
        <>
        
        <View style={{ paddingHorizontal: 20}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 50, marginTop: 20 }}>     
            <View style={styles.progressBarContainer}>
              
              <View style={[styles.progressBar, { width: modoRevisao ? `${((progressoLocal.questoesRespondidas.filter(q => q.acertou).length)
              / questao.questoes.length) * 100}%` : `${((questaoAtual + 1) / questao.questoes.length) * 100}%`}]} />

            </View>
          </View>
        </View>
        
        <View style={styles.sliderContainer}>
          
          <Animated.View style={[styles.slider, { transform: [{ translateX }] }]}> {questao && questao.questoes && questao.questoes.map
          ((questaoData: any, index: number) => (
          
          <View key={index} style={styles.tela}> {renderizarQuestaoEspecifica(questaoData, index)} </View>

          ))}
          </Animated.View>
        </View>
      </>  
    )}

    {mostrarTelaRevisao && <TelaInicioRevisao />}
    
    <Feedback visivel={feedbackVisivel} correto={feedbackCorreto} explicacao={feedbackExplicacao} onContinuar={handleContinuarFeedback}
    tipoQuestao={questao?.questoes[questaoAtual]?.tipo} respostaEsperada={questao?.questoes[questaoAtual]?.respostaEsperada}/>

    {showExitSheet && (

      <View style={styles.overlay}>
        <ExitSheet fecharTela={() => setShowExitSheet(false)} confirmarSaida={handleConfirmExit} />
      </View> 

    )}

    </View>
  );
}

const styles = StyleSheet.create({

  feedbackExplicacaoTextoPequeno: {
    fontSize: 12,
    lineHeight: 20,
  },

  afirmativaContainerExtra: {
    paddingHorizontal: 25,
    marginBottom: 10,
  },

  afirmativaExtraGrande: {
    fontSize: 20, 
    lineHeight: 24,
    textAlign: 'center',
  },
  
  botaoVFExtra: {
    padding: 12,
    minHeight: 45,
    minWidth: 120,
  },

  textoOpcaoExtra: {
    fontSize: 25, 
  },

  botaoClassificarTres: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    minWidth: 90,
    minHeight: 30,
    borderRadius: 15,
    marginRight: 3,
    marginLeft: 3
  }, 

  textoClassificarTres: {
    fontSize: 16, 
    fontFamily: 'Jersey10_400Regular',
  },

  colunasContainerTres: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
  },

  linhaColunas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    marginBottom: 15,
  },

  linhaUnica: {
    width: '60%',
    alignItems: 'center',
  },

  colunaTres: {
    flex: 1,
    marginHorizontal: 10,
    minHeight: 180,
  },

  colunaTresUnica: {
    width: '80%',
    minHeight: 180,
  },

  areaItensClassificar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 50,
    marginTop: -60,
    marginHorizontal: 10
  },

  botaoClassificar: {
    backgroundColor: 'white',
    borderRadius: 20, 
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 150, 
    minHeight: 35,
    justifyContent: 'center',
  },

  textoClassificar: {
    color: '#221377',
    fontSize: 20, 
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center',
  },

  colunaAtiva: {
    borderColor: '#8581FF',
    borderWidth: 2,
  },
  
  botoesInferiores: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 20,
  },

  colunasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  coluna: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 10,
    minHeight: 250,
  },

  tituloColuna: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center',
    marginBottom: 10,
  },

  itemNaColuna: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Jersey10_400Regular',
    marginVertical: 5,
  },

  areaItens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  
  telaRevisao: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#221377',
  },
  
  afirmativaContainer: {
    paddingTop: 40, 
    paddingHorizontal: 30,
  },
  
  afirmativaGrande: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center',
    lineHeight: 35,
  },

  containerUmaPalavra: {
    alignItems: 'center',
    marginBottom: 350
  },

  inputUmaPalavra: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 15,
    width: '80%',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Jersey10_400Regular',
    color: '#221377',
    borderWidth: 2,
    borderColor: '#8581FF',
  },

  inputDiscursiva: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 20,
    minHeight: 150,
    textAlignVertical: 'top',
    marginHorizontal: 30,
    marginBottom: 350,
     fontSize: 24,
    fontFamily: 'Jersey10_400Regular',
    color: '#221377',
    borderWidth: 2,
    borderColor: '#8581FF',
  },

  item: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 10,
    borderRadius: 20,
    paddingHorizontal: 70
  },

  itemArrastando: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  textoItem: {
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
    color: '#221377',
    textAlign: 'center'
  },

  offlineIndicator: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    padding: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  
  offlineText: {
    color: 'white',
    fontWeight: 'bold',
  },

  opcoesPreencher: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  texto: {
    color: 'white',
    fontSize: 25,
    lineHeight: 35,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'justify',
    paddingHorizontal: 20,
    paddingBottom: 40
  },

  botaoOpcoes: {
    backgroundColor: 'white',
    borderRadius: 30,
    minWidth: 110,
    minHeight: 45,
    justifyContent: 'center'
  },

  textoOpcoes: {
    color: '#221377',
    fontSize: 25,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center'
  },

  ano: {
    color: 'white',
    fontSize: 30,
    marginRight: 10,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'right'
  },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'space-between',
    color: 'white',
  },

  lacuna: {
    backgroundColor: '#0b0366',
    paddingHorizontal: 20,
    height: 50,
    paddingVertical: 10,
    color: 'white',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 30,
    width: 200,
    borderRadius: 30,
    textAlign: 'center'
  },

  itemCorreto: { backgroundColor: '#00BB80', },
  itemIncorreto: { backgroundColor: '#d65858ff', },
  
  areaSuperior: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: '30%',
  },

  overlayFeedback: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },

  feedbackContainer: {
    width: '100%',
    backgroundColor: 'white',
    padding: 25,
    alignItems: 'flex-start',
  },

  feedbackCorreto: { backgroundColor: '#E8F5E9', },
  feedbackIncorreto: { backgroundColor: '#FFEBEE', },

  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    justifyContent: 'flex-start',
  },

  feedbackIcon: {
    fontSize: 20,
    marginRight: 0,
  },

  feedbackTitulo: {
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
    color: '#221377',
    textAlign: 'center',
  },

  feedbackMensagem: {
    fontSize: 25,
    textAlign: 'left',
    fontFamily: 'Jersey10_400Regular',
    color: '#221377',
  },

  feedbackExplicacao: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginBottom: 30,
    flex: 1,
  },

  feedbackExplicacaoTexto: {
    fontSize: 16,
    lineHeight: 24,
    color: '#221377',
    textAlign: 'justify',
    fontFamily: 'InriaSans_400Regular',
  },

  feedbackBotaoContinuar: {
    backgroundColor: '#221377',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },

  feedbackBotaoTexto: {
    color: 'white',
    fontSize: 26,
    fontFamily: 'Jersey10_400Regular',
  },

  botaoSelecionado: { backgroundColor: '#5551c8ff', },
  botaoContinuarDesabilitado: { opacity: 0.5},
  textoSelecionado: { color: '#b4b2ffff'},

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
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

  container: {
    flex: 1,
    backgroundColor: '#221377',
    paddingTop: 20,
    paddingBottom: 0,
    paddingLeft: 0,
  },

  botao: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 30,
    alignItems: 'center',
    width: '90%',
    marginHorizontal: 25
  },

  opcoesContainer: {
    gap: 15,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },

  tipoContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },

  pergunta: {
    color: '#8581FF',
    fontSize: 35,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center', 
    alignSelf: 'center',     
    paddingRight: width * 0.1
  },

  textoOpcao: {
    color: '#221377',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center',
  },

  sliderContainer: {
    flex: 1,
    width: '110%',
    overflow: 'hidden',
  },

  slider: {
    flexDirection: 'row',
    flex: 1,
  },
  
  tela: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  areaInferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  imagemBloco: {
    width: 600,
    height: 50,
    bottom: 0,
  },

  imagemPersonagem: {
    position: 'absolute',
    right: Platform.OS === 'web' ? width * 0.4 : width * 0.45,
    bottom: 15, 
    width: 200, 
    height: 200,
    zIndex: 2,
  },

  balaoContainer: {
    position: 'absolute',
    left: Platform.OS === 'web' ? width * 0.2 : width * 0.3, 
    bottom: 140, 
    zIndex: 3,
    width: width * 0.65, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  imagemBalao: {
    width: '100%',
    height: 200,
    paddingHorizontal: 130,
  },

  textoPergunta: {
    position: 'absolute',
    color: '#8581FF',
    fontSize: 22, 
    textAlign: 'center',
    width: '65%',
    height: '50%',
    fontFamily: 'Jersey10_400Regular', 
  },

  botaoContinuar: {
    position: 'absolute',
    right: Platform.OS === 'web' ? width * -0.04 : width * 0.01,
    bottom: 100, 
    backgroundColor: '#8581FF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30, 
    zIndex: 2,
    minWidth: 180,
    alignItems: 'center',
  },

  textoContinuar: {
    color: 'white',
    fontSize: 30,
    fontFamily: 'Jersey10_400Regular',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },

  botaoVF: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: Platform.OS === 'web' ? 120 : 100,
    minWidth: Platform.OS === 'web' ? 150 : 130,
  },

}); 

const stylesAssociarColunas = StyleSheet.create({

  botaoEsquerdo: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    width: '90%',
    marginHorizontal: 10,
    marginTop: 20,
    position: 'relative',
    bottom: '30%'
  },

  textoPergunta: {
    position: 'absolute',
    color: '#8581FF',
    fontSize: 20, 
    textAlign: 'center',
    width: '70%',
    height: '50%',
    fontFamily: 'Jersey10_400Regular', 
  },

  imagemBalao: {
    width: '100%',
    height: 210,
    paddingHorizontal: 140,
  },

  botao: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    width: '90%',
    marginHorizontal: 10,
    marginTop: 20
  },

  textoOpcoes: {
    fontFamily: 'Jersey10_400Regular',
    fontSize: 20,
    color: '#221377',
    textAlign: 'center'
  },

  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  colunasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    flex: 1,
  },

  coluna: {
    flex: 1,
    paddingTop: 50
  },

  botaoItem: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },

  itemNormal: {
    backgroundColor: 'white',
    borderColor: '#8581FF',
  },

  itemSelecionado: {
    backgroundColor: '#c6c4ffff',
    borderColor: '#9692ffff',
  },

  itemCorreto: {
    backgroundColor: '#9bffdfff',
  },

  itemIncorreto: {
    backgroundColor: '#d65858ff',
  },

  itemDesabilitado: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    opacity: 0.6,
  },

  textoItem: {
    fontSize: 18,
    textAlign: 'center',
    color: '#221377',
    fontFamily: 'Jersey10_400Regular',
  },

});