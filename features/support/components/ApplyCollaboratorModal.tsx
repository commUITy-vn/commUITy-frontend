import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';

interface ApplyCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function ApplyCollaboratorModal({ isOpen, onClose, onSubmit }: ApplyCollaboratorModalProps) {
  const { theme } = useTheme();
  const styles = useThemeStyles();
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: theme.inverseTransparent }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.componentBG, padding: 16, borderRadius: 12, margin: 24 }]}>
          <Text style={[styles.title, { color: theme.text }]}>Apply as Collaborator</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.componentBG, color: theme.text, marginTop: 12, height: 100, textAlignVertical: 'top' }]}
            placeholder="Why do you want to be a collaborator?"
            placeholderTextColor={theme.textSupporting}
            multiline
            value={reason}
            onChangeText={setReason}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: theme.borderLighter, marginRight: 8 }]}>
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, { backgroundColor: theme.primary }]}>
              <Text style={[styles.buttonText, { color: theme.textLight }]}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
