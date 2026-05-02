<script setup lang="ts">
function getRegisterErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>
    const data = e.data as Record<string, unknown> | undefined
    const msg
      = (data?.statusMessage as string | undefined)
        || (data?.message as string | undefined)
        || (e.statusMessage as string | undefined)
        || (e.message as string | undefined)
    if (msg && typeof msg === 'string') return msg
  }
  return 'Something went wrong. Please try again.'
}

const registered = ref(false)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const alreadyRegistered = ref(false)

const form = reactive({
  name: '',
  email: '',
  /* Honeypot — must stay empty. Obscure name so browsers don’t autofill it. */
  fax_extension: ''
})

const onRegister = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    const result = await $fetch<{ ok: boolean; alreadyRegistered: boolean }>(
      '/api/register-interest',
      {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          fax_extension: form.fax_extension
        }
      }
    )
    alreadyRegistered.value = result.alreadyRegistered
    registered.value = true
  } catch (err: unknown) {
    errorMessage.value = getRegisterErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const galleryImages = [
  { src: '/images/venue-pergola.png', alt: 'Garden pergola at dusk, warmly lit' },
  { src: '/images/venue-cabin.png', alt: 'Harry’s garden cabin at night with lights on' },
  { src: '/images/venue-lawn.png', alt: 'Lawns and trees at Harry’s after dark' }
] as const
</script>

<template>
  <div class="relative overflow-clip bg-gray-950">
    <!-- Background glows: keep inside layout box (no negative offsets) so they don’t extend document scroll past the footer -->
    <div
      class="pointer-events-none absolute -left-[20%] -top-[20%] h-[60%] w-[60%] bg-primary-500/10 blur-[120px] rounded-full"
    />
    <div
      class="pointer-events-none absolute -right-[20%] -bottom-[20%] h-[60%] w-[60%] bg-accent-500/10 blur-[120px] rounded-full"
    />

    <!-- Hero Section -->
    <section class="relative isolate flex min-h-hero items-center py-16 sm:py-20">
      <!-- Outside hero image (pre-rotated + optimized) -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <picture>
          <source srcset="/images/hero-venue.webp" type="image/webp">
          <img
            src="/images/hero-venue.jpg"
            alt="Harry’s garden cabin at night, lit up for the after party"
            class="absolute inset-0 h-full w-full object-cover object-[50%_55%]"
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

          <HeroRollingCube />

          <p class="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-4 leading-relaxed">
            <span class="font-semibold"><EventBrandName typography="inherit" stable /></span> is gonna be sick — everyone’s gonna be there.
            <span class="block mt-2 font-semibold text-white">Fairfax Year 13 Prom After Party.</span>
          </p>
          <p class="text-base md:text-lg text-primary-200/95 max-w-xl mx-auto mb-10 leading-snug">
            Planning on coming? <span class="font-semibold text-white">Register your interest</span> — it’s how you’ll get access to a ticket when they go on sale.
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
            We’re taking over Harry’s — lights, music, and drinks. Ticket money goes towards setup (lights, sound, cleanup, etc.); anything left over gets spent on <span class="text-gray-200 font-medium">free drinks</span> on the night. We’re operating <span class="text-gray-200 font-medium">bring your own drinks (BYOB)</span> too — bring what you want to sip, and we’ll put the cash towards running the party and extra free pours where we can.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 glow-box">
              <UIcon name="i-lucide-users" class="w-8 h-8 text-primary-500 mb-4" />
              <h3 class="font-bold mb-2">Everyone's Invited</h3>
              <p class="text-sm text-gray-500">The whole of Year 13 — one last big night at Harry’s.</p>
            </div>
            <div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 glow-box">
              <UIcon name="i-lucide-beer" class="w-8 h-8 text-accent-500 mb-4" />
              <h3 class="font-bold mb-2">BYOB</h3>
              <p class="text-sm text-gray-500">Bring your own drinks. Ticket cash covers setup; surplus goes on free drinks.</p>
            </div>
          </div>
        </div>
        
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <img
            src="/images/venue-pergola.png"
            alt="Garden pergola and seating at Harry’s"
            class="relative rounded-3xl object-cover aspect-video shadow-2xl"
            loading="lazy"
            decoding="async"
          >
        </div>
      </div>
    </section>

    <!-- Pricing / Non-Profit Section -->
    <section class="py-24 bg-gray-900/30 border-y border-gray-900">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">Not asking for much</h2>
        <div class="p-8 rounded-3xl bg-gray-950 border border-primary-500/20 glow-box">
          <p class="text-xl md:text-2xl font-medium mb-4">Tickets will be around <span class="text-primary-500 font-black">£5–£6</span></p>
          <p class="text-gray-400 leading-relaxed">
            We’re taking over Harry’s — lights, music, and drinks. Everything from ticket sales goes towards <span class="text-white font-semibold">setup</span>: lights, sound, cleanup, etc.
            <span class="text-white font-semibold"> Any money left after that goes on free drinks</span> for everyone on the night.
          </p>
          <p class="mt-4 text-gray-400 leading-relaxed">
            <span class="text-white font-semibold">Bring your own drinks (BYOB)</span> — that’s how we’re running it. Bring what you want; we’re not trying to profit, just cover the party and stretch to free drinks where we can.
          </p>
          <p class="mt-6 text-sm text-gray-500 leading-relaxed border-t border-gray-800 pt-6">
            Tickets won’t be sold blindly — <span class="text-gray-300">register your interest</span> so we know you’re coming and can reach you when it’s time to buy.
          </p>
        </div>
      </div>
    </section>

    <!-- Registration Section -->
    <section id="register" class="py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div class="text-center mb-12 space-y-4">
        <h2 class="text-4xl font-black mb-2">REGISTER YOUR INTEREST</h2>
        <p class="text-lg text-gray-100 font-medium max-w-2xl mx-auto">
          If you plan on attending, you need to register here — this list is how we’ll contact you when tickets go live. Skip this step and you risk missing out.
        </p>
        <p class="text-gray-400">
          For <span class="font-semibold text-gray-200"><EventBrandName typography="inherit" /></span>. Right now you can only register interest — tickets <span class="text-white font-semibold">aren’t on sale yet</span>.
          The more people who sign up, the more likely we can make it happen.
        </p>
      </div>

      <div v-if="!registered" class="p-8 rounded-3xl bg-gray-900/50 border border-gray-800">
        <form @submit.prevent="onRegister" class="space-y-6">
          <UFormField label="Full Name" name="name">
            <UInput v-model="form.name" placeholder="John Doe" size="xl" class="w-full" required />
          </UFormField>

          <UFormField label="Email" name="email">
            <UInput v-model="form.email" type="email" placeholder="you@example.com" size="xl" class="w-full" required />
          </UFormField>

          <!-- Honeypot: hidden from real users, filled by bots. -->
          <div aria-hidden="true" class="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
            <label>
              Leave this field empty
              <input
                v-model="form.fax_extension"
                type="text"
                name="fax_extension"
                tabindex="-1"
                autocomplete="off"
              >
            </label>
          </div>

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

          <p v-if="errorMessage" class="text-sm text-red-400 text-center" role="alert">
            {{ errorMessage }}
          </p>
        </form>
      </div>

      <div v-else class="p-12 rounded-3xl bg-primary-500/10 border border-primary-500/20 text-center animate-in fade-in zoom-in duration-500">
        <UIcon name="i-lucide-check-circle" class="w-16 h-16 text-primary-500 mx-auto mb-4" />
        <h3 class="text-2xl font-bold mb-2">
          {{ alreadyRegistered ? 'Already on the list' : "You're on the list!" }}
        </h3>
        <p class="text-gray-400">
          <template v-if="alreadyRegistered">
            We already had {{ form.email }} down. You’re good — we’ll email you when <EventBrandName typography="inherit" /> tickets go on sale.
          </template>
          <template v-else>
            Thanks {{ form.name.split(' ')[0] }}! You’re on the list for ticket updates — we’ll email {{ form.email }} when <EventBrandName typography="inherit" /> tickets go on sale.
          </template>
        </p>
        <UButton variant="ghost" class="mt-6" @click="registered = false">Back</UButton>
      </div>
    </section>

    <!-- Gallery Section -->
    <section class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h2 class="text-3xl font-bold mb-12 text-center">The Gaff</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="img in galleryImages" :key="img.src" class="relative group overflow-hidden rounded-2xl aspect-square">
          <img
            :src="img.src"
            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            :alt="img.alt"
            loading="lazy"
            decoding="async"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      <figure class="mx-auto mt-16 flex max-w-xs flex-col items-center text-center sm:max-w-sm">
        <figcaption class="mb-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          The Gaffa
        </figcaption>
        <img
          src="/images/the-gaffa.png"
          alt=""
          class="aspect-square w-full rounded-2xl border border-gray-800 object-cover shadow-xl"
          loading="lazy"
          decoding="async"
        >
      </figure>
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

</style>
