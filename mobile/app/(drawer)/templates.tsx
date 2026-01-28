import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import {
  useTemplatesStore,
  getTemplateColor,
} from '../../stores/templatesStore';

export default function TemplatesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { templates, loading, loadTemplates, deleteTemplate, ensureDefaults } =
    useTemplatesStore();

  useEffect(() => {
    const init = async () => {
      await loadTemplates();
      await ensureDefaults();
    };
    init();
  }, []);

  const handleEdit = (index: number) => {
    router.push({
      pathname: '/template-editor',
      params: { index: String(index) },
    });
  };

  const handleCreate = () => {
    router.push({
      pathname: '/template-editor',
      params: { index: '-1' },
    });
  };

  const handleDelete = (index: number) => {
    const template = templates[index];
    Alert.alert(
      'Delete Template',
      `Delete "${template.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTemplate(template),
        },
      ],
    );
  };

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

        <Text style={styles.headerLogo}>SKOUT</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Templates</Text>
        <Text style={styles.subtitle}>
          Manage and generate your outreach templates here!
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {templates.map((template, index) => {
            const color = getTemplateColor(index);
            const preview =
              template.message_body.length > 35
                ? template.message_body.substring(0, 35) + '...'
                : template.message_body;

            return (
              <TouchableOpacity
                key={template.id ?? template.name + index}
                style={styles.templateCard}
                onPress={() => handleEdit(index)}
                onLongPress={() => handleDelete(index)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templatePreview} numberOfLines={1}>
                    {preview}
                  </Text>
                </View>
                <View style={[styles.editIconBg, { backgroundColor: `${color}18` }]}>
                  <Ionicons name="create" size={20} color={color} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Create button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={Colors.background} />
          <Text style={styles.createButtonText}>Create New Template</Text>
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
  titleSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 18,
    padding: 20,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  templatePreview: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  editIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: Colors.textPrimary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
});
