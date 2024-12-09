import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {User, onAuthStateChanged, Auth, signInWithCustomToken} from 'firebase/auth'
import {Logger} from "../services/Logger.ts";

type Props = {
  /**
   * The domain of the Firefuse instance
   */
  domain: string;
  /**
   * The redirect URL that should be used after authenticating in Firefuse
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
  children: React.ReactNode | React.ReactNode[];
}

type AuthContextProps = {
  user: User | null
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
})

type State = {
  loading: boolean
  user: User | null
}

export const useAuth = () => useContext(AuthContext)

export const FirefuseProvider = ({ domain, redirectUrl, firebaseAuth, children, debug }: Props) => {
  const [tokenChecked, setTokenChecked] = useState(false)
  const [state, setState] = useState<State>({
    loading: true,
    user: null,
  })
  const logger = useMemo(() => new Logger(!!debug), [debug])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const state = searchParams.get('state');
    if (state) {
      const { token } = JSON.parse(atob(state))
      signInWithCustomToken(firebaseAuth, token)
        .then(user => {
          logger.log("🔥 signed in successfully", user)
        })
        .catch(logger.error)
        .finally(() => {
          setTokenChecked(true)
        })
    } else {
      setTokenChecked(true)
    }
  }, []);

  useEffect(() => {
    if (tokenChecked) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
        logger.log("🔥 auth state changed", user?.uid);
        setState({
          loading: false,
          user,
        })
      })

      return () => unsubscribe()
    }
  }, [tokenChecked])

  useEffect(() => {
    if (!state.loading && !state.user) {
      logger.log("🔥 redirect to Firefuse")
      window.location.replace(`https://${domain}/sign-in?state=${btoa(JSON.stringify({ redirectUrl }))}`)
    }
  }, [state.loading, state.user]);

  if (state.loading || !state.user) return null

  return <AuthContext.Provider value={{
    user: state.user,
  }}>
    { children }
  </AuthContext.Provider>
}
