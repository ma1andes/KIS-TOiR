import { AuthProvider } from 'react-admin';
import {
  forceReauthentication,
  getIdentity,
  getRealmRoles,
  getValidAccessToken,
  initKeycloak,
  logoutFromKeycloak,
} from './keycloak';

const authProvider: AuthProvider = {
  login: async () => {
    await initKeycloak();
  },

  logout: async () => {
    await logoutFromKeycloak();
  },

  checkAuth: async () => {
    await getValidAccessToken();
  },

  checkError: async (error) => {
    const status = error?.status;

    if (status === 401) {
      await forceReauthentication();
      return Promise.reject(error);
    }

    if (status === 403) {
      return Promise.resolve();
    }

    return Promise.resolve();
  },

  getIdentity: async () => getIdentity(),

  getPermissions: async () => getRealmRoles(),
};

export default authProvider;

