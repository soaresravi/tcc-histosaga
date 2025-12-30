import { StyleSheet, Dimensions } from "react-native"

const SCREEN_WIDTH = Dimensions.get("window").width

export const SHEET_HEIGHT = 274
export const SHEET_OVER_DRAG = 50

export const styles = StyleSheet.create({

  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SHEET_HEIGHT,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    justifyContent: 'flex-start',
  },
  
  titulo: {
    fontSize: 35,
    textAlign: "center",
    fontFamily: 'Jersey10_400Regular',
    color: '#8581FF',
    marginBottom: 10,
  },

  botoesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },

  botaoCancelar: {
    paddingVertical: 5,
    paddingHorizontal: 0,
    width: '100%',
    backgroundColor: '#221377',
    borderRadius: 30,
    alignItems: 'center',
  },
  textoSair: {
    color: '#4D48C8',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 25,
  },
  textoCancelar: {
    color: 'white',
    fontFamily: 'Jersey10_400Regular',
    fontSize: 30,
  },
})
