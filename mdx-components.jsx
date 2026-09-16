import Image from 'next/image'

import { Diagram } from '@/components/Diagram'

export function useMDXComponents(components) {
  return {
    ...components,
    Image: (props) => <Image {...props} />,
    Diagram: (props) => <Diagram {...props} />,
  }
}
