import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useAuthStore } from '../stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import TextInput from '@/components/ui/TextInput';
import { FormContainer } from '@/components/ui/FormContainer';
import { Divider } from '@/components/ui/Divider';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

type LoginFormProps = {
    onNavigateToRegister: () => void;
};

export const LoginForm: React.FC<LoginFormProps> = ({ onNavigateToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [isLinkPressed, setIsLinkPressed] = useState(false);

    const { login, isLoading, error, clearError } = useAuthStore();
    const theme = useTheme();
    const styles = useThemeStyles();

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        clearError();
        setErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            await login({ email: email.trim(), password });
        } catch {
            // Error is already set in the store
        }
    };

    const handleSocialLogin = (_provider: string) => {
        // TODO: Implement OAuth flow
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

                    {/* Email Input - full width */}
                    <View style={styles.fullWidth}>
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

                    {/* General Error Message */}
                    {error ? <Text style={[styles.errorText, styles.mt2]}>{error}</Text> : null}

                    {/* Login Button - full width */}
                    <View style={[styles.mt5, styles.fullWidth]}>
                        <Button text="Log in" onPress={handleLogin} isLoading={isLoading} primary size="large" style={styles.fullWidth} />
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

                    {/* Register Link */}
                    <View style={[styles.mt5, styles.alignItemsCenter]}>
                        <Text style={{ color: theme.textSupporting }}>
                            {"Don't have an account? "}
                            <Text
                                style={{ color: isLinkPressed ? theme.linkHover : theme.link, textDecorationLine: 'underline' }}
                                onPress={onNavigateToRegister}
                                onPressIn={() => setIsLinkPressed(true)}
                                onPressOut={() => setIsLinkPressed(false)}
                            >
                                Sign up
                            </Text>
                        </Text>
                    </View>
                </FormContainer>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};