<template>
  <v-container class="fill-height" fluid style="min-height: 100vh">
    <v-row align="center" justify="center" style="justify-content: center">
      <v-col cols="12" sm="8" md="4">
        <v-card
          elevation="4"
          rounded="lg"
          class="pa-6 login-card"
          style="border: 2px solid rgb(var(--v-theme-primary))"
        >
          <v-card-title
            class="text-h4 text-center pa-2 font-weight-bold text-primary"
            style="font-family: 'Special Elite', monospace !important; letter-spacing: 3px"
          >
            Login
          </v-card-title>

          <v-card-text class="px-6 pt-4">
            <v-form ref="formRef" v-model="valid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Username"
                prepend-inner-icon="mdi-account"
                :rules="[rules.required]"
                variant="outlined"
                base-color="primary"
                color="primary"
                class="mb-2"
              />

              <v-text-field
                v-model="password"
                label="Password"
                prepend-inner-icon="mdi-lock"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :rules="[rules.required]"
                variant="outlined"
                base-color="primary"
                color="primary"
                class="mb-2"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-checkbox
                v-model="rememberMe"
                label="Remember me (30 days)"
                color="primary"
                hide-details
                class="mb-4"
              />

              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
                {{ errorMessage }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="authStore.loading"
                :disabled="!valid"
                variant="outlined"
                style="font-family: 'Special Elite', monospace"
              >
                > CONNECT
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const formRef = ref();
const valid = ref(false);
const username = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');

const rules = {
  required: (value: string) => !!value || 'Required field',
};

const handleLogin = async () => {
  if (!valid.value) return;

  errorMessage.value = '';

  const result = await authStore.login({
    username: username.value,
    password: password.value,
    rememberMe: rememberMe.value,
  });

  if (result.success) {
    router.push('/');
  } else {
    errorMessage.value = result.message || 'Login failed';
  }
};
</script>

<style scoped lang="scss">
.login-card {
  animation: slideUp 0.5s ease;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(var(--v-theme-primary), 0.2);
    transform: translateY(-2px);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.v-text-field) {
  transition: all 0.25s ease;
}

:deep(.v-btn) {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-transform: uppercase;
  font-family: 'Special Elite', monospace;
  letter-spacing: 1px;
  font-weight: 500;

  &:hover:not(:disabled) {
    box-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.4);
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
