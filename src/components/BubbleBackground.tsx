import { View, StyleSheet } from 'react-native';

export default function BubbleBackground() {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.bubble, styles.bubble1]} />
      <View style={[styles.bubble, styles.bubble2]} />
      <View style={[styles.bubble, styles.bubble3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex:0
  },

  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },

  bubble1: {
    width: 220,
    height: 220,
    top: -60,
    right: -40,
    backgroundColor: 'rgba(99,102,241,0.08)',
  },

  bubble2: {
    width: 180,
    height: 180,
    bottom: 120,
    left: -50,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },

  bubble3: {
    width: 140,
    height: 140,
    top: '45%',
    right: -20,
    backgroundColor: 'rgba(59,130,246,0.06)',
  },
});