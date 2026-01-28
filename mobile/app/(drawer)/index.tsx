import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useSearchStore } from '../../stores/searchStore';
import SportPicker from '../../components/SportPicker';
import SearchProgress from '../../components/SearchProgress';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function SkoutScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [sportPickerVisible, setSportPickerVisible] = useState(false);

  const { school, sport, stage, error, setSchool, setSport, search, reset } =
    useSearchStore();

  const isSearching = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  const handleSearch = async () => {
    if (!school.trim()) {
      Alert.alert('Missing School', 'Please enter a school name.');
      return;
    }
    if (!sport) {
      Alert.alert('Missing Sport', 'Please select a sport type.');
      return;
    }

    await search(API_URL);

    const currentStage = useSearchStore.getState().stage;
    if (currentStage === 'complete') {
      const results = useSearchStore.getState().results;
      if (results.length === 0) {
        Alert.alert(
          'No Coaches Found',
          'We couldn\'t find any coaches for that search. Try a different school or sport.',
        );
        reset();
      } else {
        router.push('/results');
      }
    } else if (currentStage === 'error') {
      const err = useSearchStore.getState().error;
      Alert.alert('Search Failed', err ?? 'Something went wrong. Please try again.');
      reset();
    }
  };

  // Show progress overlay while searching
  if (isSearching) {
    return <SearchProgress stage={stage} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="menu" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SKOUT 1.0</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </View>

        <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={18} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.heading}>Where do you{'\n'}want to play?</Text>

        {/* School input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search school name..."
            placeholderTextColor={Colors.textMuted}
            value={school}
            onChangeText={setSchool}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Sport selector */}
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={() => setSportPickerVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.input, styles.selectorText, !sport && styles.placeholderText]}>
            {sport || 'Select sport type'}
          </Text>
          <Ionicons name="options-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.findButton}
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Text style={styles.findButtonText}>Find Opportunities</Text>
        </TouchableOpacity>

        <Text style={styles.powered}>POWERED BY SKOUT INTELLIGENCE</Text>
      </View>

      {/* Sport Picker */}
      <SportPicker
        visible={sportPickerVisible}
        selected={sport}
        onSelect={setSport}
        onClose={() => setSportPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  profileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 40,
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  selectorText: {
    paddingVertical: 0,
  },
  placeholderText: {
    color: Colors.textMuted,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  findButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  findButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  powered: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 1.5,
  },
});
