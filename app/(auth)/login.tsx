import {LoginForm} from '@/features/auth/components/LoginForm';
import {router} from 'expo-router';
import {useTheme} from '@/hooks/useTheme';
import {View, type ViewStyle} from 'react-native';

export default function LoginScreen() {
    const theme = useTheme();
    const handleNavigateToRegister = () => {
        router.push('/(auth)/register');
    };

    return (
        <View style={{flex: 1, backgroundColor: theme.appBG} as ViewStyle}>
            <LoginForm onNavigateToRegister={handleNavigateToRegister} />
        </View>
    );
}
