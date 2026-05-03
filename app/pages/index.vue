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
/** True only when Resend accepted the confirmation send (same request). */
const confirmationEmailed = ref(false)
/** When email was not sent for a new signup, server hint (e.g. unverified domain). */
const confirmationEmailIssue = ref<string | null>(null)

const form = reactive({
  name: '',
  email: '',
  /* Honeypot — must stay empty. Obscure name so browsers don’t autofill it. */
  fax_extension: ''
})

const onRegister = async () => {
  loading.value = true
  errorMessage.value = null
  confirmationEmailed.value = false
  confirmationEmailIssue.value = null
  try {
    const result = await $fetch<{
      ok: boolean
      alreadyRegistered: boolean
      confirmationEmailed: boolean
      confirmationEmailIssue: string | null
    }>(
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
    confirmationEmailed.value = result.confirmationEmailed
    confirmationEmailIssue.value = result.confirmationEmailIssue
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
          <div class="mb-6 flex flex-wrap items-center justify-center gap-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium backdrop-blur">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Registration Open
            </div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-950/40 border border-white/15 text-gray-200 text-sm font-semibold backdrop-blur">
              <span class="inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
              <span><span class="text-white font-black">25 June</span> · Starts <span class="text-white font-black">10pm</span></span>
            </div>
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

      <div class="mt-20 pt-16 border-t border-gray-800">
        <div class="text-center lg:text-left max-w-3xl mx-auto lg:mx-0 mb-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium mb-4">
            <UIcon name="i-lucide-disc-3" class="w-4 h-4" />
            Music
          </div>
          <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">
            MC Cal on the decks
          </h3>
          <p class="text-lg text-gray-400 leading-relaxed">
            The plan is for <span class="text-white font-semibold">MC Cal</span> to kickstart the party with a set, then music is open to requests.
          </p>
        </div>
        <div class="mc-dj-grid grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          <figure class="mc-dj-frame mc-dj-frame--1 group relative [perspective:900px]">
            <div class="mc-dj-frame__float relative will-change-transform">
              <div class="mc-dj-frame__inner relative overflow-hidden rounded-2xl border border-gray-800/90 shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/5 aspect-[4/3] bg-gray-900 transition-shadow duration-500 group-hover:shadow-[0_24px_60px_rgba(236,72,153,0.18)] group-hover:border-primary-500/30">
                <img
                  src="/images/mc-cal-dj-1.png"
                  alt="MC Cal at the decks, mixing on a controller at a party"
                  class="mc-dj-frame__img h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                  loading="lazy"
                  decoding="async"
                >
                <div
                  class="mc-dj-frame__shine pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
            </div>
          </figure>
          <figure class="mc-dj-frame mc-dj-frame--2 group relative [perspective:900px]">
            <div class="mc-dj-frame__float relative will-change-transform">
              <div class="mc-dj-frame__inner relative overflow-hidden rounded-2xl border border-gray-800/90 shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/5 aspect-[4/3] bg-gray-900 transition-shadow duration-500 group-hover:shadow-[0_24px_60px_rgba(236,72,153,0.18)] group-hover:border-primary-500/30">
                <img
                  src="/images/mc-cal-dj-2.png"
                  alt="MC Cal behind the DJ booth, pointing at the crowd"
                  class="mc-dj-frame__img h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                  loading="lazy"
                  decoding="async"
                >
                <div
                  class="mc-dj-frame__shine pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
            </div>
          </figure>
          <figure class="mc-dj-frame mc-dj-frame--3 group relative [perspective:900px]">
            <div class="mc-dj-frame__float relative will-change-transform">
              <div class="mc-dj-frame__inner relative overflow-hidden rounded-2xl border border-gray-800/90 shadow-[0_16px_48px_rgba(0,0,0,0.45)] ring-1 ring-white/5 aspect-[4/3] bg-gray-900 transition-shadow duration-500 group-hover:shadow-[0_24px_60px_rgba(236,72,153,0.18)] group-hover:border-primary-500/30">
                <img
                  src="/images/mc-cal-dj-3.png"
                  alt="MC Cal DJing outdoors under a canopy at night"
                  class="mc-dj-frame__img h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.08] group-hover:brightness-110"
                  loading="lazy"
                  decoding="async"
                >
                <div
                  class="mc-dj-frame__shine pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
            </div>
          </figure>
        </div>

        <a
          href="https://soundcloud.com/user-205056444"
          target="_blank"
          rel="noopener noreferrer"
          class="group relative mt-10 flex max-w-2xl mx-auto flex-col gap-5 overflow-hidden rounded-3xl border border-orange-500/35 bg-gradient-to-br from-gray-900/95 via-[#140905] to-gray-950 px-6 py-6 shadow-[0_0_48px_rgba(255,85,0,0.14)] transition hover:border-orange-400/55 hover:shadow-[0_0_60px_rgba(255,85,0,0.22)] sm:flex-row sm:items-center sm:justify-between sm:gap-8"
        >
          <div class="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#FF5500]/15 blur-3xl" />
          <div class="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-primary-500/10 blur-3xl" />
          <div class="relative flex items-center gap-4 min-w-0">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FF5500]/20 ring-1 ring-[#FF5500]/40">
              <UIcon name="i-simple-icons-soundcloud" class="h-9 w-9 text-[#FF5500]" />
            </div>
            <div class="text-left min-w-0">
              <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400/90">
                MC Cal on SoundCloud
              </p>
              <p class="font-[family-name:Bebas_Neue,sans-serif] text-3xl tracking-wide text-white group-hover:text-orange-100 transition-colors">
                Go listen now
              </p>
              <p class="text-sm text-gray-500">
                Opens in a new tab
              </p>
            </div>
          </div>
          <div class="relative flex items-center justify-between gap-6 sm:justify-end sm:shrink-0">
            <div class="mc-eq flex h-12 items-end gap-1.5" aria-hidden="true">
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
              <span class="mc-eq__bar rounded-full bg-gradient-to-t from-[#FF5500] to-orange-300" />
            </div>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="h-7 w-7 shrink-0 text-orange-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </a>
      </div>
    </section>

    <!-- Pricing / Non-Profit Section -->
    <section class="py-24 bg-gray-900/30 border-y border-gray-900">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">Not asking for much</h2>
        <div class="p-8 rounded-3xl bg-gray-950 border border-primary-500/20 glow-box">
          <p class="text-xl md:text-2xl font-medium mb-4">Tickets are <span class="text-primary-500 font-black">£6.30</span> total <span class="text-gray-500 text-lg font-normal">(including a separate card/booking fee)</span></p>
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
            Thanks {{ form.name.split(' ')[0] }}! You’re on the list for ticket updates.
            <span v-if="confirmationEmailed" class="block mt-3 text-gray-300">
              We’ve sent a confirmation to <span class="text-white font-semibold">{{ form.email }}</span> — check inbox and spam. We’ll use the same address when <EventBrandName typography="inherit" /> tickets go on sale.
            </span>
            <span v-else class="block mt-3 text-gray-300">
              We’ll email <span class="text-white font-semibold">{{ form.email }}</span> when <EventBrandName typography="inherit" /> tickets go on sale.
            </span>
          </template>
        </p>
        <div
          v-if="!alreadyRegistered && !confirmationEmailed && confirmationEmailIssue"
          class="mt-5 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-100"
        >
          <p class="font-semibold text-amber-50">
            Confirmation email wasn’t sent
          </p>
          <p v-if="confirmationEmailIssue === 'missing_api_key'" class="mt-1 text-amber-100/90">
            The server doesn’t have <code class="text-amber-200">NUXT_RESEND_API_KEY</code> set (or the deploy wasn’t restarted after adding it).
          </p>
          <p v-else-if="confirmationEmailIssue === 'missing_from'" class="mt-1 text-amber-100/90">
            Set <code class="text-amber-200">NUXT_RESEND_FROM</code> to a verified sender, e.g.
            <code class="text-amber-200">Harry Afters &lt;hello@send.yourdomain&gt;</code> — it must match a domain you’ve verified in Resend.
          </p>
          <p v-else class="mt-1 text-amber-100/90 break-words">
            {{ confirmationEmailIssue }}
          </p>
        </div>
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

/* MC Cal photo strip — stagger in, float, hover tilt + shine */
.mc-dj-frame {
  transform-style: preserve-3d;
}

.mc-dj-frame__inner {
  animation: mc-dj-debut 1.05s cubic-bezier(0.22, 1, 0.36, 1) backwards;
}

.mc-dj-frame--1 .mc-dj-frame__inner {
  animation-delay: 0.06s;
}

.mc-dj-frame--2 .mc-dj-frame__inner {
  animation-delay: 0.18s;
}

.mc-dj-frame--3 .mc-dj-frame__inner {
  animation-delay: 0.32s;
}

.mc-dj-frame--1 .mc-dj-frame__float {
  animation: mc-dj-float-a 5.8s ease-in-out infinite;
}

.mc-dj-frame--2 .mc-dj-frame__float {
  animation: mc-dj-float-b 6.4s ease-in-out 0.35s infinite;
}

.mc-dj-frame--3 .mc-dj-frame__float {
  animation: mc-dj-float-a 5.2s ease-in-out 0.7s infinite reverse;
}

.mc-dj-frame.group:hover .mc-dj-frame__float {
  animation: none !important;
  transform: translateY(-12px) rotateY(-4deg) rotateX(2deg) scale(1.03);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.mc-dj-frame__shine {
  mix-blend-mode: overlay;
  background: linear-gradient(
    100deg,
    transparent 35%,
    rgba(255, 255, 255, 0.18) 48%,
    rgba(236, 72, 153, 0.25) 52%,
    transparent 65%
  );
  background-size: 220% 100%;
  background-position: 100% 0;
}

.mc-dj-frame.group:hover .mc-dj-frame__shine {
  animation: mc-dj-shine-bg 0.95s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

@keyframes mc-dj-debut {
  from {
    opacity: 0.72;
    transform: translateY(36px) scale(0.93) rotateX(10deg);
    filter: blur(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0);
    filter: blur(0);
  }
}

@keyframes mc-dj-float-a {
  0%,
  100% {
    transform: translateY(0) rotate(-0.6deg);
  }

  50% {
    transform: translateY(-11px) rotate(0.75deg);
  }
}

@keyframes mc-dj-float-b {
  0%,
  100% {
    transform: translateY(0) rotate(0.5deg);
  }

  50% {
    transform: translateY(-13px) rotate(-0.85deg);
  }
}

@keyframes mc-dj-shine-bg {
  from {
    background-position: 100% 0;
    opacity: 0;
  }

  25% {
    opacity: 1;
  }

  to {
    background-position: 0% 0;
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mc-dj-frame__inner,
  .mc-dj-frame--1 .mc-dj-frame__float,
  .mc-dj-frame--2 .mc-dj-frame__float,
  .mc-dj-frame--3 .mc-dj-frame__float {
    animation: none !important;
  }

  .mc-dj-frame.group:hover .mc-dj-frame__float {
    transform: none !important;
  }

  .mc-dj-frame.group:hover .mc-dj-frame__shine {
    animation: none !important;
  }
}

.mc-eq__bar {
  width: 0.35rem;
  height: 2.5rem;
  transform-origin: bottom center;
  animation: mc-eq-bounce 0.85s ease-in-out infinite alternate;
}

.mc-eq__bar:nth-child(1) {
  animation-delay: 0s;
}

.mc-eq__bar:nth-child(2) {
  animation-delay: 0.12s;
}

.mc-eq__bar:nth-child(3) {
  animation-delay: 0.24s;
}

.mc-eq__bar:nth-child(4) {
  animation-delay: 0.08s;
}

.mc-eq__bar:nth-child(5) {
  animation-delay: 0.2s;
}

.mc-eq__bar:nth-child(6) {
  animation-delay: 0.16s;
}

.mc-eq__bar:nth-child(7) {
  animation-delay: 0.04s;
}

@keyframes mc-eq-bounce {
  from {
    transform: scaleY(0.25);
    opacity: 0.65;
  }

  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

</style>
