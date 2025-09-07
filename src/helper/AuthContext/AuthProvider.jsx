import { useContext, useEffect, useState } from 'react'
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  signInWithRedirect,
  autoSignIn,
} from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

import AuthContext from '.'

const AuthProvider = props => {
  useEffect(() => {
    // autoSignIn().then(console.log).catch(console.error)
    const listener = Hub.listen('auth', ({ payload }) => {
      console.log({ payload })
      switch (payload.event) {
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
  const handleSignIn = async ({ username, password }) => {
    try {
      const { isSignedIn, nextStep } = await signIn({ username, password })
      return { isSignedIn, nextStep }
    } catch (error) {
      console.error('error signing in', error)
      throw error
    }
  }

  const handleAutoSignIn = async () => {
    try {
      const signInOutput = await autoSignIn()
      console.log({ signInOutput })
      return signInOutput
    } catch (error) {
      throw error
    }
  }

  const handleSignUp = async ({ username, password, email, phone_number }) => {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
            phone_number,
          },
          autoSignIn: true,
        },
      })
      console.log({ userId })
      return { isSignUpComplete, userId, nextStep }
    } catch (error) {
      console.error('error signing up:', error)
      throw error
    }
  }

  const handleConfirmSignUp = async ({ username, confirmationCode }) => {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username,
        confirmationCode,
      })
      return { isSignUpComplete, nextStep }
    } catch (error) {
      console.error('error confirming sign up:', error)
      throw error
    }
  }

  const handleSignOut = async ({ global }) => {
    try {
      await signOut({ global })
    } catch (error) {
      console.error('error signing out:', error)
      throw error
    }
  }

  const handleSignInWithRedirect = async ({ provider }) => {
    try {
      const signInOutput = await signInWithRedirect({ provider })
      console.log({ signInOutput })
      return signInOutput
    } catch (error) {
      console.error('error signing in with redirect:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...props,
        handleSignIn,
        handleSignUp,
        handleSignOut,
        handleConfirmSignUp,
        handleAutoSignIn,
        handleSignInWithRedirect,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
