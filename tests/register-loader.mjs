import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./svelte-loader.mjs', pathToFileURL('./tests/'));
