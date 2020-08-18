import * as React from 'react';

export default function Body(props: React.ComponentProps<any>): React.ReactElement {
  return (
    <div className="body container">
      { props.children }
    </div>
  );
}
