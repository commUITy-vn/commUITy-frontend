import React from 'react';
import {View, type ViewStyle, type StyleProp} from 'react-native';
import {useThemeStyles} from '@/hooks/useThemeStyles';
import {useTheme} from '@/hooks/useTheme';

type FormContainerProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export const FormContainer: React.FC<FormContainerProps> = ({children, style}) => {
    const styles = useThemeStyles();
    const theme = useTheme();

    return (
        <View
            style={[
                styles.flex1,
                {
                    backgroundColor: theme.appBG,
                    paddingHorizontal: 20,
                    paddingVertical: 24,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};
