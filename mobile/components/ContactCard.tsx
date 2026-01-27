import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { getAvatarColor, getInitials, getBadgeColor } from '../constants/sports';
import { SavedCoach } from '../stores/contactsStore';

interface ContactCardProps {
  coach: SavedCoach;
  selected?: boolean;
  editMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onMessage?: () => void;
}

export default function ContactCard({
  coach,
  selected,
  editMode,
  onPress,
  onLongPress,
  onMessage,
}: ContactCardProps) {
  const avatarColor = getAvatarColor(coach.name);
  const initials = getInitials(coach.name);
  const badgeColor = getBadgeColor(coach.position);
  const positionLabel = coach.position.toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.containerSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Edit mode checkbox */}
      {editMode && (
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
        <Text style={styles.name} numberOfLines={1}>
          {coach.name}
        </Text>
        <View style={styles.detailRow}>
          <View style={[styles.badge, { backgroundColor: `${badgeColor}20` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]} numberOfLines={1}>
              {positionLabel}
            </Text>
          </View>
          {coach.school ? (
            <Text style={styles.school} numberOfLines={1}>
              {'\u2022 '}{coach.school}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Contacted tag */}
      {coach.contacted && (
        <View style={styles.contactedTag}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
        </View>
      )}

      {/* Message icon */}
      {!editMode && (
        <TouchableOpacity
          style={styles.messageIcon}
          onPress={onMessage}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chatbubble" size={20} color={Colors.textMuted} />
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
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
  school: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  contactedTag: {
    marginRight: 8,
  },
  messageIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
});
