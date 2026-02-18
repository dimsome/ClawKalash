#!/usr/bin/env node

/**
 * ClawKalash CLI
 * Economic sovereignty for AI agents. Served on a stick.
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
await import(join(__dirname, '..', 'dist', 'cli.js'));
