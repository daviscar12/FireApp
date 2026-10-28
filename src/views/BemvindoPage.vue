<template>
  <ion-page>
    <ion-content class="ion-padding">
      <main>
        <img v-if="image" class="avatar" :src="image" alt="Foto do perfil" />
        <h1>Bem-vindo{{ name ? `, ${name}` : '' }}!</h1>
        <p v-if="nickname">Seu nickname: {{ nickname }}</p>
        <p v-else>Você está conectado com {{ email }}.</p>
        <p v-if="message" role="alert">{{ message }}</p>

        <nav>
          <router-link to="/perfil">Editar perfil</router-link>
          <button type="button" :disabled="loading" @click="logout">
            {{ loading ? 'Saindo...' : 'Sair' }}
          </button>
        </nav>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { IonContent, IonPage } from '@ionic/vue';

import { getFirebaseServices } from '@/firebase';

const router = useRouter();
const name = ref('');
const nickname = ref('');
const email = ref('');
const image = ref('');
const message = ref('');
const loading = ref(false);

onMounted(async () => {
  try {
    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;

    if (!user) {
      await router.replace('/login');
      return;
    }

    email.value = user.email ?? '';
    name.value = user.displayName ?? '';

    const [profile, photo] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'images', user.uid)),
    ]);
    if (profile.exists()) {
      name.value = profile.data().name ?? name.value;
      nickname.value = profile.data().nickname ?? '';
    }
    image.value = photo.data()?.image ?? '';
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Não foi possível carregar seu perfil.';
  }
});

async function logout() {
  loading.value = true;

  try {
    const { auth } = getFirebaseServices();
    await signOut(auth);
    await router.replace('/login');
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Não foi possível sair da conta.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
