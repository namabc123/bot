import React, { useEffect, useReducer, useState } from 'react'
import { Hub } from 'aws-amplify/utils'
import AccountContext from '.'
import {
  signOut,
  signUp,
  signIn,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  updateUserAttributes
} from 'aws-amplify/auth'
import Cookies from 'js-cookie'
import { getHostApi } from '@/Utils/AxiosUtils'
import LogRocket from 'logrocket'
import { useSearchParams, usePathname, useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { fetchUserAttributes } from 'aws-amplify/auth'
import useSWR from 'swr'

const initAuthState = {
  username: null,
  userId: null,
  nextStep: null,
  accessToken: null,
  idToken: null,
  error: null,
  loading: null,
}

const initData = {
  address: [],
  loading: null,
  error: null,
  addresses: {
    loading: null,
    data: [],
    error: null,
  },
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOADING':
      // console.log('ACCOUNT-LOADING', action.payload)
      return { ...state, loading: action.payload }
    case 'SIGNED_IN':
      return { ...state, ...action.payload, loading: false }
    case 'SIGNED_OUT':
      return initAuthState
    case 'ERROR':
      return { ...state, error: action.payload, loading: false }
  }
  return state
}

const reducerData = (state, action) => {
  switch (action.type) {
    case 'SET_ADDRESSES':
      return { ...state, address: action.payload.data }
  }
  return state
}

const AccountProvider = props => {
  const router = useRouter()
  const searchParamss = useSearchParams()
  const searchParams = searchParamss?.get('redirect')
  //TODO: Sync with user data
  //TODO: Hub.listen
  const [profile, setProfile] = useState('')
  const [mobileSideBar, setMobileSideBar] = useState(false)
  const [accountData, setAccountData] = useReducer(reducerData, initData)
  const [auth, dispatch] = useReducer(reducer, initAuthState)

  const {
    data: useratribute,
    error,
    isLoading,
    mutate,
  } = useSWR('/me', () => fetchUserAttributes())
  console.log('useratribute',  useratribute)

  useEffect(() => {
    const defaultImage = 'https://react.pixelstrap.net/fastkart/assets/avatar.png';
    if (auth?.userId && useratribute?.profile) {
      const imgUrl = useratribute.profile;
      setProfile(imgUrl);
    } else {
      setProfile(defaultImage);
    }
  }, [auth, useratribute]);

  useEffect(() => {
    fetchAuthSession()
      .then(async session => {
        // console.log('SIGNED_IN', { session })
        Cookies.set('uat', session.tokens.idToken.toString(), {
          path: '/',
          expires: new Date(Date.now() + 24 * 3600),
        })
        const user = await getCurrentUser()
        // console.log('SIGNED_IN', { tokens: session.tokens, user })
        const idToken = session?.tokens?.idToken
        if (idToken && idToken?.payload?.sub) {
          LogRocket.identify(idToken.payload.sub, {
            name: idToken.payload?.name || idToken.payload?.email || undefined,
            email: idToken.payload?.email || undefined,
            // Add your own custom user variables here, ie:
            // subscriptionType: 'pro'
          })
        }

        dispatch({
          type: 'SIGNED_IN',
          payload: { ...session.tokens, ...user },
        })
      })
      .catch(error => {})
    // .finally(() => {})
  }, [])

  useEffect(() => {
    // autoSignIn().then(console.log).catch(console.error)
    const listener = Hub.listen('auth', event => {
      console.log({ HUB: event })
      switch (event.payload.event) {
        case 'signedIn':
          console.log('user have been signedIn successfully.')
          break
        case 'signedOut':
          console.log('user have been signedOut successfully.')
          break
        case 'tokenRefresh':
          console.log('auth tokens have been refreshed.')
          break
        case 'tokenRefresh_failure':
          console.log('failure while refreshing auth tokens.')
          break
        case 'signInWithRedirect':
          console.log('signInWithRedirect API has successfully been resolved.')
          break
        case 'signInWithRedirect_failure':
          console.log('failure while trying to resolve signInWithRedirect API.')
          break
        case 'customOAuthState':
          logger.info('custom state returned from CognitoHosted UI')
          break
      }
    })
    return listener
  }, [])

  const handleLogin = async ({ username, password }) => {
    console.log('LOGIN', { username })
    try {
      dispatch({ type: 'LOADING', payload: true })
      await signIn({ username, password })
      const user = await getCurrentUser()
      const session = await fetchAuthSession().catch(console.error)
      Cookies.set('uat', session?.tokens?.idToken.toString())
      dispatch({ type: 'SIGNED_IN', payload: { ...user, ...session } })
    } catch (error) {
      console.error('LOGIN ERROR', error.message)
      dispatch({ type: 'ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'LOADING', payload: false })
    }
  }

  const handleSignUp = async ({ username, password, email }) => {
    try {
      dispatch({ type: 'LOADING', payload: true })
      const { isSignedUpComplete, userId, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: { email },
          //  autoSignIn: true
        },
      })
      dispatch({
        type: 'SIGNED_UP',
        payload: { isSignedUpComplete, userId, nextStep },
      })
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'LOADING', payload: false })
    }
  }

  const handleConfirmSignUp = async ({ username, token }) => {
    try {
      dispatch({ type: 'LOADING', payload: true })
      const data = await confirmSignUp({ username, confirmationCode: token })
      dispatch({ type: 'CONFIRMED_SIGN_UP', payload: data })
      console.log('CONFIRMED', data)
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error.message })
      console.error(error)
    } finally {
      dispatch({ type: 'LOADING', payload: false })
      console.log('CONFIRMED SIGN IN')
    }
  }

  const handleSignOut = async ({ global = false }) => {
    try {
      dispatch({ type: 'LOADING', payload: true })
      const res = await signOut({ global })
      dispatch({ type: 'SIGNED_OUT' })
      console.log('SIGNED_OUT', { res })
    } catch (error) {
      dispatch({ type: 'ERROR', payload: error.message })
      console.error(error.message)
    } finally {
      dispatch({ type: 'LOADING', payload: false })
    }
  }

  const fetchAddresses = async () => {
    setAccountData({ type: 'LOADING', payload: { loading: true, error: null } })
    fetch(`${getHostApi()}address`, {
      headers: {
        Authorization: `Bearer ${Cookies.get('uat')}`,
      },
    })
      .then(res => res.json())
      .then(json => {
        setAccountData({
          type: 'SET_ADDRESSES',
          payload: { loading: null, data: json, error: null },
        })
      })
      .catch(error => {
        setAccountData({
          type: 'ERROR',
          payload: { loading: null, data: [], error: error.message },
        })
      })
  }

  return (
    <AccountContext.Provider
      value={{
        ...props,
        dispatch,
        auth,
        accountData,
        setAccountData,
        mobileSideBar,
        setMobileSideBar,
        login: handleLogin,
        signUp: handleSignUp,
        signOut: handleSignOut,
        confirmSignUp: handleConfirmSignUp,
        fetchAddresses,
        searchParams,
        profile, 
        setProfile,
      }}
    >
      {props.children}
    </AccountContext.Provider>
  )
}

export default AccountProvider
