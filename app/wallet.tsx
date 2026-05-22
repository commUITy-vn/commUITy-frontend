import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { ConfirmModal, TextInput } from '@/components/ui';

export default function WalletScreen() {
  const theme = useTheme();
  const stylesGlobal = useThemeStyles();
  const router = useRouter();

  // Simulated virtual wallet balance
  const [balance, setBalance] = useState(5000000);
  const [linkedCards, setLinkedCards] = useState([
    { id: '1', type: 'Visa', last4: '4242', holder: 'NGUYEN VAN A', expiry: '12/28', color: '#6366F1' },
    { id: '2', type: 'Mastercard', last4: '8812', holder: 'NGUYEN VAN A', expiry: '06/27', color: '#EC4899' },
  ]);

  const [bankAccounts, setBankAccounts] = useState([
    { id: '1', bankName: 'Vietcombank', number: '102******888', type: 'Checking' },
    { id: '2', bankName: 'Techcombank', number: '190******777', type: 'Savings' },
  ]);

  // Modal States
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [cardNum, setCardNum] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accNum, setAccNum] = useState('');

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('Success');
  const [successMessage, setSuccessMessage] = useState('');

  // Alert Modal States
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const triggerAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const handleAddCard = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCardNum('');
    setCardHolder('');
    setShowAddCardModal(true);
  };

  const submitAddCard = async () => {
    if (!cardNum || cardNum.length < 4) {
      triggerAlert("Invalid Input", "Please enter a valid card number.");
      return;
    }
    const last4 = cardNum.slice(-4);
    const holder = cardHolder || "NGUYEN VAN A";
    const newCard = {
      id: String(Date.now()),
      type: cardNum.startsWith('5') ? 'Mastercard' : 'Visa',
      last4,
      holder: holder.toUpperCase(),
      expiry: '12/30',
      color: ['#10B981', '#F59E0B', '#8B5CF6', '#3B82F6'][Math.floor(Math.random() * 4)],
    };
    setLinkedCards([...linkedCards, newCard]);
    setShowAddCardModal(false);

    setSuccessTitle("Card Added");
    setSuccessMessage(`Card ending in •••• ${last4} linked successfully.`);
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  const handleAddBank = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBankName('');
    setAccNum('');
    setShowAddBankModal(true);
  };

  const submitAddBank = async () => {
    if (!bankName || !accNum) {
      triggerAlert("Invalid Input", "Please enter bank name and account number.");
      return;
    }
    const masked = accNum.slice(0, 3) + '******' + accNum.slice(-3);
    setBankAccounts([...bankAccounts, { id: String(Date.now()), bankName, number: masked, type: 'Checking' }]);
    setShowAddBankModal(false);

    setSuccessTitle("Bank Account Linked");
    setSuccessMessage(`${bankName} account linked successfully.`);
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  const handleTopUp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTopUpAmount('500000');
    setShowTopUpModal(true);
  };

  const submitTopUp = async () => {
    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerAlert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }
    setBalance(prev => prev + amountNum);
    setShowTopUpModal(false);
    setSuccessTitle("Success");
    setSuccessMessage(`Successfully topped up ₫ ${amountNum.toLocaleString()}`);
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  const handleWithdraw = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWithdrawAmount('500000');
    setShowWithdrawModal(true);
  };

  const submitWithdraw = async () => {
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      triggerAlert("Invalid Amount", "Please enter a valid positive amount.");
      return;
    }
    if (balance >= amountNum) {
      setBalance(prev => prev - amountNum);
      setShowWithdrawModal(false);
      setSuccessTitle("Success");
      setSuccessMessage(`Successfully withdrew ₫ ${amountNum.toLocaleString()}`);
    } else {
      setShowWithdrawModal(false);
      setSuccessTitle("Error");
      setSuccessMessage("Insufficient balance to perform withdrawal!");
    }
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 300);
  };

  return (
    <View
      style={[
        stylesGlobal.container,
        {
          backgroundColor: theme.appBG,
          height: (Platform.OS === 'web' ? '100vh' : '100%') as any,
          maxHeight: (Platform.OS === 'web' ? '100vh' : undefined) as any,
        },
      ]}
    >
      {/* Premium Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Wallet</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Modern Glassmorphic Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Virtual Balance</Text>
            <MaterialIcons name="account-balance-wallet" size={24} color="#FFF" />
          </View>
          <Text style={styles.balanceAmount}>
            ₫ {balance.toLocaleString()}
          </Text>
          <View style={styles.balanceActions}>
            <Pressable
              onPress={handleTopUp}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                pressed && { opacity: 0.8 }
              ]}
            >
              <MaterialIcons name="add" size={18} color="#FFF" style={styles.btnIcon} />
              <Text style={styles.actionBtnText}>Top Up</Text>
            </Pressable>
            <Pressable
              onPress={handleWithdraw}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                pressed && { opacity: 0.8 }
              ]}
            >
              <MaterialIcons name="arrow-downward" size={18} color="#FFF" style={styles.btnIcon} />
              <Text style={styles.actionBtnText}>Withdraw</Text>
            </Pressable>
          </View>
        </View>

        {/* Linked Cards Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Linked Cards</Text>
          <Pressable onPress={handleAddCard}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>+ Add Card</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={styles.cardsScroll}
          snapToInterval={292}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {linkedCards.map(card => (
            <View key={card.id} style={[styles.creditCard, { backgroundColor: card.color }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{card.type}</Text>
                <MaterialIcons name="nfc" size={20} color="#FFF" />
              </View>
              <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>{card.holder}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{card.expiry}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bank Accounts Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Bank Accounts</Text>
          <Pressable onPress={handleAddBank}>
            <Text style={{ color: theme.primary, fontWeight: '600' }}>+ Link Bank</Text>
          </Pressable>
        </View>

        <View style={styles.banksList}>
          {bankAccounts.map(bank => (
            <View key={bank.id} style={[styles.bankItem, { backgroundColor: theme.componentBG, borderColor: theme.border }]}>
              <View style={[styles.bankIconContainer, { backgroundColor: theme.highlightBG }]}>
                <MaterialIcons name="account-balance" size={22} color={theme.primary} />
              </View>
              <View style={styles.bankInfo}>
                <Text style={[styles.bankName, { color: theme.text }]}>{bank.bankName}</Text>
                <Text style={[styles.bankSub, { color: theme.textSupporting }]}>{bank.type} • {bank.number}</Text>
              </View>
              <MaterialIcons name="check-circle" size={20} color={theme.success} />
            </View>
          ))}
        </View>

        {/* Quick Operations / Premium Visual Details */}
        <View style={[styles.securityTip, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}>
          <MaterialIcons name="security" size={20} color={theme.success} />
          <Text style={[styles.securityTipText, { color: theme.textSupporting }]}>
            All transactions are securely processed and end-to-end encrypted using industry standards.
          </Text>
        </View>
      </ScrollView>

      {/* ─── CUSTOM PREMIUM MODALS ────────────────────────────────────────── */}

      {/* Add Card Modal */}
      <Modal visible={showAddCardModal} transparent animationType="fade" onRequestClose={() => setShowAddCardModal(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setShowAddCardModal(false)}>
          <Pressable style={[modalStyles.modalContent, { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border }]} onPress={e => e.stopPropagation()}>
            <Text style={[modalStyles.title, { color: theme.text }]}>Link New Card</Text>
            
            <TextInput
              label="Card Number"
              keyboardType="number-pad"
              maxLength={16}
              value={cardNum}
              onChangeText={setCardNum}
            />

            <TextInput
              label="Cardholder Name"
              autoCapitalize="characters"
              value={cardHolder}
              onChangeText={setCardHolder}
            />

            <View style={modalStyles.buttonContainer}>
              <Pressable
                onPress={submitAddCard}
                style={[modalStyles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Link Card</Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowAddCardModal(false)}
                style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}
              >
                <Text style={[modalStyles.buttonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Bank Modal */}
      <Modal visible={showAddBankModal} transparent animationType="fade" onRequestClose={() => setShowAddBankModal(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setShowAddBankModal(false)}>
          <Pressable style={[modalStyles.modalContent, { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border }]} onPress={e => e.stopPropagation()}>
            <Text style={[modalStyles.title, { color: theme.text }]}>Link Bank Account</Text>
            
            <TextInput
              label="Bank Name"
              value={bankName}
              onChangeText={setBankName}
            />

            <TextInput
              label="Account Number"
              keyboardType="number-pad"
              value={accNum}
              onChangeText={setAccNum}
            />

            <View style={modalStyles.buttonContainer}>
              <Pressable
                onPress={submitAddBank}
                style={[modalStyles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Link Account</Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowAddBankModal(false)}
                style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}
              >
                <Text style={[modalStyles.buttonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Top Up Modal */}
      <Modal visible={showTopUpModal} transparent animationType="fade" onRequestClose={() => setShowTopUpModal(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setShowTopUpModal(false)}>
          <Pressable style={[modalStyles.modalContent, { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border }]} onPress={e => e.stopPropagation()}>
            <Text style={[modalStyles.title, { color: theme.text }]}>Top Up Balance</Text>
            
            <TextInput
              label="Top Up Amount (₫)"
              keyboardType="number-pad"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />

            <View style={modalStyles.buttonContainer}>
              <Pressable
                onPress={submitTopUp}
                style={[modalStyles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Confirm</Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowTopUpModal(false)}
                style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}
              >
                <Text style={[modalStyles.buttonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="fade" onRequestClose={() => setShowWithdrawModal(false)}>
        <Pressable style={modalStyles.overlay} onPress={() => setShowWithdrawModal(false)}>
          <Pressable style={[modalStyles.modalContent, { backgroundColor: theme.componentBG || theme.appBG, borderColor: theme.border }]} onPress={e => e.stopPropagation()}>
            <Text style={[modalStyles.title, { color: theme.text }]}>Withdraw Funds</Text>
            
            <TextInput
              label="Withdraw Amount (₫)"
              keyboardType="number-pad"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <View style={modalStyles.buttonContainer}>
              <Pressable
                onPress={submitWithdraw}
                style={[modalStyles.button, { backgroundColor: theme.primary }]}
              >
                <Text style={[modalStyles.buttonText, { color: '#fff' }]}>Confirm</Text>
              </Pressable>
              
              <Pressable
                onPress={() => setShowWithdrawModal(false)}
                style={[modalStyles.button, modalStyles.cancelButton, { backgroundColor: theme.highlightBG, borderColor: theme.border }]}
              >
                <Text style={[modalStyles.buttonText, { color: theme.text }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={showSuccessModal}
        title={successTitle}
        message={successMessage}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setShowSuccessModal(false)}
        onCancel={() => setShowSuccessModal(false)}
      />

      <ConfirmModal
        visible={showAlertModal}
        title={alertTitle}
        message={alertMessage}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setShowAlertModal(false)}
        onCancel={() => setShowAlertModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnIcon: {
    marginRight: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardsScroll: {
    gap: 12,
    paddingRight: 16,
  },
  creditCard: {
    width: 280,
    height: 168,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  cardNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 8,
    fontWeight: '600',
  },
  cardValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  banksList: {
    gap: 10,
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
  },
  bankSub: {
    fontSize: 12,
    marginTop: 2,
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 10,
  },
  securityTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  button: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
