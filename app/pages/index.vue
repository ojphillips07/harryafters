<script setup lang="ts">
const { brandIndex } = useEventBranding()

const registered = ref(false)
const loading = ref(false)

const form = reactive({
  name: '',
  email: ''
})

const onRegister = async () => {
  loading.value = true
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000))
  loading.value = false
  registered.value = true
}

const galleryImages = [
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=800'
]
</script>

<template>
  <div class="relative overflow-x-hidden bg-gray-950 min-h-screen">
    <!-- Background Glows -->
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full" />
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 blur-[120px] rounded-full" />

    <!-- Hero Section -->
    <section class="relative isolate flex min-h-hero items-center py-16 sm:py-20">
      <!-- Outside hero image (pre-rotated + optimized) -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <picture>
          <source srcset="/images/hero-outside.webp" type="image/webp">
          <img
            src="/images/hero-outside.jpg"
            alt="A field at sunset"
            class="absolute inset-0 h-full w-full object-cover object-[50%_80%]"
            decoding="async"
            fetchpriority="high"
          >
        </picture>

        <div class="absolute inset-0 bg-gradient-to-b from-gray-950/25 via-gray-950/55 to-gray-950/95" />
        <div class="absolute inset-0 bg-gradient-to-r from-primary-500/15 via-transparent to-accent-500/15" />
        <div class="absolute inset-0 hero-grain opacity-25 mix-blend-overlay" />
      </div>

      <div class="w-full px-4 sm:px-6 lg:px-10">
        <div class="max-w-4xl mx-auto text-center">
          <div class="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium backdrop-blur">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Registration Open
          </div>

          <div class="hero-brand-slot mb-6">
            <Transition name="brand-fade" mode="out-in">
              <div
                :key="brandIndex"
                class="hero-brand-layer hero-brand-size"
              >
                <EventBrandName typography="hero" />
              </div>
            </Transition>
          </div>

          <p class="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            <span class="font-semibold"><EventBrandName typography="inherit" /></span> is gonna be sick — everyone’s gonna be there.
            <span class="block mt-2 font-semibold text-white">Fairfax Year 13 Prom After Party.</span>
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <UButton
              to="#register"
              size="xl"
              color="primary"
              class="px-8 py-4 font-bold text-lg rounded-2xl transition-transform hover:scale-105"
            >
              Register Interest
            </UButton>
            <UButton
              to="#what-is-it"
              size="xl"
              variant="ghost"
              color="neutral"
              class="px-8 py-4 font-bold text-lg rounded-2xl backdrop-blur bg-gray-950/10 border border-white/10"
            >
              Learn More
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Info Section -->
    <section id="what-is-it" class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-8">
          <h2 class="text-3xl md:text-4xl font-bold">
            What is <EventBrandName typography="inherit" />?
          </h2>
          <p class="text-lg text-gray-400 leading-relaxed">
            It's the only way to end prom night. We're taking over a field, setting up the lights, and keeping the energy high until the sun comes up. 
          </p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 glow-box">
              <UIcon name="i-lucide-users" class="w-8 h-8 text-primary-500 mb-4" />
              <h3 class="font-bold mb-2">Everyone's Invited</h3>
              <p class="text-sm text-gray-500">The whole of Year 13 coming together for one last night.</p>
            </div>
            <div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 glow-box">
              <UIcon name="i-lucide-heart" class="w-8 h-8 text-accent-500 mb-4" />
              <h3 class="font-bold mb-2">Non-Profit</h3>
              <p class="text-sm text-gray-500">Every penny goes into the party or free drinks for you.</p>
            </div>
          </div>
        </div>
        
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <img 
            src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200" 
            alt="Party vibes" 
            class="relative rounded-3xl object-cover aspect-video shadow-2xl"
          />
        </div>
      </div>
    </section>

    <!-- Pricing / Non-Profit Section -->
    <section class="py-24 bg-gray-900/30 border-y border-gray-900">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">Keeping it Real</h2>
        <div class="p-8 rounded-3xl bg-gray-950 border border-primary-500/20 glow-box">
          <p class="text-xl md:text-2xl font-medium mb-4">Tickets will be around <span class="text-primary-500 font-black">£5–£6</span></p>
          <p class="text-gray-400 leading-relaxed">
            We're not here to make money. All revenue goes towards setup costs (generators, lights, sound, etc.). 
            <span class="text-white font-semibold">Any excess money will be spent on free drinks for everyone.</span>
          </p>
        </div>
      </div>
    </section>

    <!-- Registration Section -->
    <section id="register" class="py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h2 class="text-4xl font-black mb-4">REGISTER YOUR INTEREST</h2>
        <p class="text-gray-400 mb-2">
          For <span class="font-semibold"><EventBrandName typography="inherit" /></span> — tell us you’re in.
        </p>
        <p class="text-gray-400">
          At the moment you can <span class="text-white font-bold">ONLY</span> register interest. Tickets are <span class="text-white font-bold">NOT</span> on sale yet. 
          The more people who sign up, the more likely we can make it happen.
        </p>
      </div>

      <div v-if="!registered" class="p-8 rounded-3xl bg-gray-900/50 border border-gray-800">
        <form @submit.prevent="onRegister" class="space-y-6">
          <UFormField label="Full Name" name="name">
            <UInput v-model="form.name" placeholder="John Doe" size="xl" class="w-full" required />
          </UFormField>
          
          <UFormField label="School Email" name="email">
            <UInput v-model="form.email" type="email" placeholder="student@fairfax.school" size="xl" class="w-full" required />
          </UFormField>

          <UButton
            type="submit"
            size="xl"
            color="primary"
            block
            :loading="loading"
            class="font-bold py-4 rounded-2xl"
          >
            Count Me In
          </UButton>
        </form>
      </div>

      <div v-else class="p-12 rounded-3xl bg-primary-500/10 border border-primary-500/20 text-center animate-in fade-in zoom-in duration-500">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 text-primary-500 mx-auto mb-4" />
        <h3 class="text-2xl font-bold mb-2">You're on the list!</h3>
        <p class="text-gray-400">
          Thanks {{ form.name.split(' ')[0] }}! We'll email you at {{ form.email }} as soon as tickets go live for <EventBrandName typography="inherit" />.
        </p>
        <UButton variant="ghost" class="mt-6" @click="registered = false">Back</UButton>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 class="text-3xl font-bold mb-12 text-center">The Vibe</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div v-for="(img, i) in galleryImages" :key="i" class="relative group overflow-hidden rounded-2xl aspect-square">
          <img 
            :src="img" 
            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            alt="Prom afters vibe"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
    </section>

    <!-- Stripe Skeleton (Hidden/Disabled) -->
    <div class="hidden">
      <!-- 
        Future Stripe Integration:
        - Checkout session creation in /server/api/stripe/checkout.post.ts
        - Webhook handling in /server/api/stripe/webhook.post.ts
        - Disabled until interest phase is complete.
      -->
    </div>

    <!-- Floating CTA -->
    <div class="fixed bottom-4 right-4 z-50">
      <UButton
        to="#register"
        color="primary"
        size="lg"
        icon="i-lucide-arrow-down-right"
        class="rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/35 border border-white/10"
      >
        Register interest
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.glow-text {
  text-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
}

.hero-grain {
  background-image:
    radial-gradient(circle at 20% 10%, rgba(255, 255, 255, 0.10), transparent 55%),
    radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.06), transparent 60%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 3px);
}

.brand-fade-enter-active,
.brand-fade-leave-active {
  transition: opacity 0.35s ease;
}

.brand-fade-enter-from,
.brand-fade-leave-to {
  opacity: 0;
}
</style>
