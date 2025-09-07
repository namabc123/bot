import React from 'react'
import AuthContext from '.'

const AuthProvider = props => {
  return (
    <AuthContext.Provider value={{ ...props }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
