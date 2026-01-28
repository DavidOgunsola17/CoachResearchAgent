import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { getAvatarColor, getInitials, getBadgeColor } from '../constants/sports';
import { CoachProfile } from '../stores/searchStore';

interface CoachCardProps {
  coach: CoachProfile;
  saved: boolean;
  selected?: boolean;
  selectMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onSaveToggle: () => void;
}

export default function CoachCard({
  coach,
  saved,
  selected,
  selectMode,
  onPress,
  onLongPress,
  onSaveToggle,
}: CoachCardProps) {
  const avatarColor = getAvatarColor(coach.name);
  const initials = getInitials(coach.name);
  const badgeColor = getBadgeColor(coach.position);
  const positionLabel = coach.position.toUpperCase();
  const schoolSport = [coach.school, coach.sport].filter(Boolean).join(' ');

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.containerSelected,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Selection indicator (multi-select mode) */}
      {selectMode && (
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />}
        </View>
      )}

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {coach.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]} numberOfLines={1}>
              {positionLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.schoolSport} numberOfLines={1}>
          {schoolSport}
        </Text>
      </View>

      {/* Save button */}
      {!selectMode && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={onSaveToggle}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {saved ? (
            <View style={styles.savedIcon}>
              <Ionicons name="checkmark" size={18} color={Colors.background} />
            </View>
          ) : (
            <View style={styles.addIcon}>
              <Ionicons name="add" size={22} color={Colors.textPrimary} />
            </View>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  containerSelected: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  schoolSport: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
