export default defineNuxtPlugin(() => {
  const showTheAfters = useState('afters-brand-toggle', () => true)

  const intervalMs = 4500
  globalThis.setInterval(() => {
    showTheAfters.value = !showTheAfters.value
  }, intervalMs)
})
