import React from 'react';
import { useLanguage } from '../../vrc-frontend/context/LanguageContext.tsx';
import { Loading } from '../../vrc-frontend/common-component/index.ts';
import { pullRefreshBarStyles as s } from './PullRefreshBar.styles.ts';

interface PullRefreshBarProps {
  pullDistance: number;
  isPullRefreshing: boolean;
}

// Pull-to-refresh bar: the shared Loading (spinner + refresh text)
// shown in the gap below the header as the content slides down. The
// text follows the pull: pull -> release -> refreshing. Renders
// nothing when the user is not pulling and no refresh is running.
export const PullRefreshBar: React.FC<PullRefreshBarProps> = ({ pullDistance, isPullRefreshing }) => {
  const { t } = useLanguage();

  if (pullDistance <= 0 && !isPullRefreshing) return null;

  return (
    <div
      className={s.pullRefreshBar}
      style={{ opacity: Math.min(pullDistance / 30, 1) }}
      aria-hidden="true"
    >
      <Loading
        text={
          isPullRefreshing
            ? t('refreshing')
            : pullDistance >= 70
              ? t('releaseToRefresh')
              : t('pullToRefresh')
        }
      />
    </div>
  );
};
