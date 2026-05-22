import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';
import { FormContainer } from '@/components/ui/FormContainer';
import { Divider } from '@/components/ui/Divider';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { UserRole } from '../types';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

type RegisterFormProps = {
    onNavigateToLogin: () => void;
};

const roleOptions = [
    { label: 'Volunteer', value: UserRole.VOLUNTEER },
    { label: 'Requester', value: UserRole.REQUESTER },
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onNavigateToLogin }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.VOLUNTEER);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLinkPressed, setIsLinkPressed] = useState(false);

    const [errors, setErrors] = useState<{
        fullName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
        phone?: string;
    }>({});

    const { register: registerUser, isLoading, error, clearError } = useAuthStore();
    const theme = useTheme();
    const styles = useThemeStyles();

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (phone && !/^\d{10,15}$/.test(phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        clearError();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            await registerUser({
                fullName: fullName.trim(),
                email: email.trim(),
                password,
                phone: phone.trim() || undefined,
                role,
            });
            onNavigateToLogin();
        } catch {
            // Error is already set in the store
        }
    };

    const handleSocialLogin = (provider: string) => {
        // TODO: Implement OAuth flow
        console.log(`Register with ${provider}`);
    };

    return (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.flex1} keyboardShouldPersistTaps="handled">
                <FormContainer style={[styles.flex1, {justifyContent: 'center', alignItems: 'stretch'}]}>
                    {/* App Name */}
                    <View style={[styles.mb2, {alignSelf: 'center'}]}>
                        <Text style={{ fontSize: 32, fontWeight: 'bold', color: theme.primary, textAlign: 'center', alignSelf: 'center' }}>commUITy</Text>
                    </View>

                    {/* Tagline */}
                    <View style={[styles.mb1, {alignSelf: 'center'}]}>
                        <Text style={{ fontSize: 16, color: theme.text, textAlign: 'center', alignSelf: 'center' }}>Kết nối cộng đồng, sẻ chia yêu thương.</Text>
                    </View>

                    {/* Subtext */}
                    <View style={[styles.mb5, {alignSelf: 'center'}]}>
                        <Text style={{ fontSize: 14, color: theme.textSupporting, textAlign: 'center', alignSelf: 'center' }}>Get started below.</Text>
                    </View>

                    {/* Full Name Input - full width */}
                    <View style={styles.fullWidth}>
                        <TextInput
                            label="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            errorText={errors.fullName}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Email Input - full width */}
                    <View style={[styles.mt4, styles.fullWidth]}>
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            errorText={errors.email}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Phone Input - full width */}
                    <View style={[styles.mt4, styles.fullWidth]}>
                        <TextInput
                            label="Phone (Optional)"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            errorText={errors.phone}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Role Selection */}
                    <View style={[styles.mb4, styles.fullWidth]}>
                        <Text style={[styles.label, styles.mb2]}>Role</Text>
                        <View style={[styles.flexRow, styles.gap2]}>
                            {roleOptions.map((option) => (
                                <Button
                                    key={option.value}
                                    text={option.label}
                                    onPress={() => setRole(option.value)}
                                    isDisabled={isLoading}
                                    primary={role === option.value}
                                    size="small"
                                    style={[styles.flex1]}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Password Input - full width */}
                    <View style={[styles.mt4, styles.fullWidth]}>
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            errorText={errors.password}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Confirm Password Input - full width */}
                    <View style={[styles.mt4, styles.fullWidth]}>
                        <TextInput
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            errorText={errors.confirmPassword}
                            editable={!isLoading}
                        />
                    </View>

                    {/* General Error Message */}
                    {error ? <Text style={[styles.errorText, styles.mb3]}>{error}</Text> : null}

                    {/* Register Button - full width */}
                    <View style={[styles.mt5, styles.fullWidth]}>
                        <Button text="Create Account" onPress={handleRegister} isLoading={isLoading} primary size="large" style={styles.fullWidth} />
                    </View>

                    {/* Divider */}
                    <View style={[styles.mt5, styles.fullWidth]}>
                        <Divider text="OR" />
                    </View>

                    {/* Social Login Buttons with Icons */}
                    <View style={[styles.mt2, styles.fullWidth, { gap: 12 }]}>
                        {/* Google Button */}
                        <Pressable
                            onPress={() => handleSocialLogin('google')}
                            style={({ pressed }) => [
                                styles.socialButton,
                                pressed && { backgroundColor: theme.highlightBG },
                            ]}
                        >
                            <FontAwesome5 name="google" size={20} color="#4285F4" style={styles.socialIcon} />
                            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>Continue with Google</Text>
                        </Pressable>

                        {/* Apple Button */}
                        <Pressable
                            onPress={() => handleSocialLogin('apple')}
                            style={({ pressed }) => [
                                styles.socialButton,
                                pressed && { backgroundColor: theme.highlightBG },
                            ]}
                        >
                            <FontAwesome5 name="apple" size={20} color={theme.text} style={styles.socialIcon} />
                            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>Continue with Apple</Text>
                        </Pressable>
                    </View>

                    {/* Login Link */}
                    <View style={[styles.mt5, styles.alignItemsCenter]}>
                        <Text style={{ color: theme.textSupporting }}>
                            Already have an account?{' '}
                            <Text
                                style={{ color: isLinkPressed ? theme.linkHover : theme.link, textDecorationLine: 'underline' }}
                                onPress={onNavigateToLogin}
                                onPressIn={() => setIsLinkPressed(true)}
                                onPressOut={() => setIsLinkPressed(false)}
                            >
                                Sign in
                            </Text>
                        </Text>
                    </View>
                </FormContainer>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
