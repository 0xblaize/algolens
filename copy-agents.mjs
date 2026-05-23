import { copyFileSync } from 'fs';
import { join } from 'path';

const src = 'C:/Users/USER/.gemini/antigravity/brain/dfae1f1e-4ef7-47b5-a4f2-df7687c6d117';
const dest = 'C:/Users/USER/agrolens/public';

copyFileSync(join(src, 'agent_bull_argus_1779503969500.png'), join(dest, 'agent-bull.png'));
copyFileSync(join(src, 'agent_bear_skeptic_1779503986554.png'), join(dest, 'agent-bear.png'));
copyFileSync(join(src, 'agent_judge_magistrate_1779504000400.png'), join(dest, 'agent-judge.png'));

console.log('✅ Agent avatars copied to public/');
