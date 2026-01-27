import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { SPORTS, Sport } from '../constants/sports';

interface SportPickerProps {
  visible: boolean;
  selected: string;
  onSelect: (sport: string) => void;
  onClose: () => void;
}

export default function SportPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: SportPickerProps) {
  const handleSelect = (sport: Sport) => {
    onSelect(sport.value);
  };

  const handleDone = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>Select Sport</Text>
          <Text style={styles.subtitle}>
            Which athletic program are you interested in?
          </Text>

          {/* Sport list */}
          <View style={styles.list}>
            {SPORTS.map((sport) => {
              const isSelected = selected === sport.value;
              return (
                <TouchableOpacity
                  key={sport.value}
                  style={[styles.row, isSelected && styles.rowSelected]}
                  onPress={() => handleSelect(sport)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${sport.color}20` }]}>
                    <MaterialCommunityIcons
                      name={sport.icon}
                      size={22}
                      color={sport.color}
                    />
                  </View>
                  <Text style={[styles.label, isSelected && styles.labelSelected]}>
                    {sport.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <MaterialCommunityIcons name="check" size={16} color={Colors.background} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Done button */}
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowSelected: {
    backgroundColor: `${Colors.primary}10`,
    borderRadius: 12,
    borderBottomColor: 'transparent',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
});
