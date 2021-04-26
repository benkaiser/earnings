import * as React from 'react';

export default function Body(props: React.ComponentProps<any>): React.ReactElement {
  return (
    <div className="body container" style={({ minWidth: 'fit-content' })}>
      { props.children }
    </div>
  );
}
