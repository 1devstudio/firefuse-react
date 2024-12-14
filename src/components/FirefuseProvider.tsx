import { type Auth, type User, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Logger } from '../services/Logger.ts';

type Props = {
  /**
   * The domain of the Firefuse instance
   */
  domain: string;
  /**
   * The default redirect URL that should be used after authenticating in Firefuse.
   * You can override that on the `loginWithRedirect` method.
   */
  redirectUrl: string;
  /**
   * The firebase auth instance
   */
  firebaseAuth: Auth;
  /**
   * Whether to enable debug mode
   */
  debug?: boolean;
  /**
   * The loader to be displayed while loading the user
   */
  loader?: React.ReactNode;
  children: React.ReactNode | React.ReactNode[];
};

type LoginParams = {
  /**
   * The redirect URL to be used after authenticating in Firefuse.
   */
  redirectUrl?: string;
};

type LogoutParams = {
  /**
   * The redirect URL to be used after logging out. When empty it will redirect to sign in page.
   */
  redirectUrl?: string;
};

type AuthUrlParams = {
  /**
   * The redirect URL to be used after authenticating in Firefuse.
   */
  redirectUrl?: string;
  /**
   * The page to be used in the Firefuse login page
   */
  page?: 'sign-in' | 'sign-up';
};

type AuthContextProps = {
  /**
   * Whether the user is still loading
   */
  isLoading: boolean;
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  /**
   * The current user
   */
  user: User | null;
  /**
   * Redirects the user to the Firefuse login page
   * @param params: LoginParams
   */
  loginWithRedirect: (params?: LoginParams) => void;
  /**
   * Redirects the user to the Firefuse register page
   * @param params: LoginParams
   */
  registerWithRedirect: (params?: LoginParams) => void;
  /**
   * Logs out the user
   * @param params: LogoutParams
   */
  logout: (params?: LogoutParams) => Promise<void>;
  /**
   * Returns the sign in or sign up URL.
   * After sign out if the user provided custom redirect URL it will be used.
   * @param params: AuthUrlParams
   */
  getAuthUrl: (params: AuthUrlParams) => string;
};

const AuthContext = createContext<AuthContextProps>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  loginWithRedirect: (_params: LoginParams = {}) => {
    /* noop */
  },
  registerWithRedirect: (_params: LoginParams = {}) => {
    /* noop */
  },
  logout: async (_params: LogoutParams = {}) => {
    /* noop */
  },
  getAuthUrl: (_params: AuthUrlParams) => {
    return '';
  },
});

type State = {
  loading: boolean;
  user: User | null;
};

export const useAuth = () => useContext(AuthContext);

export const FirefuseProvider = ({ domain, redirectUrl, firebaseAuth, children, debug, loader }: Props) => {
  const [tokenChecked, setTokenChecked] = useState(false);
  const [state, setState] = useState<State>({
    loading: true,
    user: null,
  });
  const logger = useMemo(() => new Logger(!!debug), [debug]);
  const logoutUrl = useRef<string>();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const state = searchParams.get('state');
    if (state) {
      const { token } = JSON.parse(atob(state));
      signInWithCustomToken(firebaseAuth, token)
        .then((user) => {
          logger.log('🔥 signed in successfully', user);
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(logger.error)
        .finally(() => {
          setTokenChecked(true);
        });
    } else {
      logger.log('🔥 not state param found');
      setTokenChecked(true);
    }
  }, [logger, firebaseAuth]);

  useEffect(() => {
    if (tokenChecked) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        logger.log('🔥 auth state changed', user?.uid);
        setState({
          loading: false,
          user,
        });
      });

      return () => unsubscribe();
    }
  }, [tokenChecked, logger, firebaseAuth]);

  const loginWithRedirect = useCallback(
    (params: LoginParams = {}) => {
      logger.log('🔥 redirect to Firefuse');
      window.location.replace(
        `https://${domain}/sign-in?state=${btoa(
          JSON.stringify({
            redirectUrl: params.redirectUrl || redirectUrl,
          }),
        )}`,
      );
    },
    [domain, redirectUrl, logger],
  );

  const registerWithRedirect = useCallback(
    (params: LoginParams = {}) => {
      logger.log('🔥 redirect to Firefuse');
      window.location.replace(
        `https://${domain}/sign-up?state=${btoa(
          JSON.stringify({
            redirectUrl: params.redirectUrl || redirectUrl,
          }),
        )}`,
      );
    },
    [domain, redirectUrl, logger],
  );

  const logout = useCallback(
    async (params: LogoutParams = {}) => {
      logger.log('🔥 logout');
      logoutUrl.current =
        params.redirectUrl ||
        `https://${domain}/sign-in?state=${btoa(
          JSON.stringify({
            redirectUrl,
          }),
        )}`;
      logger.log('🔥 logout url', logoutUrl.current);
      await signOut(firebaseAuth);
    },
    [firebaseAuth, logger, domain, redirectUrl],
  );

  const getAuthUrl = useCallback(
    (params: AuthUrlParams = {}) => {
      const authUrl =
        logoutUrl.current ||
        `https://${domain}/${params.page || 'sign-in'}?state=${btoa(
          JSON.stringify({
            redirectUrl: params.redirectUrl || redirectUrl,
          }),
        )}`;
      logger.log('🔥 auth url', authUrl);
      logoutUrl.current = undefined;
      return authUrl;
    },
    [domain, redirectUrl, logger],
  );

  if (state.loading) return loader || null;

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: !!state.user,
        isLoading: state.loading,
        loginWithRedirect,
        registerWithRedirect,
        logout,
        getAuthUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
