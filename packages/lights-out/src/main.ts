import { createHeader } from '@sourceplay/shared';

function init(): void {
  createHeader({ showBackButton: true });
  console.log('Lights Out Game Initialized');
}

document.addEventListener('DOMContentLoaded', init);
