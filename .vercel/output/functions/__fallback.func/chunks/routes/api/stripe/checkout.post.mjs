import { d as defineEventHandler, c as createError } from '../../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const checkout_post = defineEventHandler(async (event) => {
  throw createError({
    statusCode: 403,
    statusMessage: "Tickets are not on sale yet. Please register your interest on the home page."
  });
});

export { checkout_post as default };
//# sourceMappingURL=checkout.post.mjs.map
