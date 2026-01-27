import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

export default function ContactsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Saved Contacts</Text>
      <Text style={styles.subtitle}>Your saved coaches will appear here</Text>
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
