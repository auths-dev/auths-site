/**
 * prismjs grammar components install themselves onto a global `Prism` — point
 * that global at prism-react-renderer's instance BEFORE any grammar import.
 * (ESM evaluates imports in order, so import this module first.)
 */
import { Prism } from 'prism-react-renderer';

(globalThis as { Prism?: unknown }).Prism = Prism;
