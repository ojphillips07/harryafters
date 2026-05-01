import { d as defineEventHandler } from '../../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

const webhook_post = defineEventHandler(async (event) => {
  return { received: true };
});

export { webhook_post as default };
//# sourceMappingURL=webhook.post.mjs.map
