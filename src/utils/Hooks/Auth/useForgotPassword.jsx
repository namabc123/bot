import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import request from '../../AxiosUtils'
import { ForgotPasswordAPI } from '../../AxiosUtils/API'
import { ToastNotification } from '../../CustomFunctions/ToastNotification'
import { emailSchema, nameSchema, passwordConfirmationSchema, passwordSchema, YupObject } from '../../Validation/ValidationSchemas'

export const ForgotPasswordSchema = YupObject({
  password: passwordSchema,
  password_confirmation: passwordConfirmationSchema,
  code: nameSchema,
})

export const ForgotPasswordSchemaStep1 = YupObject({
  email: emailSchema,
})

const useHandleForgotPassword = () => {
  const router = useRouter()
  return useMutation(
    data => request({ url: ForgotPasswordAPI, method: 'post', data }),
    {
      onSuccess: (responseData, requestData) => {
        if (responseData.status === 200 || responseData.status === 201) {
          ToastNotification('success', responseData.data.message)
          Cookies.set('ue', requestData.email)
          router.push('/auth/otp-verification')
        }
      },
    }
  )
}
export default useHandleForgotPassword
