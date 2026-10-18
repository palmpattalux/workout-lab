import type { CapacitorConfig } from '@capacitor/cli'

// The iPhone and Android apps: the same built site (dist/) inside a native shell.
const config: CapacitorConfig = {
  appId: 'app.dotset',
  appName: 'Dotset',
  webDir: 'dist',
  backgroundColor: '#f3f4f2',
  ios: { contentInset: 'never' },
}

export default config
