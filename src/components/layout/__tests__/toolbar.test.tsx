import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar, AnnotationTool } from '../toolbar'

const defaultProps = {
  activeTool: 'select' as AnnotationTool,
  onToolChange: vi.fn(),
  onUndo: vi.fn(),
  onRedo: vi.fn(),
  onZoomIn: vi.fn(),
  onZoomOut: vi.fn(),
  onExport: vi.fn(),
  onColorChange: vi.fn(),
  canUndo: false,
  canRedo: false,
  zoomLevel: 100
}

describe('Toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all tool buttons', () => {
    render(<Toolbar {...defaultProps} />)
    
    // Selection tools
    expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument()
    
    // Annotation tools
    expect(screen.getByRole('button', { name: /highlight/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /strikethrough/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /note/i })).toBeInTheDocument()
    
    // Shape tools
    expect(screen.getByRole('button', { name: /rectangle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /circle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /arrow/i })).toBeInTheDocument()
    
    // Content tools
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /image/i })).toBeInTheDocument()
  })

  it('highlights the active tool', () => {
    render(<Toolbar {...defaultProps} activeTool="highlight" />)
    
    const highlightButton = screen.getByRole('button', { name: /highlight/i })
    expect(highlightButton).toHaveClass('bg-primary')
  })

  it('calls onToolChange when a tool is selected', async () => {
    const onToolChange = vi.fn()
    render(<Toolbar {...defaultProps} onToolChange={onToolChange} />)
    
    const highlightButton = screen.getByRole('button', { name: /highlight/i })
    await userEvent.click(highlightButton)
    
    expect(onToolChange).toHaveBeenCalledWith('highlight')
  })

  it('renders undo and redo buttons', () => {
    render(<Toolbar {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument()
  })

  it('disables undo button when canUndo is false', () => {
    render(<Toolbar {...defaultProps} canUndo={false} />)
    
    const undoButton = screen.getByRole('button', { name: /undo/i })
    expect(undoButton).toBeDisabled()
  })

  it('enables undo button when canUndo is true', () => {
    render(<Toolbar {...defaultProps} canUndo={true} />)
    
    const undoButton = screen.getByRole('button', { name: /undo/i })
    expect(undoButton).not.toBeDisabled()
  })

  it('calls onUndo when undo button is clicked', async () => {
    const onUndo = vi.fn()
    render(<Toolbar {...defaultProps} onUndo={onUndo} canUndo={true} />)
    
    const undoButton = screen.getByRole('button', { name: /undo/i })
    await userEvent.click(undoButton)
    
    expect(onUndo).toHaveBeenCalled()
  })

  it('calls onRedo when redo button is clicked', async () => {
    const onRedo = vi.fn()
    render(<Toolbar {...defaultProps} onRedo={onRedo} canRedo={true} />)
    
    const redoButton = screen.getByRole('button', { name: /redo/i })
    await userEvent.click(redoButton)
    
    expect(onRedo).toHaveBeenCalled()
  })

  it('renders zoom controls', () => {
    render(<Toolbar {...defaultProps} zoomLevel={150} />)
    
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('calls onZoomIn when zoom in button is clicked', async () => {
    const onZoomIn = vi.fn()
    render(<Toolbar {...defaultProps} onZoomIn={onZoomIn} />)
    
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
    await userEvent.click(zoomInButton)
    
    expect(onZoomIn).toHaveBeenCalled()
  })

  it('calls onZoomOut when zoom out button is clicked', async () => {
    const onZoomOut = vi.fn()
    render(<Toolbar {...defaultProps} onZoomOut={onZoomOut} />)
    
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })
    await userEvent.click(zoomOutButton)
    
    expect(onZoomOut).toHaveBeenCalled()
  })

  it('renders export button', () => {
    render(<Toolbar {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    render(<Toolbar {...defaultProps} onExport={onExport} />)
    
    const exportButton = screen.getByRole('button', { name: /export/i })
    await userEvent.click(exportButton)
    
    expect(onExport).toHaveBeenCalled()
  })

  it('renders color picker button', () => {
    render(<Toolbar {...defaultProps} />)
    
    expect(screen.getByRole('button', { name: /color picker/i })).toBeInTheDocument()
  })

  it('applies floating styles when isFloating is true', () => {
    const { container } = render(<Toolbar {...defaultProps} isFloating={true} />)
    
    const toolbar = container.firstChild as HTMLElement
    expect(toolbar).toHaveClass('fixed', 'left-1/2', 'transform', '-translate-x-1/2')
  })

  it('applies top position when position is top', () => {
    const { container } = render(<Toolbar {...defaultProps} position="top" isFloating={true} />)
    
    const toolbar = container.firstChild as HTMLElement
    expect(toolbar).toHaveClass('top-20')
  })

  it('applies bottom position when position is bottom', () => {
    const { container } = render(<Toolbar {...defaultProps} position="bottom" isFloating={true} />)
    
    const toolbar = container.firstChild as HTMLElement
    expect(toolbar).toHaveClass('bottom-6')
  })

  it('does not apply floating styles when isFloating is false', () => {
    const { container } = render(<Toolbar {...defaultProps} isFloating={false} />)
    
    const toolbar = container.firstChild as HTMLElement
    expect(toolbar).not.toHaveClass('fixed')
    expect(toolbar).toHaveClass('relative')
  })
})