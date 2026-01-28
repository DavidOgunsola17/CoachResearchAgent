import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import {
  useTemplatesStore,
  Template,
  SMART_VARIABLES,
} from '../stores/templatesStore';

export default function TemplateEditorScreen() {
  const router = useRouter();
  const { index: indexParam } = useLocalSearchParams<{ index: string }>();
  const { templates, saveTemplate, updateTemplate } = useTemplatesStore();

  const templateIndex = parseInt(indexParam ?? '-1', 10);
  const isEditing = templateIndex >= 0 && templateIndex < templates.length;
  const existingTemplate = isEditing ? templates[templateIndex] : null;

  const [name, setName] = useState(existingTemplate?.name ?? '');
  const [subjectLine, setSubjectLine] = useState(existingTemplate?.subject_line ?? '');
  const [messageBody, setMessageBody] = useState(existingTemplate?.message_body ?? '');
  const [highlightUrl, setHighlightUrl] = useState(existingTemplate?.highlight_video_url ?? '');

  // Track cursor position for inserting smart variables
  const [cursorPosition, setCursorPosition] = useState(0);
  const bodyInputRef = useRef<TextInput>(null);

  const handleSelectionChange = (
    e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => {
    setCursorPosition(e.nativeEvent.selection.start);
  };

  const insertVariable = (placeholder: string) => {
    const before = messageBody.substring(0, cursorPosition);
    const after = messageBody.substring(cursorPosition);
    const newText = before + placeholder + after;
    setMessageBody(newText);
    const newPosition = cursorPosition + placeholder.length;
    setCursorPosition(newPosition);
    // Re-focus the body input
    bodyInputRef.current?.focus();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a template name.');
      return;
    }
    if (!messageBody.trim()) {
      Alert.alert('Missing Content', 'Please enter a message body.');
      return;
    }

    const template: Template = {
      id: existingTemplate?.id,
      name: name.trim(),
      subject_line: subjectLine.trim(),
      message_body: messageBody.trim(),
      highlight_video_url: highlightUrl.trim() || undefined,
      is_default: existingTemplate?.is_default ?? false,
    };

    if (isEditing) {
      await updateTemplate(template);
    } else {
      await saveTemplate(template);
    }

    router.back();
  };

  // Determine if the body includes a highlight video placeholder
  const hasHighlight = messageBody.includes('{HIGHLIGHTS}') || !!highlightUrl;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.headerLogo}>SKOUT</Text>

        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template Name */}
        <Text style={styles.fieldLabel}>Template Name</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter template name"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Subject Line (added per user request — not in mockup) */}
        <Text style={styles.fieldLabel}>Subject Line</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={subjectLine}
            onChangeText={setSubjectLine}
            placeholder="Enter email subject line"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Message Content */}
        <Text style={styles.fieldLabel}>Message Content</Text>
        <View style={styles.bodyContainer}>
          <TextInput
            ref={bodyInputRef}
            style={styles.bodyInput}
            value={messageBody}
            onChangeText={setMessageBody}
            onSelectionChange={handleSelectionChange}
            placeholder="Tap to start typing..."
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          {/* Highlight Video Thumbnail */}
          {hasHighlight && (
            <View style={styles.highlightThumb}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={28} color={Colors.textPrimary} />
              </View>
              <View style={styles.highlightLabel}>
                <Text style={styles.highlightLabelText}>{'{HIGHLIGHTS}'}</Text>
              </View>
            </View>
          )}

          <Text style={styles.bodyHint}>Tap to continue typing...</Text>
        </View>

        {/* Highlight Video URL */}
        <Text style={styles.fieldLabel}>Highlight Video Link (optional)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={highlightUrl}
            onChangeText={setHighlightUrl}
            placeholder="Paste video URL"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Smart Variables */}
        <View style={styles.smartVarHeader}>
          <View style={styles.smartVarTitleRow}>
            <Ionicons name="flash" size={18} color="#F39C12" />
            <Text style={styles.smartVarTitle}>Smart Variables</Text>
          </View>
          <Text style={styles.smartVarHint}>Tap to insert</Text>
        </View>

        <View style={styles.chipGrid}>
          {SMART_VARIABLES.map((v) => (
            <TouchableOpacity
              key={v.placeholder}
              style={[styles.variableChip, { backgroundColor: `${v.color}18` }]}
              onPress={() => insertVariable(v.placeholder)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={v.icon as any}
                size={16}
                color={v.color}
              />
              <Text style={[styles.chipText, { color: v.color }]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.error,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 20,
  },
  inputContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  textInput: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  bodyContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    minHeight: 220,
  },
  bodyInput: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 120,
  },
  bodyHint: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 12,
  },
  highlightThumb: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    height: 140,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  highlightLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  smartVarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 14,
  },
  smartVarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smartVarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  smartVarHint: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  variableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
