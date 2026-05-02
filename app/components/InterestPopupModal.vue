<script setup lang="ts">
const STORAGE_KEY = 'afters-interest-popup-dismissed'

const modalDescription =
  "You must register your interest to attend — no register, no ticket."

const showModal = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return
  } catch {
    /* private / restricted storage */
  }

  timer = setTimeout(() => {
    showModal.value = true
  }, 5000)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

watch(showModal, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }
})

function closeAndGoRegister() {
  showModal.value = false
}
</script>

<template>
  <UModal
    v-model:open="showModal"
    :description="modalDescription"
    :ui="{
      content: 'max-w-md border border-gray-800 bg-gray-950 shadow-2xl shadow-primary-950/40 sm:max-w-lg'
    }"
  >
    <template #title>
      <span class="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
        Register your interest
      </span>
    </template>

    <template #body>
      <p class="text-center text-lg font-black uppercase leading-snug tracking-wide text-primary-400 sm:text-xl">
        If you don’t register, you don’t come.
      </p>
      <p class="mt-3 text-center text-sm text-gray-400">
        No list, no ticket, NO ENTRY. Drop your details below.
      </p>

      <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          class="justify-center"
          @click="showModal = false"
        >
          Maybe later
        </UButton>
        <UButton
          to="#register"
          color="primary"
          size="lg"
          class="justify-center font-bold"
          @click="closeAndGoRegister"
        >
          Register interest
        </UButton>
      </div>
    </template>
  </UModal>
</template>
