import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useContactsStore, SavedCoach } from '../../stores/contactsStore';
import ContactCard from '../../components/ContactCard';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Section {
  title: string;
  data: SavedCoach[];
}

export default function ContactsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const sectionListRef = useRef<SectionList<SavedCoach>>(null);

  const {
    contacts,
    loading,
    loadContacts,
    removeMultiple,
    getSchools,
  } = useContactsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadContacts();
  }, []);

  const schools = useMemo(() => getSchools(), [contacts]);

  // Filter contacts
  const filtered = useMemo(() => {
    let list = contacts;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.school.toLowerCase().includes(q),
      );
    }

    if (selectedSchool) {
      list = list.filter((c) => c.school === selectedSchool);
    }

    return list;
  }, [contacts, searchQuery, selectedSchool]);

  // Group by first letter
  const sections: Section[] = useMemo(() => {
    const groups: Record<string, SavedCoach[]> = {};

    for (const c of filtered) {
      const letter = c.name.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    }

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        title: letter,
        data: groups[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filtered]);

  // Available section letters for the index
  const availableLetters = useMemo(
    () => new Set(sections.map((s) => s.title)),
    [sections],
  );

  const contactKey = (c: SavedCoach) => `${c.name}|${c.school}`.toLowerCase();

  const toggleSelection = useCallback((coach: SavedCoach) => {
    const key = contactKey(coach);
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleCardPress = useCallback(
    (coach: SavedCoach) => {
      if (editMode) {
        toggleSelection(coach);
      } else {
        // Navigate to coach profile (from contacts)
        const idx = contacts.findIndex(
          (c) => contactKey(c) === contactKey(coach),
        );
        router.push({
          pathname: '/coach-profile',
          params: { index: String(idx), source: 'contacts' },
        });
      }
    },
    [editMode, contacts],
  );

  const handleLongPress = useCallback((coach: SavedCoach) => {
    if (!editMode) {
      setEditMode(true);
      toggleSelection(coach);
    }
  }, [editMode]);

  const handleDeleteSelected = () => {
    const count = selectedIndices.size;
    if (count === 0) return;

    Alert.alert(
      'Delete Contacts',
      `Remove ${count} contact${count > 1 ? 's' : ''} from your saved list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const toDelete = contacts.filter((c) =>
              selectedIndices.has(contactKey(c)),
            );
            removeMultiple(toDelete);
            setSelectedIndices(new Set());
            setEditMode(false);
          },
        },
      ],
    );
  };

  const handleAlphabetPress = (letter: string) => {
    const sectionIndex = sections.findIndex((s) => s.title === letter);
    if (sectionIndex >= 0 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewOffset: 40,
      });
    }
  };

  const handleMessage = (coach: SavedCoach) => {
    Alert.alert(
      'Send Message',
      `Send a message to ${coach.name}?\n\n(Messaging will be available in a future update)`,
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

        {editMode ? (
          <TouchableOpacity onPress={handleDeleteSelected}>
            <Ionicons name="trash-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditMode(true)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>All Contacts</Text>
        <Text style={styles.subtitle}>
          You have {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* School filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedSchool && styles.chipActive]}
          onPress={() => setSelectedSchool(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !selectedSchool && styles.chipTextActive]}>
            All Schools
          </Text>
        </TouchableOpacity>
        {schools.map((school) => (
          <TouchableOpacity
            key={school}
            style={[styles.chip, selectedSchool === school && styles.chipActive]}
            onPress={() =>
              setSelectedSchool(selectedSchool === school ? null : school)
            }
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedSchool === school && styles.chipTextActive,
              ]}
            >
              {school}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contact list with alphabet index */}
      <View style={styles.listArea}>
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptySubtitle}>
              Save coaches from search results to see them here
            </Text>
          </View>
        ) : (
          <>
            <SectionList
              ref={sectionListRef}
              sections={sections}
              keyExtractor={(item, idx) => `${item.name}-${item.school}-${idx}`}
              renderSectionHeader={({ section: { title } }) => (
                <Text style={styles.sectionHeader}>{title}</Text>
              )}
              renderItem={({ item }) => (
                <ContactCard
                  coach={item}
                  selected={selectedIndices.has(contactKey(item))}
                  editMode={editMode}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleLongPress(item)}
                  onMessage={() => handleMessage(item)}
                />
              )}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={false}
              getItemLayout={undefined}
              onScrollToIndexFailed={() => {}}
            />

            {/* Alphabet index sidebar */}
            <View style={styles.alphabetIndex}>
              {ALPHABET.map((letter) => {
                const isAvailable = availableLetters.has(letter);
                return (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => handleAlphabetPress(letter)}
                    disabled={!isAvailable}
                    hitSlop={{ left: 10, right: 10 }}
                  >
                    <Text
                      style={[
                        styles.alphabetLetter,
                        isAvailable && styles.alphabetLetterActive,
                      ]}
                    >
                      {letter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomButtons}>
        {editMode ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setEditMode(false);
              setSelectedIndices(new Set());
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>BACK</Text>
          </TouchableOpacity>
        )}
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
  editText: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  chipScroll: {
    maxHeight: 44,
    marginBottom: 10,
  },
  chipRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.surfaceBackground,
    borderColor: Colors.textSecondary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  listArea: {
    flex: 1,
    flexDirection: 'row',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  alphabetIndex: {
    position: 'absolute',
    right: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 18,
  },
  alphabetLetter: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.border,
    paddingVertical: 1,
    textAlign: 'center',
  },
  alphabetLetterActive: {
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomButtons: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  backButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.background,
    letterSpacing: 2,
  },
  cancelButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
});
