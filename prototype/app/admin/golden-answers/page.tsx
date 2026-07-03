import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'

export default async function GoldenAnswersPage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user?.id)
    .single()

  const { data: answers } = await supabase
    .from('golden_answers')
    .select('*')
    .eq('tenant_id', profile?.tenant_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Golden Answers</h1>
      <p className="text-gray-600 mb-8">Reusable approved answers for common questions</p>

      <div className="space-y-4">
        {answers && answers.length > 0 ? (
          answers.map((answer) => (
            <Card key={answer.id}>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">{answer.question}</h3>
                <p className="text-gray-700 mb-3">{answer.answer}</p>
                {answer.citations && answer.citations.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold">Sources: </span>
                    {answer.citations.map((c: any) => `${c.title} v${c.version}`).join(', ')}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(answer.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-600">No golden answers yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
