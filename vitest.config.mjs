import { defineConfig } from 'vitest/config';

/* Agenternas worktrees ligger under .claude/worktrees/ inne i repot. Utan
   detta undantag kor vitest deras testfiler ocksa - 360 tester i stallet
   for repots egna, och en agent mitt i en rod fas skulle falla sviten har. */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.mjs'],
    exclude: ['**/node_modules/**', '**/.claude/**'],
  },
});
