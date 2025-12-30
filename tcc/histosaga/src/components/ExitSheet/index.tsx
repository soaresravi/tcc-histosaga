import { Text, View, TouchableOpacity } from "react-native"
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler"
import Animated, { useSharedValue, withSpring, withTiming, runOnJS, useAnimatedStyle, SlideInDown, SlideOutDown, } from "react-native-reanimated"
import { styles, SHEET_HEIGHT, SHEET_OVER_DRAG } from "./styles"

type Props = {
  fecharTela: () => void
  confirmarSaida: () => void
}

export function ExitSheet({ fecharTela, confirmarSaida }: Props) {
  const offset = useSharedValue(0)

  function fechar() {
    offset.value = 0
    fecharTela()
  }

  const pan = Gesture.Pan()
    .onChange((event) => {

      const offsetDelta = event.changeY + offset.value
      const clamp = Math.max(-SHEET_OVER_DRAG, offsetDelta)
      offset.value = offsetDelta > 0 ? offsetDelta : withSpring(clamp)
    })
    .onFinalize(() => {
      if (offset.value < SHEET_HEIGHT / 3) {
        offset.value = withSpring(0)
      } else {
        offset.value = withTiming(SHEET_HEIGHT, {}, () => {
          runOnJS(fechar)()
        })
      }
    })

  const translateY = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }))

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
       <GestureDetector gesture={pan}>
      <Animated.View
  style={[
    styles.container,
    translateY,
  ]}
  entering={SlideInDown.springify().damping(15)}
  exiting={SlideOutDown}
>


        <Text style={styles.titulo}>Deseja realmente sair? </Text>
        <Text style={ { fontFamily: 'InriaSans_400Regular', fontSize: 20, color: '#8D7B7B', textAlign: 'center', marginBottom: 50}}> Seu cadastro será perdido e você terá que recomeçar depois. </Text>

        <View style={styles.botoesContainer}>
          <TouchableOpacity onPress={fechar} style={styles.botaoCancelar}>
            <Text style={styles.textoCancelar}>Não, cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmarSaida}>
            <Text style={styles.textoSair}>Sim, sair</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
    </GestureHandlerRootView>
 
  )
}
