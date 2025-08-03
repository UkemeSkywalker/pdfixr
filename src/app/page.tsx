import { AppLayout } from '@/components/layout'

export default function Home() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Welcome to PDFixr
          </h2>
          <p className="text-muted-foreground mb-6">
            Upload a PDF file to start editing
          </p>
          <div className="text-sm text-muted-foreground">
            Use the "Upload PDF" button in the header to get started
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
