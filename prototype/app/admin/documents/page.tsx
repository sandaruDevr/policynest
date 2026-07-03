'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Document } from '../../../lib/types'
import { Trash2, Eye } from 'lucide-react'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [sector, setSector] = useState('')
  const [framework, setFramework] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [content, setContent] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

      // Deduplicate by document ID (safety net for any DB-level duplicates)
      const uniqueDocs = data?.filter((doc, index, self) =>
        index === self.findIndex((d) => d.id === doc.id)
      ) || []
      setDocuments(uniqueDocs)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

      // Create document
      const { data: document } = await supabase
        .from('documents')
        .insert({
          tenant_id: profile?.tenant_id,
          title,
          document_type: documentType,
          sector,
          framework: framework ? framework.split(',').map(f => f.trim()) : [],
          risk_level: riskLevel,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single()

      // Process document via server
      const response = await fetch('http://localhost:3001/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: document.id,
          tenant_id: profile?.tenant_id,
          text: content,
          options: {
            title,
            sector,
            framework: framework ? framework.split(',').map(f => f.trim()) : [],
            riskLevel,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process document')
      }

      setShowUpload(false)
      setTitle('')
      setDocumentType('')
      setSector('')
      setFramework('')
      setRiskLevel('')
      setContent('')
      loadDocuments()
    } catch (error: any) {
      console.error('Error uploading document:', error)
      alert(`Error uploading document: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleStatusChange = async (docId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus })
        .eq('id', docId)

      if (error) throw error
      loadDocuments()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also delete all associated chunks.')) {
      return
    }

    try {
      // Delete chunks first
      await supabase.from('document_chunks').delete().eq('document_id', docId)
      // Then delete document
      const { error } = await supabase.from('documents').delete().eq('id', docId)

      if (error) throw error
      loadDocuments()
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-blue-100 text-blue-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
        <Button onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Cancel' : 'Upload Document'}
        </Button>
      </div>

      {showUpload && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <Input
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  placeholder="e.g., Policy, Procedure"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sector</label>
                <Input
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="e.g., Aged Care, NDIS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Framework (comma-separated)</label>
                <Input
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  placeholder="e.g., Aged Care Quality Standards, NDIS Practice Standards"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select risk level</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  required
                  placeholder="Paste your document content here..."
                />
              </div>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Processing...' : 'Upload & Process'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{doc.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {doc.document_type} • {doc.sector}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Version: {doc.version} • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDoc(doc)
                      setShowDetails(true)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showDetails && selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{selectedDoc.title}</CardTitle>
                <Button variant="ghost" onClick={() => setShowDetails(false)}>✕</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Type: {selectedDoc.document_type}</p>
                  <p className="text-sm text-gray-600">Sector: {selectedDoc.sector}</p>
                  <p className="text-sm text-gray-600">Risk Level: {selectedDoc.risk_level}</p>
                  <p className="text-sm text-gray-600">Framework: {Array.isArray(selectedDoc.framework) ? selectedDoc.framework.join(', ') : selectedDoc.framework}</p>
                  <p className="text-sm text-gray-600">Status: {selectedDoc.status}</p>
                  <p className="text-sm text-gray-600">Version: {selectedDoc.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
