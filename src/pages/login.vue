<script setup lang="ts">
// https://vuelidate-next.netlify.app/
import { useVuelidate } from '@vuelidate/core'
import { email, helpers, minLength, required, sameAs } from '@vuelidate/validators'
import { _ } from 'lodash'

const router = useRouter()

const authStore = useAuthStore()
// const { userStore } = useUserStore()
const state = reactive({
  email: '',
  password: '',
  confirmPassword: '',
})

const inSignupMode = ref(false)
watch(inSignupMode, () => {
  v$.value.$reset()
  authStore.clearError()
})

const rules = {
  email: { required, email },
  password: {
    required,
    minLength: minLength(4),
  },
  confirmPassword: {
    required,
    minLength: minLength(4),
    sameAsPassword: helpers.withMessage(
      'must match password',
      sameAs(computed(() => state.password)),
    ),
  },
}
// validation rules change depending on login or signup
const conditionalRules = computed(() => {
  return inSignupMode.value ? rules : _.omit(rules, 'confirmPassword')
})
const v$ = useVuelidate(conditionalRules, state)

const handleLogin = async () => {
  const isValid = await v$.value.$validate()
  if (isValid) {
    const { email, password } = state
    loginAndRedirect(email, password)
  }
}
const handleSignup = async () => {
  const isValid = await v$.value.$validate()
  if (isValid) {
    const { email, password } = state
    // const user = await authStore.create({ email, password })
    loginAndRedirect(email, password)
  }
}
const loginAndRedirect = (email: string, password: string) => {
  console.log('loginAndRedirect', email, password)
  authStore
    .signInWithEmail(email, password)
    .then(({ data, error }) => {
      console.log('error', error)
      if (error == null) {
        const redirectTo = authStore.loginRedirect || '/app'
        console.log('redirectTo', redirectTo)
        authStore.loginRedirect = null
        router.push(redirectTo)
      }
    })
    .catch((error: any) => {
      console.log(error)
    })
}
</script>

<template>
  <Flex items-center justify-center>
    <Card class="max-w-xs bg-base-200 mx-auto">
      <CardBody class="gap-4">
        <Text medium size="2xl">
          <span v-if="inSignupMode">Signup</span>
          <span v-else>Login</span>
        </Text>

        <form class="flex flex-col gap-4">
          <Flex col class="gap-2">
            <FormControlText
              v-model="state.email"
              :validation-obj="v$.email"
              placeholder="enter email"
              type="email"
            />
            <FormControlText
              v-model="state.password"
              :validation-obj="v$.password"
              placeholder="enter password"
              type="password"
            />
            <div
              class="overflow-hidden transition-all duration-500"
              :class="[inSignupMode ? 'max-h-20 mt-0' : 'max-h-0 -mt-4']"
            >
              <FormControlText
                v-model="state.confirmPassword"
                :validation-obj="v$.confirmPassword"
                placeholder="confirm password"
                type="password"
              />
            </div>

            <Text
              center
              error
              class="pt-2 overflow-hidden transition-all duration-500"
              :class="authStore.lastError ? 'max-h-12' : 'max-h-0'"
            >
              {{ authStore.lastError?.message }}
            </Text>
          </Flex>

          <Button v-if="inSignupMode" primary @click.prevent="handleSignup"> Signup</Button>
          <Button v-else primary @click.prevent="handleLogin"> Login</Button>

          <div class="text-center">
            <Flex v-if="inSignupMode" col>
              <span>Already signed up?</span>
              <Link @click="inSignupMode = !inSignupMode">
                <span>Login</span>
              </Link>
            </Flex>
            <Flex v-else col>
              <span>Need an account?</span>
              <Link @click="inSignupMode = !inSignupMode">
                <span>Signup</span>
              </Link>
            </Flex>
          </div>
        </form>
      </CardBody>
    </Card>
  </Flex>
</template>
