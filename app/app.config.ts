export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    /* Default slot is empty; hide center column so the footer row doesn’t reserve a blank flex slot */
    footer: {
      slots: {
        center: 'hidden'
      }
    }
  }
})
