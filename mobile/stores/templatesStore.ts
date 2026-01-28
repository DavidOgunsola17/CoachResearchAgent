import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Template {
  id?: string;
  name: string;
  subject_line: string;
  message_body: string;
  highlight_video_url?: string;
  is_default: boolean;
}

interface TemplatesState {
  templates: Template[];
  loading: boolean;

  loadTemplates: () => Promise<void>;
  saveTemplate: (template: Template) => Promise<void>;
  updateTemplate: (template: Template) => Promise<void>;
  deleteTemplate: (template: Template) => Promise<void>;
  ensureDefaults: () => Promise<void>;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    name: 'Initial Outreach',
    subject_line: 'Interested in {Sport} at {School}',
    message_body:
      'Hi {Coach Name},\n\nI\'m writing to express my interest in the {Sport} program at {School}. I\'ve been following your team\'s progress and I believe my skills would be a great fit for your upcoming season.\n\nI currently maintain a {GPA} GPA and am committed to both athletic and academic excellence. I would love the opportunity to discuss how I could contribute to your program.',
    is_default: true,
  },
  {
    name: 'Follow Up',
    subject_line: 'Following Up - {Sport} Interest',
    message_body:
      'Just checking in to see if you had a chance to review my previous message. I\'m still very interested in the {Sport} program at {School} and would welcome the opportunity to speak with you about joining your team.\n\nThank you for your time, {Coach Name}.',
    is_default: true,
  },
  {
    name: 'Scholarship Inquiry',
    subject_line: 'Scholarship Inquiry - {Sport}',
    message_body:
      'I wanted to ask about available scholarship opportunities for the {Sport} program at {School}. I currently maintain a {GPA} GPA and would love to discuss how I could contribute to your team both on and off the field.\n\nThank you for your consideration, {Coach Name}.',
    is_default: true,
  },
  {
    name: 'Visit Request',
    subject_line: 'Campus Visit Request - {School}',
    message_body:
      'I\'ll be in the area next week and would love the opportunity to visit {School} and meet with the {Sport} coaching staff. Would you be available for a brief meeting?\n\nI\'m very excited about the program and would appreciate any time you could spare, {Coach Name}.',
    is_default: true,
  },
  {
    name: 'Post-Camp Note',
    subject_line: 'Thank You - {School} Camp',
    message_body:
      'Thank you for the opportunity to participate in your camp at {School}. I learned a great deal and am even more excited about the possibility of joining your {Sport} program.\n\nI look forward to staying in touch, {Coach Name}.',
    is_default: true,
  },
];

// Rotating icon colors for template cards
export const TEMPLATE_COLORS = [
  '#4A90D9', // blue
  '#F39C12', // orange
  '#1ABC9C', // teal
  '#E91E63', // pink
  '#9B59B6', // purple
  '#2ECC71', // green
  '#E74C3C', // red
  '#00BCD4', // cyan
];

export function getTemplateColor(index: number): string {
  return TEMPLATE_COLORS[index % TEMPLATE_COLORS.length];
}

// Smart variable definitions
export interface SmartVariable {
  label: string;
  placeholder: string;
  icon: string; // Ionicons name
  color: string;
}

export const SMART_VARIABLES: SmartVariable[] = [
  { label: '{Coach Name}', placeholder: '{Coach Name}', icon: 'person', color: '#D4A017' },
  { label: '{School}', placeholder: '{School}', icon: 'school', color: '#1ABC9C' },
  { label: '{Sport}', placeholder: '{Sport}', icon: 'create', color: '#2ECC71' },
  { label: '{GPA}', placeholder: '{GPA}', icon: 'star', color: '#8B3A3A' },
];

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  loading: false,

  loadTemplates: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('outreach_templates')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Failed to load templates:', error.message);
        set({ loading: false });
        return;
      }

      const templates: Template[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.template_name,
        subject_line: row.subject_line ?? '',
        message_body: row.message_body ?? '',
        highlight_video_url: row.highlight_video_url ?? '',
        is_default: row.is_default ?? false,
      }));

      set({ templates, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveTemplate: async (template) => {
    // Optimistic add
    const existing = get().templates;
    set({ templates: [...existing, template] });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('outreach_templates')
        .insert({
          user_id: session.user.id,
          template_name: template.name,
          subject_line: template.subject_line,
          message_body: template.message_body,
          is_default: template.is_default,
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to save template:', error.message);
        return;
      }

      if (data) {
        set({
          templates: get().templates.map((t) =>
            t.name === template.name && !t.id ? { ...t, id: data.id } : t,
          ),
        });
      }
    } catch {
      // Keep optimistic add
    }
  },

  updateTemplate: async (template) => {
    // Optimistic update
    set({
      templates: get().templates.map((t) =>
        t.id === template.id ? template : t,
      ),
    });

    try {
      if (!template.id) return;

      await supabase
        .from('outreach_templates')
        .update({
          template_name: template.name,
          subject_line: template.subject_line,
          message_body: template.message_body,
        })
        .eq('id', template.id);
    } catch {
      // Optimistic update stands
    }
  },

  deleteTemplate: async (template) => {
    set({
      templates: get().templates.filter((t) => t.id !== template.id),
    });

    try {
      if (!template.id) return;
      await supabase.from('outreach_templates').delete().eq('id', template.id);
    } catch {
      // Optimistic delete stands
    }
  },

  ensureDefaults: async () => {
    const existing = get().templates;
    if (existing.length > 0) return;

    // No templates loaded — seed with defaults
    for (const template of DEFAULT_TEMPLATES) {
      await get().saveTemplate(template);
    }
  },
}));
