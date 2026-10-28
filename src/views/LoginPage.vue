<template>
  <ion-page>
    <ion-content class="ion-padding">
      <main>
        <h1>{{ pageTitle }}</h1>
        <form @submit.prevent="isRecover ? recoverPassword() : submit()">
          <label for="email">E-mail</label>
          <input id="email" v-model.trim="email" type="email" autocomplete="email" required />

          <label v-if="!isRecover" for="password">Senha</label>
          <input
            v-if="!isRecover"
            id="password"
            v-model="password"
            type="password"
            :autocomplete="isRegister ? 'new-password' : 'current-password'"
            minlength="6"
            required
          />

          <p v-if="message" role="status">{{ message }}</p>
          <button type="submit" :disabled="loading">
            {{ loading ? 'Aguarde...' : isRecover ? 'Enviar link' : isRegister ? 'Criar conta' : 'Entrar' }}
          </button>
        </form>

        <nav aria-label="Opções de acesso">
          <router-link v-if="!isRegister" to="/criar-conta">Criar conta</router-link>
          <router-link v-if="isRegister || isRecover" to="/login">Voltar para o login</router-link>
          <router-link v-if="!isRecover" to="/recuperar-senha">Esqueci minha senha</router-link>
        </nav>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { IonContent, IonPage } from '@ionic/vue';

import { getFirebaseServices } from '@/firebase';

const route = useRoute();
const router = useRouter();
const email = ref('');
const password = ref('');
const message = ref('');
const loading = ref(false);
const isRegister = computed(() => route.path === '/criar-conta');
const isRecover = computed(() => route.path === '/recuperar-senha');
const pageTitle = computed(() => (isRegister.value ? 'Criar conta' : isRecover.value ? 'Recuperar senha' : 'Login'));

watch(
  () => route.path,
  () => {
    message.value = '';
  },
);

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('Configure as variáveis')) {
    return error.message;
  }

  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  };

  return (code && messages[code]) || 'Não foi possível concluir a operação. Verifique os dados e tente novamente.';
}

async function submit() {
  loading.value = true;
  message.value = '';

  try {
    const { auth } = getFirebaseServices();

    if (isRegister.value) {
      await createUserWithEmailAndPassword(auth, email.value, password.value);
      await router.push('/perfil');
      return;
    }

    await signInWithEmailAndPassword(auth, email.value, password.value);
    await router.push('/bem-vindo');
  } catch (error) {
    message.value = errorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function recoverPassword() {
  loading.value = true;
  message.value = '';

  try {
    const { auth } = getFirebaseServices();
    await sendPasswordResetEmail(auth, email.value);
    message.value = 'Se houver uma conta com este e-mail, você receberá um link para redefinir a senha.';
  } catch (error) {
    message.value = errorMessage(error);
  } finally {
    loading.value = false;
  }
}
</script>
