import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCreateReport } from '../hooks/useCreateReport';
import { ReportTargetType } from '../types/reports.types';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  onSuccessSubmit?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
  onSuccessSubmit,
}) => {
  const theme = useTheme();
  const styles = useThemeStyles();
  const [reason, setReason] = useState('');
  const [errorText, setErrorText] = useState('');
  
  const createReportMutation = useCreateReport();

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReason('');
    setErrorText('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setErrorText('Please enter a reason for reporting');
      return;
    }

    if (reason.trim().length > 1000) {
      setErrorText('Reason must not exceed 1000 characters');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await createReportMutation.mutateAsync({
        targetType,
        targetId,
        reason: reason.trim(),
      });
      setReason('');
      setErrorText('');
      onClose();
      if (onSuccessSubmit) {
        onSuccessSubmit();
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to submit report. Please try again.');
    }
  };

  const getTargetTypeLabel = (type: ReportTargetType) => {
    switch (type) {
      case ReportTargetType.SUPPORT_REQUEST:
        return 'Help Request';
      case ReportTargetType.POST:
        return 'Community Post';
      case ReportTargetType.USER:
        return 'User Profile';
      default:
        return 'Item';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={localStyles.overlay} onPress={handleClose}>
          <Pressable
            style={[
              localStyles.modalContent,
              { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[localStyles.header, { borderBottomColor: theme.border }]}>
              <Text style={[localStyles.title, { color: theme.text }]}>Submit Report</Text>
              <Pressable onPress={handleClose} style={localStyles.closeBtn}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </Pressable>
            </View>

            {/* Target info */}
            <View style={[localStyles.targetInfo, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
              <MaterialIcons name="warning" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary, textTransform: 'uppercase' }}>
                  Reporting {getTargetTypeLabel(targetType)}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 2 }} numberOfLines={1}>
                  {targetName}
                </Text>
              </View>
            </View>

            <Text style={[localStyles.description, { color: theme.textSupporting }]}>
              Please describe why you are reporting this content. Our moderation team will review this report as soon as possible.
            </Text>

            {/* Reason Input */}
            <TextInput
              label="Reason for reporting"
              value={reason}
              onChangeText={(text) => {
                setReason(text);
                if (text.trim()) setErrorText('');
              }}
              errorText={errorText}
              multiline
              numberOfLines={4}
              height={120}
              style={{ textAlignVertical: 'top', paddingTop: 16 }}
            />

            {/* Action Buttons */}
            <View style={localStyles.buttonContainer}>
              <Button
                text={createReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                onPress={handleSubmit}
                primary
                isDisabled={!reason.trim() || createReportMutation.isPending}
                isLoading={createReportMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
