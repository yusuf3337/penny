import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface UserNameModalProps {
  visible: boolean;
  onSave: (name: string) => void;
}

export const UserNameModal: React.FC<UserNameModalProps> = ({ visible, onSave }) => {
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!nameInput.trim()) {
      setError('Lütfen bir isim giriniz.');
      return;
    }
    setError('');
    onSave(nameInput.trim());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-outline" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Penny'ye Hoş Geldin</Text>
          <Text style={styles.subtitle}>
            Sana hitap edebilmemiz ve kişisel finans asistanını hazırlamamız için lütfen ismini gir.
          </Text>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="İsminiz (örn: Deniz)"
            placeholderTextColor={COLORS.mutedText}
            value={nameInput}
            onChangeText={(text) => {
              setNameInput(text);
              if (error) setError('');
            }}
            autoFocus
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Başlayalım</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.mutedText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: 20,
  },
  inputError: {
    borderColor: COLORS.expense,
  },
  errorText: {
    color: COLORS.expense,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
