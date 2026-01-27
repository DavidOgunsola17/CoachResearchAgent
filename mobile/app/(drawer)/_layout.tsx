import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        drawerStyle: {
          backgroundColor: Colors.cardBackground,
          width: 280,
        },
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: Colors.textSecondary,
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
          marginLeft: -8,
        },
        drawerItemStyle: {
          borderRadius: 12,
          paddingVertical: 2,
          marginHorizontal: 8,
        },
        sceneStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'SKOUT',
          headerTitle: 'SKOUT',
          drawerLabel: 'SKOUT',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          drawerLabel: 'Contacts',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="templates"
        options={{
          title: 'Templates',
          drawerLabel: 'Templates',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
