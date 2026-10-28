<template>
  <ion-page>
    <ion-content class="ion-padding">
      <main>
        <h1>Seu perfil</h1>
        <form @submit.prevent="saveProfile">
          <label>Nome <input v-model.trim="name" required /></label>
          <label>Data de nascimento <input v-model="birthDate" type="date" required /></label>
          <label>Nickname <input v-model.trim="nickname" required /></label>
          <label>Fotos <input type="file" accept="image/*" @change="selectPhoto" /></label>
          <img v-if="image" class="avatar" :src="image" alt="Foto do perfil" />
          <p v-if="message">{{ message }}</p>
          <button :disabled="loading">{{ loading ? 'Salvando...' : 'Salvar perfil' }}</button>
        </form>
        <router-link to="/bem-vindo">Voltar</router-link>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { IonContent, IonPage } from '@ionic/vue';
import { getFirebaseServices } from '@/firebase';

const router = useRouter();
const name = ref('');
const birthDate = ref('');
const nickname = ref('');
const image = ref('');
const message = ref('');
const loading = ref(false);

onMounted(async () => {
  try {
    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) return router.replace('/login');

    const [profile, photo] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDoc(doc(db, 'images', user.uid)),
    ]);

    if (profile.exists()) {
      name.value = profile.data().name ?? '';
      birthDate.value = profile.data().birthDate ?? '';
      nickname.value = profile.data().nickname ?? '';
    }
    image.value = photo.data()?.image ?? '';
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Não foi possível carregar o perfil.';
  }
});

function selectPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 700 * 1024) {
    message.value = 'Escolha uma imagem de até 700 KB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    image.value = String(reader.result);
    message.value = '';
  };
  reader.onerror = () => {
    message.value = 'Não foi possível ler a imagem.';
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  loading.value = true;
  message.value = '';

  try {
    const { auth, db } = getFirebaseServices();
    const user = auth.currentUser;
    if (!user) return router.replace('/login');

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.uid), { name: name.value, birthDate: birthDate.value, nickname: nickname.value });
    batch.set(doc(db, 'images', user.uid), { image: image.value });
    await batch.commit();
    message.value = 'Perfil salvo.';
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Não foi possível salvar o perfil.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
