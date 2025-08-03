import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../header'
import { ThemeProvider } from '@/components/theme-provider'

// Mock the theme provider
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
  </ThemeProvider>
)

const renderHeader = (props = {}) => {
  return render(
    <MockThemeProvider>
      <Header {...props} />
    </MockThemeProvider>
  )
}

describe('Header', () => {
  it('renders the logo and title', () => {
    renderHeader()
    expect(screen.getByText('PDFixr')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'PDFixr' })).toBeInTheDocument()
  })

  it('renders upload button', () => {
    renderHeader()
    expect(screen.getByText('Upload PDF')).toBeInTheDocument()
  })

  it('shows file name when provided', () => {
    renderHeader({ fileName: 'test-document.pdf' })
    expect(screen.getByText('test-document.pdf')).toBeInTheDocument()
  })

  it('shows save and export buttons when file is loaded', () => {
    renderHeader({ isFileLoaded: true })
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('hides save and export buttons when no file is loaded', () => {
    renderHeader({ isFileLoaded: false })
    expect(screen.queryByText('Save')).not.toBeInTheDocument()
    expect(screen.queryByText('Export')).not.toBeInTheDocument()
  })

  it('calls onFileUpload when file is selected', async () => {
    const onFileUpload = vi.fn()
    renderHeader({ onFileUpload })

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByLabelText('Upload PDF')

    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(onFileUpload).toHaveBeenCalledWith(file)
    })
  })

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn()
    renderHeader({ isFileLoaded: true, onSave })

    const saveButton = screen.getByText('Save')
    await userEvent.click(saveButton)

    expect(onSave).toHaveBeenCalled()
  })

  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    renderHeader({ isFileLoaded: true, onExport })

    const exportButton = screen.getByText('Export')
    await userEvent.click(exportButton)

    expect(onExport).toHaveBeenCalled()
  })

  it('handles drag and drop', async () => {
    const onFileUpload = vi.fn()
    renderHeader({ onFileUpload })

    const header = screen.getByRole('banner')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.dragOver(header, {
      dataTransfer: {
        files: [file],
      },
    })

    fireEvent.drop(header, {
      dataTransfer: {
        files: [file],
      },
    })

    await waitFor(() => {
      expect(onFileUpload).toHaveBeenCalledWith(file)
    })
  })

  it('shows drag overlay when dragging over', () => {
    renderHeader()

    const header = screen.getByRole('banner')
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.dragOver(header, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(screen.getByText('Drop your PDF file here')).toBeInTheDocument()
  })

  it('calls onError for invalid file types', async () => {
    const onError = vi.fn()
    renderHeader({ onError })

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText('Upload PDF') as HTMLInputElement

    // Simulate file selection
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    })

    fireEvent.change(input)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('File type not supported')
      )
    })
  })

  it('renders theme toggle', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('renders user menu', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument()
  })
})