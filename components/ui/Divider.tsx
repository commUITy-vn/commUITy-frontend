import React from 'react';
import {View, Text} from 'react-native';
import {useThemeStyles} from '@/hooks/useThemeStyles';
import {useTheme} from '@/hooks/useTheme';

type DividerProps = {
    text?: string;
};

export const Divider: React.FC<DividerProps> = ({text = 'OR'}) => {
    const styles = useThemeStyles();
    const theme = useTheme();

    return (
        <View style={[styles.flexRow, styles.alignItemsCenter, styles.my3]}>
            <View style={[styles.flex1, {height: 1, backgroundColor: theme.border}]} />
            <Text style={[styles.textSupporting, styles.ph3, styles.fz14]}>{text}</Text>
            <View style={[styles.flex1, {height: 1, backgroundColor: theme.border}]} />
        </View>
    );
};
