create policy "Tenant users can delete own RAG logs"
on rag_audit_logs
for delete
using (tenant_id = current_user_tenant_id());