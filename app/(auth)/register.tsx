import {RegisterForm} from '@/features/auth/components/RegisterForm';
import {router} from 'expo-router';
import {useTheme} from '@/hooks/useTheme';
import {View, type ViewStyle} from 'react-native';

export default function RegisterScreen() {
    const theme = useTheme();

    const handleNavigateToLogin = () => {
        router.push('/(auth)/login');
    };

    return (
        <View style={{flex: 1, backgroundColor: theme.appBG} as ViewStyle}>
            <RegisterForm onNavigateToLogin={handleNavigateToLogin} />
        </View>
    );
}
