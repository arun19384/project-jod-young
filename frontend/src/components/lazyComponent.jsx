import React, { lazy, Suspense } from 'react';
import LoadingPopup from './LoadingPopup.jsx';

// Keep each screen's loading boundary local so navigation remains responsive.
export function lazyComponent(loader) {
  const Component = lazy(loader);
  return function LazyComponent(props) {
    return (
      <Suspense fallback={<LoadingPopup message="กำลังเปิด..." />}>
        <Component {...props} />
      </Suspense>
    );
  };
}
