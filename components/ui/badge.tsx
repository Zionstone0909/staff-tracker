// Removed the problematic line that caused an infinite recursion:
// const getInputValue = (e: React.ChangeEvent<HTMLInputElement>) => getInputValue(e)

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

// Assuming '@/lib/utils' exports a 'cn' function for merging Tailwind CSS classes
import { cn } from '@/lib/utils'

// Define the available badge variants and their associated Tailwind classes
const badgeVariants = cva(
  // Base styles applied to all badges
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

// Define the props for the Badge component
function Badge({
  className,
  variant,
  asChild = false, // Allows the component to render as a child element using the Slot primitive
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  
  // Conditionally set the root component to either 'span' or 'Slot'
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      // Combine base styles, variant styles, and custom classes
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// Export the component and the variants helper
export { Badge, badgeVariants }
