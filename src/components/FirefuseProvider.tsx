import { type Auth, type User, onAuthStateChanged, signInWithCustomToken, signOut } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  redirectUrl?: string;
};

type AuthContextProps = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  loginWithRedirect: (params: LoginParams) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps>({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  loginWithRedirect: (_params: LoginParams = {}) => {
    /* noop */
  },
  logout: async () => {
    /* noop */
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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const state = searchParams.get('state');
    if (state) {
      const { token } = JSON.parse(atob(state));
      signInWithCustomToken(firebaseAuth, token)
        .then((user) => {
          logger.log('🔥 signed in successfully', user);
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

  const logout = useCallback(() => {
    logger.log('🔥 logout');
    return signOut(firebaseAuth);
  }, [firebaseAuth, logger]);

  if (state.loading) return loader || null;

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        isAuthenticated: !!state.user,
        isLoading: state.loading,
        loginWithRedirect,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
