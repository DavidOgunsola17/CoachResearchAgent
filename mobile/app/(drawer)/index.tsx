import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

export default function SkoutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Coach Discovery</Text>
      <Text style={styles.subtitle}>Search for coaches by school and sport</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholder: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
