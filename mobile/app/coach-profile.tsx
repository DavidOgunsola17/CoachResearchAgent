import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/colors';
import { useSearchStore } from '../stores/searchStore';
import {
  getInitials,
  getAvatarGradient,
} from '../constants/sports';

export default function CoachProfileScreen() {
  const router = useRouter();
  const { index } = useLocalSearchParams<{ index: string }>();
  const results = useSearchStore((s) => s.results);

  const coachIndex = parseInt(index ?? '0', 10);
  const coach = results[coachIndex];

  if (!coach) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Coach not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = getInitials(coach.name);
  const gradient = getAvatarGradient(coach.name);
  const subtitleParts = [coach.school, coach.position].filter(Boolean);

  const handleEmail = () => {
    if (coach.email) {
      Linking.openURL(`mailto:${coach.email}`).catch(() =>
        Alert.alert('Error', 'Could not open email client.'),
      );
    }
  };

  const handlePhone = () => {
    if (coach.phone) {
      Linking.openURL(`tel:${coach.phone}`).catch(() =>
        Alert.alert('Error', 'Could not open phone app.'),
      );
    }
  };

  const handleTwitter = () => {
    if (coach.twitter) {
      // Extract handle from URL or raw handle
      let handle = coach.twitter.replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '');
      handle = handle.replace(/^@/, '');
      Linking.openURL(`https://twitter.com/${handle}`).catch(() =>
        Alert.alert('Error', 'Could not open Twitter.'),
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="menu" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerLogo}>SKOUT</Text>

        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={26} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>

          <Text style={styles.coachName}>{coach.name}</Text>
          <Text style={styles.coachSubtitle}>
            {subtitleParts.join(' \u2022 ')}
          </Text>
        </View>

        {/* Detail Card */}
        <View style={styles.detailCard}>
          {/* School */}
          {coach.school ? (
            <DetailRow
              icon={<MaterialCommunityIcons name="school" size={20} color={Colors.textSecondary} />}
              label="SCHOOL"
              value={coach.school}
            />
          ) : null}

          {/* Position */}
          {coach.position ? (
            <DetailRow
              icon={<MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.textSecondary} />}
              label="POSITION"
              value={coach.position}
            />
          ) : null}

          {/* Email */}
          {coach.email ? (
            <DetailRow
              icon={<Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />}
              label="EMAIL"
              value={coach.email}
              onPress={handleEmail}
              isLink
            />
          ) : null}

          {/* Phone */}
          {coach.phone ? (
            <DetailRow
              icon={<Ionicons name="phone-portrait-outline" size={20} color={Colors.textSecondary} />}
              label="PHONE"
              value={coach.phone}
              onPress={handlePhone}
              isLink
            />
          ) : null}

          {/* Twitter */}
          {coach.twitter ? (
            <DetailRow
              icon={<Ionicons name="at" size={20} color={Colors.textSecondary} />}
              label="TWITTER / X"
              value={formatTwitter(coach.twitter)}
              onPress={handleTwitter}
              isLink
              isLast
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

// --- Helper Components ---

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
  isLink?: boolean;
  isLast?: boolean;
}

function DetailRow({ icon, label, value, onPress, isLink, isLast }: DetailRowProps) {
  const content = (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <View style={styles.detailIconCircle}>{icon}</View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, isLink && styles.detailValueLink]}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function formatTwitter(raw: string): string {
  let handle = raw.replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '');
  handle = handle.replace(/^@/, '');
  return `@${handle}`;
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  backLink: {
    color: Colors.primary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
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
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 28,
  },
  avatarGradient: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  coachName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  coachSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  detailCard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  detailValueLink: {
    color: Colors.textPrimary,
  },
});
