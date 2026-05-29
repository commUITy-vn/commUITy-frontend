import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { TextInput } from '@/components/ui';

interface ApplyCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export default function ApplyCollaboratorModal({ isOpen, onClose, onSubmit }: ApplyCollaboratorModalProps) {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
  };

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={localStyles.modalOverlay}>
        <View style={[localStyles.modalContainer, { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[styles.title, { color: theme.text, fontSize: 20, marginBottom: 16, textAlign: 'center', fontWeight: '700' }]}>Apply as Collaborator</Text>
          
          <TextInput
            label="Reason for applying"
            multiline
            height={100}
            value={reason}
            onChangeText={setReason}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity onPress={handleSubmit} style={[styles.button, { backgroundColor: theme.primary, flex: 1, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={[styles.buttonText, { color: theme.textLight || '#fff', fontWeight: '600' }]}>Submit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: theme.highlightBG, borderColor: theme.border, borderWidth: 1, flex: 1, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={[styles.buttonText, { color: theme.text, fontWeight: '600' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

