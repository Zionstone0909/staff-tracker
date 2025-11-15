// Removed the problematic line that caused an infinite recursion:
// const getInputValue = (e: React.ChangeEvent<HTMLInputElement>) => getInputValue(e)

'use client'

import * as AspectRatioPrimitive from '@radix-ui/react-aspect-ratio'

// Define the AspectRatio component using the Radix Primitive
function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return (
    // Pass all props through to the underlying Radix Root component
    <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
  )
}

// Export the component for use in other files
export { AspectRatio }
