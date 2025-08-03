import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonButton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonImage,
} from '../skeleton'

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default classes', () => {
      render(<Skeleton data-testid="skeleton" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted', 'shimmer')
    })

    it('applies custom className', () => {
      render(<Skeleton className="custom-skeleton" data-testid="skeleton" />)
      const skeleton = screen.getByTestId('skeleton')
      expect(skeleton).toHaveClass('custom-skeleton')
    })
  })

  describe('SkeletonText', () => {
    it('renders single line by default', () => {
      render(<SkeletonText data-testid="skeleton-text" />)
      const skeleton = screen.getByTestId('skeleton-text')
      expect(skeleton).toHaveClass('h-4', 'w-full')
    })

    it('renders multiple lines when specified', () => {
      const { container } = render(<SkeletonText lines={3} />)
      const skeletons = container.querySelectorAll('.h-4')
      expect(skeletons).toHaveLength(3)
    })

    it('makes last line shorter for multiple lines', () => {
      const { container } = render(<SkeletonText lines={2} />)
      const skeletons = container.querySelectorAll('.h-4')
      expect(skeletons[0]).toHaveClass('w-full')
      expect(skeletons[1]).toHaveClass('w-3/4')
    })
  })

  describe('SkeletonButton', () => {
    it('renders with button dimensions', () => {
      render(<SkeletonButton data-testid="skeleton-button" />)
      const skeleton = screen.getByTestId('skeleton-button')
      expect(skeleton).toHaveClass('h-10', 'w-24', 'rounded-md')
    })
  })

  describe('SkeletonCard', () => {
    it('renders card structure with multiple elements', () => {
      const { container } = render(<SkeletonCard />)
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(1)
    })
  })

  describe('SkeletonAvatar', () => {
    it('renders with circular shape', () => {
      render(<SkeletonAvatar data-testid="skeleton-avatar" />)
      const skeleton = screen.getByTestId('skeleton-avatar')
      expect(skeleton).toHaveClass('h-10', 'w-10', 'rounded-full')
    })
  })

  describe('SkeletonImage', () => {
    it('renders with default aspect ratio', () => {
      render(<SkeletonImage data-testid="skeleton-image" />)
      const skeleton = screen.getByTestId('skeleton-image')
      expect(skeleton).toHaveClass('w-full', 'rounded-md')
      expect(skeleton).toHaveStyle({ aspectRatio: '16/9' })
    })

    it('applies custom aspect ratio', () => {
      render(<SkeletonImage aspectRatio="1/1" data-testid="skeleton-image" />)
      const skeleton = screen.getByTestId('skeleton-image')
      expect(skeleton).toHaveStyle({ aspectRatio: '1/1' })
    })
  })
})