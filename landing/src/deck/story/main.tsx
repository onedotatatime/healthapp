import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '../deck.css';
import './story.css';
import { StoryDeck } from './StoryDeck';
import { storySlides } from '../slides.story';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoryDeck slides={storySlides} />
  </StrictMode>
);
