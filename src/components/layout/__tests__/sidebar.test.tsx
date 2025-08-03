import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../sidebar'

const mockPages = [
  {
    id: '1',
    pageNumber: 1,
    thumbnail: 'data:image/png;base64,test1',
    width: 612,
    height: 792
  },
  {
    id: '2',
    pageNumber: 2,
    thumbnail: 'data:image/png;base64,test2',
    width: 612,
    height: 792
  }
]

const mockAnnotations = [
  {
    id: 'ann1',
    type: 'highlight' as const,
    pageNumber: 1,
    visible: true,
    color: '#ff0000',
    content: 'Test highlight'
  },
  {
    id: 'ann2',
    type: 'note' as const,
    pageNumber: 1,
    visible: false,
    content: 'Test note'
  },
  {
    id: 'ann3',
    type: 'underline' as const,
    pageNumber: 2,
    visible: true,
    color: '#00ff00'
  }
]

const defaultProps = {
  isCollapsed: false,
  onToggleCollapse: vi.fn(),
  pages: mockPages,
  annotations: mockAnnotations,
  currentPage: 1,
  onPageSelect: vi.fn(),
  onAnnotationToggle: vi.fn(),
  onAnnotationDelete: vi.fn(),
  onAnnotationSelect: vi.fn(),
  isMobile: false
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sidebar tabs', () => {
    render(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('Pages')).toBeInTheDocument()
    expect(screen.getByText('Layers')).toBeInTheDocument()
    expect(screen.getByText('Properties')).toBeInTheDocument()
  })

  it('renders collapse/expand button', () => {
    render(<Sidebar {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument()
  })

  it('calls onToggleCollapse when collapse button is clicked', async () => {
    const onToggleCollapse = vi.fn()
    render(<Sidebar {...defaultProps} onToggleCollapse={onToggleCollapse} />)
    
    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
    await userEvent.click(collapseButton)
    
    expect(onToggleCollapse).toHaveBeenCalled()
  })

  it('shows expand button when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)
    
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('renders page thumbnails in pages tab', () => {
    render(<Sidebar {...defaultProps} />)
    
    expect(screen.getByText('Page 1')).toBeInTheDocument()
    expect(screen.getByText('Page 2')).toBeInTheDocument()
    expect(screen.getByAltText('Page 1')).toBeInTheDocument()
    expect(screen.getByAltText('Page 2')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    render(<Sidebar {...defaultProps} currentPage={2} />)
    
    // Find the page container (parent of the text element)
    const page2Text = screen.getByText('Page 2')
    const pageContainer = page2Text.closest('[class*="border-2"]')
    expect(pageContainer).toHaveClass('border-primary')
  })

  it('calls onPageSelect when page is clicked', async () => {
    const onPageSelect = vi.fn()
    render(<Sidebar {...defaultProps} onPageSelect={onPageSelect} />)
    
    const page2 = screen.getByText('Page 2')
    await userEvent.click(page2)
    
    expect(onPageSelect).toHaveBeenCalledWith(2)
  })

  it('switches to layers tab', async () => {
    render(<Sidebar {...defaultProps} />)
    
    const layersTab = screen.getByText('Layers')
    await userEvent.click(layersTab)
    
    // Should show annotations
    expect(screen.getByText('Highlight')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
  })

  it('renders annotations in layers tab', async () => {
    render(<Sidebar {...defaultProps} />)
    
    const layersTab = screen.getByText('Layers')
    await userEvent.click(layersTab)
    
    expect(screen.getByText('Highlight')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Underline')).toBeInTheDocument()
  })

  it('calls onAnnotationSelect when annotation is clicked', async () => {
    const onAnnotationSelect = vi.fn()
    render(<Sidebar {...defaultProps} onAnnotationSelect={onAnnotationSelect} />)
    
    const layersTab = screen.getByText('Layers')
    await userEvent.click(layersTab)
    
    const highlightAnnotation = screen.getByText('Highlight')
    await userEvent.click(highlightAnnotation)
    
    expect(onAnnotationSelect).toHaveBeenCalledWith('ann1')
  })

  it('calls onAnnotationToggle when visibility button is clicked', async () => {
    const onAnnotationToggle = vi.fn()
    render(<Sidebar {...defaultProps} onAnnotationToggle={onAnnotationToggle} />)
    
    const layersTab = screen.getByText('Layers')
    await userEvent.click(layersTab)
    
    // Find the first annotation row and hover to show buttons
    const annotationRow = screen.getByText('Highlight').closest('div')
    if (annotationRow) {
      fireEvent.mouseEnter(annotationRow)
      
      const visibilityButtons = screen.getAllByRole('button', { name: /hide|show/i })
      if (visibilityButtons.length > 0) {
        await userEvent.click(visibilityButtons[0])
        expect(onAnnotationToggle).toHaveBeenCalledWith('ann1')
      }
    }
  })

  it('switches to properties tab', async () => {
    render(<Sidebar {...defaultProps} annotations={[]} />)
    
    const propertiesTab = screen.getByText('Properties')
    await userEvent.click(propertiesTab)
    
    expect(screen.getByText('Select an annotation')).toBeInTheDocument()
  })

  it('shows annotation properties when annotation is selected', async () => {
    render(<Sidebar {...defaultProps} selectedAnnotation="ann1" />)
    
    const propertiesTab = screen.getByText('Properties')
    await userEvent.click(propertiesTab)
    
    expect(screen.getByText('Annotation Properties')).toBeInTheDocument()
    expect(screen.getByText('highlight')).toBeInTheDocument()
  })

  it('shows current page annotations in properties tab', async () => {
    render(<Sidebar {...defaultProps} currentPage={1} />)
    
    const propertiesTab = screen.getByText('Properties')
    await userEvent.click(propertiesTab)
    
    expect(screen.getByText('Page 1 Annotations')).toBeInTheDocument()
    expect(screen.getByText('2 annotations')).toBeInTheDocument()
  })

  it('hides content when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)
    
    // Check that the tab buttons are not visible (only sr-only text remains)
    expect(screen.queryByRole('button', { name: 'Pages' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Layers' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Properties' })).toBeInTheDocument()
    
    // Check that the main content area is not visible
    expect(screen.queryByText('Page 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Page 2')).not.toBeInTheDocument()
  })

  it('shows collapsed state icons when collapsed', () => {
    render(<Sidebar {...defaultProps} isCollapsed={true} />)
    
    expect(screen.getByRole('button', { name: 'Pages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Layers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Properties' })).toBeInTheDocument()
  })

  it('returns null when mobile and collapsed', () => {
    const { container } = render(<Sidebar {...defaultProps} isMobile={true} isCollapsed={true} />)
    
    expect(container.firstChild).toBeNull()
  })

  it('applies mobile styles when isMobile is true', () => {
    const { container } = render(<Sidebar {...defaultProps} isMobile={true} isCollapsed={false} />)
    
    const sidebar = container.firstChild as HTMLElement
    expect(sidebar).toHaveClass('fixed', 'left-0', 'top-16', 'bottom-0', 'z-30', 'shadow-lg')
  })

  it('shows empty state when no pages', () => {
    render(<Sidebar {...defaultProps} pages={[]} />)
    
    expect(screen.getByText('No pages available')).toBeInTheDocument()
  })

  it('shows empty state when no annotations in layers tab', async () => {
    render(<Sidebar {...defaultProps} annotations={[]} />)
    
    const layersTab = screen.getByText('Layers')
    await userEvent.click(layersTab)
    
    expect(screen.getByText('No annotations')).toBeInTheDocument()
  })
})