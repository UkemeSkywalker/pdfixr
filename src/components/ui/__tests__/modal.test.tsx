import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalTrigger,
  ModalClose,
} from '../modal'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'

describe('Modal', () => {
  it('renders modal content when open', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal>
        <ModalTrigger>Open Modal</ModalTrigger>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
            <ModalDescription>This is a test modal</ModalDescription>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )

    // Modal should not be visible initially
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()

    // Click trigger to open modal
    await user.click(screen.getByText('Open Modal'))

    // Modal should now be visible
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('This is a test modal')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal defaultOpen>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
          </ModalHeader>
          <ModalClose>Close Modal</ModalClose>
        </ModalContent>
      </Modal>
    )

    // Modal should be visible initially
    expect(screen.getByText('Test Modal')).toBeInTheDocument()

    // Click close button
    await user.click(screen.getByText('Close Modal'))

    // Modal should be closed (content not visible)
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Modal defaultOpen>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Test Modal</ModalTitle>
          </ModalHeader>
        </ModalContent>
      </Modal>
    )

    // Modal should be visible initially
    expect(screen.getByText('Test Modal')).toBeInTheDocument()

    // Click X button (close button in top-right)
    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)

    // Modal should be closed
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('applies custom className to content', () => {
    render(
      <Modal defaultOpen>
        <ModalContent className="custom-modal">
          <ModalTitle>Test</ModalTitle>
        </ModalContent>
      </Modal>
    )

    const content = screen.getByRole('dialog')
    expect(content).toHaveClass('custom-modal')
  })
})