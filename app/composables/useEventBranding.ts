export function useEventBranding() {
  const showTheAfters = useState('afters-brand-toggle', () => true)

  const eventName = computed(() =>
    showTheAfters.value ? 'The Afters' : 'Afters at Harry\'s'
  )

  return { showTheAfters, eventName }
}
