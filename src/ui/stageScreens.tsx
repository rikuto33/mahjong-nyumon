import type { ComponentType } from 'react';
import type { StageId, StagePart } from '../tutorial/stages';
import { IntroPlay } from './intro/IntroPlay';
import { Stage1Guided } from './tiles/Stage1Guided';
import { Stage1Quiz } from './tiles/Stage1Quiz';
import { Stage2Guided } from './shape/Stage2Guided';
import { Stage2Practice } from './shape/Stage2Practice';
import { Stage3Guided } from './solo/Stage3Guided';
import { Stage3Game } from './solo/Stage3Game';
import { Stage4Guided } from './tenpai/Stage4Guided';
import { Stage4Quiz } from './tenpai/Stage4Quiz';
import { Stage5Guided } from './yakuLesson/Stage5Guided';
import { Stage5Quiz } from './yakuLesson/Stage5Quiz';
import { Stage6Guided } from './ron/Stage6Guided';
import { Stage6Quiz } from './ron/Stage6Quiz';
import { Stage7Guided } from './calls/Stage7Guided';
import { Stage7Quiz } from './calls/Stage7Quiz';
import { Stage8Guided } from './dora/Stage8Guided';
import { Stage8Quiz } from './dora/Stage8Quiz';
import { Stage9Guided } from './flow/Stage9Guided';
import { StrategyScenarios } from './strategy/StrategyScenarios';
import { Stage10Tour } from './finale/Stage10Tour';
import { Stage10Game } from './finale/Stage10Game';

/** onDone：ステージ画面に戻る、onNext：次にやるべき画面へ進む */
type Screen = ComponentType<{ onDone: () => void; onNext: () => void }>;

/** 段階の各部分の画面（説明 explain は共通の ExplainScreen） */
export const STAGE_SCREENS: Record<StageId, Partial<Record<StagePart, Screen>>> = {
  intro: { play: IntroPlay },
  tiles: { guided: Stage1Guided, practice: Stage1Quiz },
  shape: { guided: Stage2Guided, practice: Stage2Practice },
  solo: { guided: Stage3Guided, practice: Stage3Game },
  tenpai: { guided: Stage4Guided, practice: Stage4Quiz },
  yaku: { guided: Stage5Guided, practice: Stage5Quiz },
  ron: { guided: Stage6Guided, practice: Stage6Quiz },
  calls: { guided: Stage7Guided, practice: Stage7Quiz },
  dora: { guided: Stage8Guided, practice: Stage8Quiz },
  flow: { guided: Stage9Guided },
  strategy: { scenarios: StrategyScenarios },
  finale: { guided: Stage10Tour, practice: Stage10Game },
};
