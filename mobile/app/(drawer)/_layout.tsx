import { Drawer } from 'expo-router/drawer';
import Colors from '../../constants/colors';
import CustomDrawerContent from '../../components/CustomDrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: Colors.cardBackground,
          width: 300,
        },
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        sceneStyle: {
          backgroundColor: Colors.background,
        },
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{ title: 'SKOUT' }}
      />
      <Drawer.Screen
        name="contacts"
        options={{ title: 'All Contacts' }}
      />
      <Drawer.Screen
        name="templates"
        options={{ title: 'Templates' }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
