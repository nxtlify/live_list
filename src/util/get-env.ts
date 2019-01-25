import { fromNullable } from 'fp-ts/lib/Option';

export const getEnv = (name: string) => fromNullable(process.env[name]);
