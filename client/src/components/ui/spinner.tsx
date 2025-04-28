import * as React from 'react';
import classNames from 'classnames';

type SpinnerElement = React.ElementRef<'span'>;

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  loading?: boolean;
}

const Spinner = React.forwardRef<SpinnerElement, SpinnerProps>((props, forwardedRef) => {
  const { className, children, loading = true, ...restProps } = props;

  if (!loading) return <>{children}</>;

  const spinner = (
    <span {...restProps} ref={forwardedRef} className={classNames('rt-Spinner', className)}>
      {Array.from({ length: 8 }).map((_, index) => (
        <span key={index} className="rt-SpinnerLeaf" />
      ))}
    </span>
  );

  if (children === undefined) return spinner;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <span
        aria-hidden="true"
        style={{ display: 'contents', visibility: 'hidden' }}
      >
        {children}
      </span>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {spinner}
      </div>
    </div>
  );
});
Spinner.displayName = 'Spinner';

export { Spinner };
export type { SpinnerProps };
