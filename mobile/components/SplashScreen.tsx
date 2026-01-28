import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>SKOUT</Text>
        <View style={styles.underline} />
      </View>

      <Text style={styles.powered}>POWERED BY SKOUT</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  underline: {
    width: 40,
    height: 3,
    backgroundColor: Colors.textPrimary,
    marginTop: 8,
    borderRadius: 2,
  },
  powered: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 3,
  },
});
