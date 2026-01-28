import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { DrawerActions } from '@react-navigation/native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { useAuthStore } from '../stores/authStore';

interface DrawerItem {
  label: string;
  route: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const DRAWER_ITEMS: DrawerItem[] = [
  {
    label: 'SKOUT',
    route: '/(drawer)',
    icon: <MaterialCommunityIcons name="compass-outline" size={22} color={Colors.textSecondary} />,
    activeIcon: <MaterialCommunityIcons name="compass-outline" size={22} color={Colors.background} />,
  },
  {
    label: 'All Contacts',
    route: '/(drawer)/contacts',
    icon: <Ionicons name="people-outline" size={22} color={Colors.textSecondary} />,
    activeIcon: <Ionicons name="people-outline" size={22} color={Colors.background} />,
  },
  {
    label: 'Templates',
    route: '/(drawer)/templates',
    icon: <MaterialCommunityIcons name="layers-outline" size={22} color={Colors.textSecondary} />,
    activeIcon: <MaterialCommunityIcons name="layers-outline" size={22} color={Colors.background} />,
  },
];

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const closeDrawer = () => {
    props.navigation.dispatch(DrawerActions.closeDrawer());
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
    closeDrawer();
  };

  const isActive = (route: string) => {
    if (route === '/(drawer)') {
      return pathname === '/' || pathname === '/(drawer)';
    }
    return pathname.includes(route.replace('/(drawer)', ''));
  };

  return (
    <View style={styles.container}>
      {/* Header: SKOUT logo + X close */}
      <View style={styles.header}>
        <Text style={styles.logo}>SKOUT</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={closeDrawer}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Navigation Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
      >
        <View style={styles.navItems}>
          {DRAWER_ITEMS.map((item) => {
            const active = isActive(item.route);
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigateTo(item.route)}
                activeOpacity={0.7}
              >
                {active ? item.activeIcon : item.icon}
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Bottom Section: Settings / Profile */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigateTo('/(drawer)/settings')}
          activeOpacity={0.7}
        >
          <View style={styles.profileAvatar}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Settings</Text>
            <Text style={styles.profileSub}>
              {user?.email ?? 'Profile & Preferences'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.versionText}>SKOUT INTELLIGENCE V1.0.4</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 0,
  },
  navItems: {
    paddingHorizontal: 16,
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: Colors.surfaceBackground,
    gap: 14,
  },
  navItemActive: {
    backgroundColor: Colors.textPrimary,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  navLabelActive: {
    color: Colors.background,
    fontWeight: '700',
  },
  bottomSection: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBackground,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
    marginHorizontal: 4,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    paddingHorizontal: 4,
  },
});
