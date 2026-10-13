import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LANGS } from '../i18n/translate';
import { useApp } from './AppContext';
import { ScreenHeader } from './ScreenHeader';
import { Tile } from './tile/Tile';

function Segmented<V extends string | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const { settings, updateSettings, storageOk, resetProgress } = useApp();
  const [resetState, setResetState] = useState<'idle' | 'confirm' | 'done'>('idle');

  return (
    <main className="screen">
      <ScreenHeader title={t('settings.title')} onBack={onBack} />

      <section className="settings-group">
        <h2>{t('settings.language')}</h2>
        <Segmented
          label={t('settings.language')}
          value={settings.lang}
          options={LANGS.map((lang) => ({ value: lang, label: t(`language.${lang}`) }))}
          onChange={(lang) => updateSettings({ lang })}
        />
      </section>

      <section className="settings-group">
        <h2>{t('settings.tileHints')}</h2>
        <p className="settings-desc">{t('settings.tileHintsDesc')}</p>
        <div className="settings-row">
          <Segmented
            label={t('settings.tileHints')}
            value={settings.tileHints}
            options={[
              { value: true, label: t('settings.on') },
              { value: false, label: t('settings.off') },
            ]}
            onChange={(tileHints) => updateSettings({ tileHints })}
          />
          <span className="settings-preview">
            {(['3m', '7p', '1z', '6z'] as const).map((tile) => (
              <Tile key={tile} tile={tile} width="44px" />
            ))}
          </span>
        </div>
      </section>

      <section className="settings-group">
        <h2>{t('settings.gameHints')}</h2>
        <p className="settings-desc">{t('settings.gameHintsDesc')}</p>
        <Segmented
          label={t('settings.gameHints')}
          value={settings.gameHints}
          options={[
            { value: true, label: t('settings.on') },
            { value: false, label: t('settings.off') },
          ]}
          onChange={(gameHints) => updateSettings({ gameHints })}
        />
      </section>

      <section className="settings-group">
        <h2>{t('settings.progress')}</h2>
        {resetState === 'idle' && (
          <button className="btn" onClick={() => setResetState('confirm')}>
            {t('settings.resetProgress')}
          </button>
        )}
        {resetState === 'confirm' && (
          <div className="confirm-box">
            <p>{t('settings.resetConfirm')}</p>
            <div className="button-row">
              <button
                className="btn btn-danger"
                onClick={() => {
                  resetProgress();
                  setResetState('done');
                }}
              >
                {t('settings.resetYes')}
              </button>
              <button className="btn" onClick={() => setResetState('idle')}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
        {resetState === 'done' && <p className="notice">{t('settings.resetDone')}</p>}
      </section>

      {!storageOk && <p className="notice">{t('settings.storageUnavailable')}</p>}
    </main>
  );
}
