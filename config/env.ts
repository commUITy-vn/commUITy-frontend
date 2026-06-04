import * as z from 'zod';
import { Platform } from 'react-native';

const createEnv = () => {
  const EnvSchema = z.object({
    API_URL: z.string(),
    ENABLE_API_MOCKING: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true')
      .optional(),
    APP_URL: z.string().optional().default('http://localhost:3000'),
    APP_MOCK_API_PORT: z.string().optional().default('8080'),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_UPLOAD_PRESET: z.string().optional().default(''),
    CLOUDINARY_FOLDER: z.string().optional().default('helphub'),
  });

  const envVars = {
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    ENABLE_API_MOCKING: process.env.EXPO_PUBLIC_ENABLE_API_MOCKING,
    APP_URL: process.env.EXPO_PUBLIC_URL,
    APP_MOCK_API_PORT: process.env.EXPO_PUBLIC_MOCK_API_PORT,
    CLOUDINARY_CLOUD_NAME: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_UPLOAD_PRESET: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    CLOUDINARY_FOLDER: process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER,
  };

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.
  The following variables are missing or invalid:
  ${Object.entries(parsedEnv.error.flatten().fieldErrors)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')}
  `,
    );
  }

  let apiUrl = parsedEnv.data.API_URL;

  if (Platform.OS === 'android') {
    apiUrl = apiUrl.replace(/http:\/\/(localhost|127\.0\.0\.1)/, 'http://10.0.2.2');
  }

  return {
    ...parsedEnv.data,
    API_URL: apiUrl,
  };
};

export const env = createEnv();
