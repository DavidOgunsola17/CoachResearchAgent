import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useSearchStore } from '../stores/searchStore';
import CoachCard from '../components/CoachCard';

export default function ResultsScreen() {
  const router = useRouter();
  const {
    results,
    selectedIndices,
    toggleSelect,
    clearSelection,
    toggleSaved,
    isSaved,
    reset,
  } = useSearchStore();

  const selectMode = selectedIndices.size > 0;

  const handleCardPress = useCallback(
    (index: number) => {
      if (selectMode) {
        toggleSelect(index);
      } else {
        router.push({ pathname: '/coach-profile', params: { index: String(index) } });
      }
    },
    [selectMode],
  );

  const handleCardLongPress = useCallback((index: number) => {
    toggleSelect(index);
  }, []);

  const handleSaveToggle = useCallback((index: number) => {
    const coach = useSearchStore.getState().results[index];
    const saved = useSearchStore.getState().isSaved(coach);
    if (saved) {
      Alert.alert(
        'Unsave Coach',
        `Remove ${coach.name} from your saved contacts?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unsave',
            style: 'destructive',
            onPress: () => toggleSaved(coach),
          },
        ],
      );
    } else {
      toggleSaved(coach);
    }
  }, []);

  const handleMessage = () => {
    if (selectMode) {
      Alert.alert(
        'Send Message',
        `Send a message to ${selectedIndices.size} selected coach${selectedIndices.size > 1 ? 'es' : ''}?\n\n(Messaging will be available in a future update)`,
      );
    } else {
      Alert.alert(
        'Send Message',
        'Long-press coaches to select them for bulk messaging, or tap MESSAGE to message all.\n\n(Messaging will be available in a future update)',
      );
    }
  };

  const handleExit = () => {
    clearSelection();
    reset();
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleExit}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="menu" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerLogo}>SKOUT</Text>

        {selectMode ? (
          <TouchableOpacity onPress={clearSelection}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Coaches</Text>
        <Text style={styles.subtitle}>
          I found {results.length} coach{results.length !== 1 ? 'es' : ''} for you!
        </Text>
        {selectMode && (
          <Text style={styles.selectedCount}>
            {selectedIndices.size} selected
          </Text>
        )}
      </View>

      {/* Coach list */}
      <FlatList
        data={results}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <CoachCard
            coach={item}
            saved={isSaved(item)}
            selected={selectedIndices.has(index)}
            selectMode={selectMode}
            onPress={() => handleCardPress(index)}
            onLongPress={() => handleCardLongPress(index)}
            onSaveToggle={() => handleSaveToggle(index)}
          />
        )}
      />

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleMessage}
          activeOpacity={0.8}
        >
          <Text style={styles.messageText}>
            MESSAGE{selectMode ? ` (${selectedIndices.size})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExit}
          activeOpacity={0.8}
        >
          <Text style={styles.exitText}>EXIT</Text>
        </TouchableOpacity>
      </View>
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
  headerLogo: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  cancelText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  selectedCount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomButtons: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 10,
  },
  messageButton: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  exitButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  exitText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.background,
    letterSpacing: 2,
  },
});
