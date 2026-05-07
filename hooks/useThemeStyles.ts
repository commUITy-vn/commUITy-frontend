import {useMemo} from 'react';
import {StyleSheet} from 'react-native';
import {useTheme} from './useTheme';

export function useThemeStyles() {
    const theme = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                // Button styles (Expensify-aligned)
                button: {
                    borderRadius: 100,
                    minHeight: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    backgroundColor: theme.buttonDefaultBG,
                },
                buttonSuccess: {
                    backgroundColor: theme.success,
                },
                buttonDanger: {
                    backgroundColor: theme.danger,
                },
                buttonContent: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                // Text styles
                buttonText: {
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    lineHeight: 24,
                },
                buttonTextSmall: {
                    fontSize: 14,
                },
                buttonTextMedium: {
                    fontSize: 16,
                },
                buttonTextLarge: {
                    fontSize: 18,
                },
                // Input styles
                input: {
                    flex: 1,
                    fontFamily: 'System',
                    fontSize: 16,
                    lineHeight: 24,
                    paddingTop: 16,
                    paddingBottom: 10,
                    paddingLeft: 8,
                    paddingRight: 8,
                    color: theme.text,
                },
                inputContainer: {
                    borderRadius: 8,
                    borderWidth: 1,
                    padding: 8,
                    paddingBottom: 0,
                    position: 'relative',
                    minHeight: 40,
                },
                inputLabelContainer: {
                    position: 'absolute',
                    left: 8,
                    top: 0,
                    zIndex: 1,
                    paddingHorizontal: 4,
                    paddingBottom: 1,
                    transformOrigin: 'left center',
                },
                inputLabel: {
                    fontSize: 16,
                    fontFamily: 'System',
                    lineHeight: 24,
                },
                // Text styles
                textPrimary: {
                    color: theme.text,
                },
                textSecondary: {
                    color: theme.textSupporting,
                },
                textSupporting: {
                    color: theme.textSupporting,
                },
                textLight: {
                    color: theme.textLight,
                },
                textDanger: {
                    color: theme.danger,
                },
                fz14: {
                    fontSize: 14,
                },
                // Background styles
                appBG: {
                    backgroundColor: theme.appBG,
                },
                componentBG: {
                    backgroundColor: theme.componentBG,
                },
                highlightBG: {
                    backgroundColor: theme.highlightBG,
                },
                // Border styles
                border: {
                    borderColor: theme.border,
                },
                rounded: {
                    borderRadius: 8,
                },
                // Flex styles
                flexRow: {
                    flexDirection: 'row',
                },
                flexColumn: {
                    flexDirection: 'column',
                },
                flex1: {
                    flex: 1,
                },
                flex: {
                    flex: 1,
                },
                alignItemsCenter: {
                    alignItems: 'center',
                },
                justifyContentCenter: {
                    justifyContent: 'center',
                },
                justifyContentBetween: {
                    justifyContent: 'space-between',
                },
                alignItemsStretch: {
                    alignItems: 'stretch',
                },
                alignSelfCenter: {
                    alignSelf: 'center',
                },
                // Spacing - matching Expensify scale
                // Margins
                m0: {margin: 0},
                m1: {margin: 4},
                m2: {margin: 8},
                m3: {margin: 12},
                m4: {margin: 16},
                m5: {margin: 20},
                m6: {margin: 24},
                // Margin Top
                mt0: {marginTop: 0},
                mt1: {marginTop: 4},
                mt2: {marginTop: 8},
                mt3: {marginTop: 12},
                mt4: {marginTop: 16},
                mt5: {marginTop: 20},
                mt6: {marginTop: 24},
                // Margin Bottom
                mb0: {marginBottom: 0},
                mb1: {marginBottom: 4},
                mb2: {marginBottom: 8},
                mb3: {marginBottom: 12},
                mb4: {marginBottom: 16},
                mb5: {marginBottom: 20},
                mb6: {marginBottom: 24},
                // Margin Left
                ml0: {marginLeft: 0},
                ml1: {marginLeft: 4},
                ml2: {marginLeft: 8},
                ml3: {marginLeft: 12},
                ml4: {marginLeft: 16},
                ml5: {marginLeft: 20},
                // Margin Right
                mr0: {marginRight: 0},
                mr1: {marginRight: 4},
                mr2: {marginRight: 8},
                mr3: {marginRight: 12},
                mr4: {marginRight: 16},
                mr5: {marginRight: 20},
                // Margin Horizontal
                mx0: {marginHorizontal: 0},
                mx1: {marginHorizontal: 4},
                mx2: {marginHorizontal: 8},
                mx3: {marginHorizontal: 12},
                mx4: {marginHorizontal: 16},
                mx5: {marginHorizontal: 20},
                // Margin Vertical
                my0: {marginVertical: 0},
                my1: {marginVertical: 4},
                my2: {marginVertical: 8},
                my3: {marginVertical: 12},
                my4: {marginVertical: 16},
                my5: {marginVertical: 20},
                // Padding
                p0: {padding: 0},
                p1: {padding: 4},
                p2: {padding: 8},
                p3: {padding: 12},
                p4: {padding: 16},
                p5: {padding: 20},
                p6: {padding: 24},
                // Padding Top
                pt0: {paddingTop: 0},
                pt1: {paddingTop: 4},
                pt2: {paddingTop: 8},
                pt3: {paddingTop: 12},
                pt4: {paddingTop: 16},
                pt5: {paddingTop: 20},
                // Padding Bottom
                pb0: {paddingBottom: 0},
                pb1: {paddingBottom: 4},
                pb2: {paddingBottom: 8},
                pb3: {paddingBottom: 12},
                pb4: {paddingBottom: 16},
                pb5: {paddingBottom: 20},
                // Padding Horizontal
                ph0: {paddingHorizontal: 0},
                ph1: {paddingHorizontal: 4},
                ph2: {paddingHorizontal: 8},
                ph3: {paddingHorizontal: 12},
                ph4: {paddingHorizontal: 16},
                ph5: {paddingHorizontal: 20},
                // Padding Vertical
                pv0: {paddingVertical: 0},
                pv1: {paddingVertical: 4},
                pv2: {paddingVertical: 8},
                pv3: {paddingVertical: 12},
                pv4: {paddingVertical: 16},
                pv5: {paddingVertical: 20},
                // Gap
                gap1: {gap: 4},
                gap2: {gap: 8},
                gap3: {gap: 12},
                gap4: {gap: 16},
                gap5: {gap: 20},
                // Layout
                container: {
                    flex: 1,
                    backgroundColor: theme.appBG,
                },
                // Form styles
                centered: {
                    flexGrow: 1,
                    justifyContent: 'center',
                    padding: 16,
                },
                padded: {
                    padding: 24,
                },
                borderRadius: {
                    borderRadius: 12,
                },
                // Typography
                heading: {
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: theme.text,
                    marginBottom: 8,
                },
                title: {
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: theme.text,
                },
                subtitle: {
                    fontSize: 16,
                    color: theme.textSupporting,
                    marginBottom: 24,
                },
                form: {
                    gap: 16,
                },
                label: {
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.text,
                },
                errorText: {
                    color: theme.error || theme.danger,
                    fontSize: 12,
                    lineHeight: 16,
                },
                fullWidth: {
                    width: '100%',
                },
                // Divider styles
                divider: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 16,
                },
                dividerText: {
                    color: theme.textSupporting,
                    fontSize: 14,
                    paddingHorizontal: 16,
                },
                // Link styles
                linkContainer: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                },
                link: {
                    color: theme.link,
                    textDecorationLine: 'underline',
                },
                centeredScroll: {
                    flexGrow: 1,
                    justifyContent: 'center',
                    paddingVertical: 16,
                },
                // Social button styles
                socialButton: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 100,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    gap: 12,
                    backgroundColor: theme.componentBG,
                },
                socialIcon: {
                    marginRight: 8,
                },
                socialButtonText: {
                    color: theme.text,
                    fontSize: 16,
                    fontWeight: '600',
                },
            }),
        [theme],
    );

    return styles;
}
