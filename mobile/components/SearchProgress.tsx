import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import { SearchStage } from '../stores/searchStore';

interface SearchProgressProps {
  stage: SearchStage;
}

const STAGES: { key: SearchStage; label: string }[] = [
  { key: 'discovering', label: 'Finding directories...' },
  { key: 'extracting', label: 'Extracting coach data...' },
  { key: 'normalizing', label: 'Cleaning up results...' },
];

export default function SearchProgress({ stage }: SearchProgressProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />

      <View style={styles.stages}>
        {STAGES.map((s) => {
          const isActive = s.key === stage;
          const isDone = stageIndex(stage) > stageIndex(s.key);

          return (
            <View key={s.key} style={styles.stageRow}>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isActive && styles.dotActive,
                ]}
              />
              <Text
                style={[
                  styles.stageText,
                  isDone && styles.stageTextDone,
                  isActive && styles.stageTextActive,
                ]}
              >
                {isDone ? s.label.replace('...', '') + ' ✓' : s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.hint}>This may take up to a minute</Text>
    </View>
  );
}

function stageIndex(stage: SearchStage): number {
  switch (stage) {
    case 'discovering':
      return 0;
    case 'extracting':
      return 1;
    case 'normalizing':
      return 2;
    case 'complete':
      return 3;
    default:
      return -1;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  spinner: {
    marginBottom: 32,
  },
  stages: {
    gap: 16,
    marginBottom: 32,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surfaceBackground,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  dotDone: {
    backgroundColor: Colors.success,
  },
  stageText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  stageTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stageTextDone: {
    color: Colors.success,
  },
  hint: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
