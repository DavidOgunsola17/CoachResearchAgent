import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface SavedCoach {
  id?: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  twitter: string;
  school: string;
  sport: string;
  school_logo_url: string;
  contacted?: boolean;
}

interface ContactsState {
  contacts: SavedCoach[];
  loading: boolean;

  loadContacts: () => Promise<void>;
  saveContact: (coach: SavedCoach) => Promise<void>;
  removeContact: (coach: SavedCoach) => Promise<void>;
  removeMultiple: (coaches: SavedCoach[]) => Promise<void>;
  isContactSaved: (name: string, school: string) => boolean;
  getSchools: () => string[];
}

function contactKey(name: string, school: string): string {
  return `${name}|${school}`.toLowerCase();
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,

  loadContacts: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', session.user.id)
        .order('full_name', { ascending: true });

      if (error) {
        console.warn('Failed to load contacts:', error.message);
        set({ loading: false });
        return;
      }

      const contacts: SavedCoach[] = (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.full_name,
        position: row.position ?? '',
        email: row.email ?? '',
        phone: row.phone ?? '',
        twitter: row.twitter_handle ?? '',
        school: row.university_name ?? '',
        sport: row.sport ?? '',
        school_logo_url: row.school_logo_url ?? '',
        contacted: row.contacted ?? false,
      }));

      set({ contacts, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveContact: async (coach) => {
    // Optimistic update
    const existing = get().contacts;
    if (get().isContactSaved(coach.name, coach.school)) return;

    set({ contacts: [...existing, coach] });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('coaches')
        .insert({
          user_id: session.user.id,
          full_name: coach.name,
          position: coach.position,
          email: coach.email,
          phone: coach.phone,
          twitter_handle: coach.twitter,
          university_name: coach.school,
          sport: coach.sport,
          school_logo_url: coach.school_logo_url,
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to save contact:', error.message);
        return;
      }

      // Update with server-generated ID
      if (data) {
        set({
          contacts: get().contacts.map((c) =>
            contactKey(c.name, c.school) === contactKey(coach.name, coach.school)
              ? { ...c, id: data.id }
              : c,
          ),
        });
      }
    } catch {
      // Keep optimistic update
    }
  },

  removeContact: async (coach) => {
    // Optimistic removal
    set({
      contacts: get().contacts.filter(
        (c) => contactKey(c.name, c.school) !== contactKey(coach.name, coach.school),
      ),
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (coach.id) {
        await supabase.from('coaches').delete().eq('id', coach.id);
      } else {
        await supabase
          .from('coaches')
          .delete()
          .eq('user_id', session.user.id)
          .eq('full_name', coach.name)
          .eq('university_name', coach.school);
      }
    } catch {
      // Optimistic removal stands
    }
  },

  removeMultiple: async (coaches) => {
    const keys = new Set(coaches.map((c) => contactKey(c.name, c.school)));
    set({
      contacts: get().contacts.filter(
        (c) => !keys.has(contactKey(c.name, c.school)),
      ),
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ids = coaches.map((c) => c.id).filter(Boolean);
      if (ids.length > 0) {
        await supabase.from('coaches').delete().in('id', ids);
      }
    } catch {
      // Optimistic removal stands
    }
  },

  isContactSaved: (name, school) => {
    const key = contactKey(name, school);
    return get().contacts.some(
      (c) => contactKey(c.name, c.school) === key,
    );
  },

  getSchools: () => {
    const schools = new Set(get().contacts.map((c) => c.school).filter(Boolean));
    return Array.from(schools).sort();
  },
}));
