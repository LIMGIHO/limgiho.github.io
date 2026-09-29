import { mountPortal } from './portal.mjs';
import { mountResumeNav } from './resume-nav.mjs';
const byId = id => document.getElementById(id);
mountPortal({ track: byId('portal-track'), stage: byId('portal-stage'), canvas: byId('portrait-canvas'),
  pause: byId('pause'), clear: byId('clear'), status: byId('status'), enter: byId('enter'), back: byId('back'),
  inside: byId('inside'), insideHeading: byId('inside-heading') });
mountResumeNav({nav:document.querySelector('.resume-nav'),container:document.querySelector('.resume-surface')});
