import * as Linking from 'expo-linking';

export const createPayOsMobileRedirectUrls = () => ({
  returnUrl: Linking.createURL('/payment/payos-return'),
  cancelUrl: Linking.createURL('/payment/payos-cancel'),
});

export const getPayOsMobileCallbackUrl = () => Linking.createURL('/');

export const getRouteFromPayOsRedirectUrl = (url: string) => {
  const parsed = Linking.parse(url);
  const normalizedPath = parsed.path ? `/${parsed.path.replace(/^\/+/, '')}` : '/payment/payos-return';

  return {
    pathname: normalizedPath,
    params: parsed.queryParams ?? {},
  };
};
