import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { PremiumGate } from '@/components/PremiumGate';
import { PencilIcon, TrashIcon, PlusIcon } from 'react-native-heroicons/outline';

interface HymnNotesProps {
  hymnId: number;
  hymnTitle: string;
}

const ANNOTATIONS_KEY = '@hymn_annotations';

export const HymnNotes: React.FC<HymnNotesProps> = ({ hymnId, hymnTitle }) => {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNote();
  }, [hymnId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(ANNOTATIONS_KEY);
      const annotations = stored ? JSON.parse(stored) : {};
      const hymnNote = annotations[hymnId];
      if (hymnNote) {
        setSavedNote(hymnNote.note);
        setNote(hymnNote.note);
      } else {
        setSavedNote(null);
        setNote('');
      }
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Hymn annotations are a premium feature. Upgrade to add personal notes to hymns.');
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(ANNOTATIONS_KEY);
      const annotations = stored ? JSON.parse(stored) : {};
      
      const now = new Date().toISOString();
      annotations[hymnId] = {
        hymnId,
        note: note.trim(),
        createdAt: annotations[hymnId]?.createdAt || now,
        updatedAt: now,
      };

      await AsyncStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
      setSavedNote(note.trim());
      setIsEditing(false);
      setShowModal(false);
      Alert.alert('Success', 'Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    }
  };

  const deleteNote = async () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const stored = await AsyncStorage.getItem(ANNOTATIONS_KEY);
              const annotations = stored ? JSON.parse(stored) : {};
              delete annotations[hymnId];
              await AsyncStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
              setSavedNote(null);
              setNote('');
              setIsEditing(false);
              setShowModal(false);
              Alert.alert('Success', 'Note deleted successfully!');
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openEditor = () => {
    if (!isPremium) {
      return;
    }
    setIsEditing(true);
    setShowModal(true);
  };

  if (loading) {
    return null;
  }

  return (
    <PremiumGate featureName="Hymn Annotations">
      <View style={[styles.container, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            My Notes
          </Text>
          {isPremium && (
            <TouchableOpacity onPress={openEditor}>
              {savedNote ? (
                <PencilIcon size={20} color={theme.colors.textSecondary} />
              ) : (
                <PlusIcon size={20} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {savedNote ? (
          <View>
            <Text style={[styles.noteText, { color: theme.colors.text }]} numberOfLines={3}>
              {savedNote}
            </Text>
            {isPremium && (
              <TouchableOpacity
                onPress={() => {
                  setNote(savedNote);
                  setIsEditing(true);
                  setShowModal(true);
                }}
                style={styles.editButton}
              >
                <Text style={[styles.editButtonText, { color: theme.colors.textSecondary }]}>
                  Edit Note
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            onPress={openEditor}
            style={styles.addButton}
          >
            <Text style={[styles.addButtonText, { color: theme.colors.textSecondary }]}>
              + Add a personal note
            </Text>
          </TouchableOpacity>
        )}

        {/* Edit/Add Note Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowModal(false);
            setIsEditing(false);
            setNote(savedNote || '');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {savedNote ? 'Edit Note' : 'Add Note'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setNote(savedNote || '');
                  }}
                >
                  <Text style={[styles.modalClose, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                {hymnTitle}
              </Text>

              <ScrollView style={styles.textInputContainer}>
                <TextInput
                  style={[styles.textInput, { 
                    color: theme.colors.text,
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border
                  }]}
                  placeholder="Write your personal notes about this hymn..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={styles.modalActions}>
                {savedNote && (
                  <TouchableOpacity
                    onPress={deleteNote}
                    style={[styles.deleteButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  >
                    <TrashIcon size={18} color="#ef4444" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={saveNote}
                  style={[styles.saveButton, { backgroundColor: theme.colors.text }]}
                  disabled={!note.trim()}
                >
                  <Text style={[styles.saveButtonText, { opacity: note.trim() ? 1 : 0.5 }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </PremiumGate>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  editButton: {
    marginTop: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  textInputContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  textInput: {
    minHeight: 150,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

