import UserContext from '.'
import { Hub } from 'aws-amplify/utils'
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signUp,
  confirmSignUp,
  autoSignIn,
  fetchUserAttributes,
  updateUserAttributes,
} from 'aws-amplify/auth'
import { useState, useReducer, useEffect } from 'react'

const initialAuth = {
  username: null,
  userId: null,
  isSignedIn: null,
  isSignUpComplete: null,
  nextStep: null,
  accessToken: null,
  idToken: null,
  error: null,
}

const reducer = (state, action) => {}

export default function UserProvider(props) {
  const [auth, dispatch] = useReducer(reducer, initialAuth)

  const getUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      console.log('User:', currentUser)
      setAuth(currentUser)
    } catch (error) {
      console.error(error)
      console.log('Not signed in')
    }
  }

  const handleSignIn = async (username, password) => {
    signIn({ username, password })
      .then(({ isSignedIn, nextStep }) => {
        dispatch({ type: 'SIGNED_IN', payload: { isSignedIn, nextStep } })
      })
      .catch(error => {
        dispatch({ type: 'ERROR', payload: error.message })
        console.error(error.message)
      })
      .finally(() => {
        console.log('SIGNED IN')
      })
  }

  const handleSignUp = async (username, password, email) => {
    signUp({
      username,
      password,
      options: {
        userAttributes: { email },
        autoSignIn: true,
      },
    })
      .then(({ isSignedUpComplete, userId, nextStep }) => {
        dispatch({
          type: 'SIGNED_UP',
          payload: { isSignedUpComplete, userId, nextStep },
        })
      })
      .catch(error => {
        dispatch({ type: 'ERROR', payload: error.message })
      })
      .finally(() => {})
  }

  const handleConfirmSignUp = async (username, token) => {
    confirmSignUp({ username, confirmationCode: token })
      .then(data => {
        dispatch({ type: 'CONFIRMED_SIGN_UP', payload: data })
        console.log('CONFIRMED', data)
      })
      .catch(error => {
        dispatch({ type: 'ERROR', payload: error.message })
        console.error(error)
      })
      .finally(() => {
        console.log('CONFIRMED SIGN IN')
      })
  }

  useEffect(() => {
    // autoSignIn()
    // .then(console.log)
    // .catch(error => console.error(error.message))
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      console.log('auth event', payload)
      switch (payload.event) {
        case 'signedIn':
          getUser().then(console.log).catch(console.error)
          break
        case 'signInWithRedirect':
          break
        case 'signInWithRedirect_failure':
          setError('An error has occured during the OAuth flow.')
          break
      }
    })

    return unsubscribe
  }, [])

  return (
    <UserContext.Provider
      value={{
        ...props,
        getCurrentUser,
        fetchAuthSession,
        signIn,
        signUp,
        autoSignIn,
        confirmSignUp,
        fetchUserAttributes,
        updateUserAttributes,
      }}
    >
      {props.children}
    </UserContext.Provider>
  )
}
