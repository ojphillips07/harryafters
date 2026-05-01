export default defineEventHandler(async (event) => {
  // TODO: Implement Stripe Checkout session creation
  // This is currently disabled during the "Interest Phase"
  
  throw createError({
    statusCode: 403,
    statusMessage: 'Tickets are not on sale yet. Please register your interest on the home page.'
  })
})
