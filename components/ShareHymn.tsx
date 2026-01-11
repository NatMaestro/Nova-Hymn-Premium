import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { usePremium } from '@/contexts/PremiumContext';
import { PremiumGate } from '@/components/PremiumGate';
import { Hymn } from '@/types';
import {
  ShareIcon,
  DocumentTextIcon,
  LinkIcon,
  XMarkIcon,
} from 'react-native-heroicons/outline';

interface ShareHymnProps {
  hymn: Hymn;
  onClose: () => void;
}

export const ShareHymn: React.FC<ShareHymnProps> = ({ hymn, onClose }) => {
  const { theme } = useTheme();
  const { isPremium } = usePremium();
  const [sharing, setSharing] = useState(false);

  const formatHymnText = (): string => {
    let text = `${hymn.title}\n`;
    text += `Hymn #${hymn.number}\n`;
    text += `Author: ${hymn.author || 'Unknown'}\n`;
    text += `Category: ${hymn.category || 'N/A'}\n`;
    text += `Language: ${hymn.language || 'N/A'}\n\n`;
    text += '---\n\n';

    if (hymn.verses && hymn.verses.length > 0) {
      hymn.verses.forEach((verse) => {
        text += `${verse.is_chorus ? 'Chorus' : `Verse ${verse.verse_number}`}\n`;
        text += `${verse.text}\n\n`;
      });
    }

    if (hymn.scriptureReferences && hymn.scriptureReferences.length > 0) {
      text += '\n---\n\n';
      text += 'Scripture References:\n';
      hymn.scriptureReferences.forEach((ref) => {
        text += `• ${ref}\n`;
      });
    }

    if (hymn.history) {
      text += '\n---\n\n';
      text += 'History:\n';
      text += `${hymn.history}\n`;
    }

    text += '\n---\n\n';
    text += 'Shared from Nova Hymnal Premium\n';
    text += 'https://novahymnal.com';

    return text;
  };

  const handleShareText = async () => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Sharing hymns is a premium feature.');
      return;
    }

    try {
      setSharing(true);
      const text = formatHymnText();
      const result = await Share.share({
        message: text,
        title: hymn.title,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Hymn shared successfully!');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share hymn. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleShareLink = async () => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Sharing hymns is a premium feature.');
      return;
    }

    try {
      setSharing(true);
      const link = `https://novahymnal.com/hymn/${hymn.id}`;
      const message = `Check out "${hymn.title}" (Hymn #${hymn.number}) on Nova Hymnal Premium:\n${link}`;

      const result = await Share.share({
        message,
        title: hymn.title,
        url: link,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Link shared successfully!');
      }
    } catch (error: any) {
      console.error('Error sharing link:', error);
      Alert.alert('Error', 'Failed to share link. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleExportAsFile = async () => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Exporting hymns is a premium feature.');
      return;
    }

    try {
      setSharing(true);
      const text = formatHymnText();
      
      // For file export, we'll use Share API with the text content
      // On iOS/Android, this will allow saving to files app
      const result = await Share.share({
        message: text,
        title: `${hymn.title}.txt`,
      }, {
        dialogTitle: `Export ${hymn.title}`,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Hymn exported successfully!');
      }
    } catch (error: any) {
      console.error('Error exporting file:', error);
      Alert.alert('Error', 'Failed to export hymn. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!isPremium) {
      Alert.alert('Premium Required', 'Copying hymns is a premium feature.');
      return;
    }

    try {
      // Note: For clipboard, we'd need @react-native-clipboard/clipboard
      // For now, we'll use Share as a workaround
      const text = formatHymnText();
      await Share.share({
        message: text,
        title: 'Copy Hymn',
      });
    } catch (error: any) {
      console.error('Error copying:', error);
      Alert.alert('Error', 'Failed to copy hymn. Please try again.');
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <PremiumGate featureName="Export & Share">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Share Hymn
              </Text>
              <TouchableOpacity onPress={onClose}>
                <XMarkIcon size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.hymnTitle, { color: theme.colors.textSecondary }]}>
              {hymn.title} (#{hymn.number})
            </Text>

            {sharing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.textSecondary} />
                <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                  Sharing...
                </Text>
              </View>
            )}

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                onPress={handleShareText}
                disabled={sharing}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: sharing ? 0.6 : 1,
                  },
                ]}
              >
                <ShareIcon size={24} color={theme.colors.textSecondary} />
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                    Share as Text
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Share hymn lyrics via messaging apps
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareLink}
                disabled={sharing}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: sharing ? 0.6 : 1,
                  },
                ]}
              >
                <LinkIcon size={24} color={theme.colors.textSecondary} />
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                    Share Link
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Share a link to this hymn
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExportAsFile}
                disabled={sharing}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: theme.colors.card,
                    borderColor: theme.colors.border,
                    opacity: sharing ? 0.6 : 1,
                  },
                ]}
              >
                <DocumentTextIcon size={24} color={theme.colors.textSecondary} />
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                    Export as File
                  </Text>
                  <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                    Save hymn as a text file
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </PremiumGate>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  hymnTitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
});

