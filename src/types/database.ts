// =============================================
// MINAGRIF - Tipos de Base de Dados
// =============================================

export interface OrganizationalUnit {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position: string | null;
  unit_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  unit?: OrganizationalUnit;
}

export interface ClassificationCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  level: number;
  retention_years: number | null;
  final_destination: 'elimination' | 'permanent' | 'sample' | null;
  is_active: boolean;
  created_at: string;
  // Relacionamentos
  parent?: ClassificationCode;
  children?: ClassificationCode[];
}

export interface DocumentType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  default_classification_id: string | null;
  requires_signature: boolean;
  is_active: boolean;
  created_at: string;
}

export type DocumentStatus = 
  | 'received' 
  | 'validating' 
  | 'validated' 
  | 'in_progress' 
  | 'pending_signature' 
  | 'signed' 
  | 'dispatched' 
  | 'archived' 
  | 'rejected';

export type DocumentPriority = 'low' | 'normal' | 'high' | 'urgent';

export type DocumentConfidentiality = 'public' | 'internal' | 'confidential' | 'secret';

export interface Document {
  id: string;
  entry_number: string;
  title: string;
  description: string | null;
  document_type_id: string | null;
  classification_id: string | null;
  origin: string | null;
  origin_unit_id: string | null;
  current_unit_id: string | null;
  responsible_user_id: string | null;
  status: DocumentStatus;
  priority: DocumentPriority;
  confidentiality: DocumentConfidentiality;
  entry_date: string;
  due_date: string | null;
  subject: string | null;
  sender_name: string | null;
  sender_institution: string | null;
  external_reference: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  document_type?: DocumentType;
  classification?: ClassificationCode;
  origin_unit?: OrganizationalUnit;
  current_unit?: OrganizationalUnit;
  responsible_user?: Profile;
  files?: DocumentFile[];
  movements?: DocumentMovement[];
  signatures?: DocumentSignature[];
  comments?: DocumentComment[];
}

export interface DocumentFile {
  id: string;
  document_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_main_file: boolean;
  version: number;
  uploaded_by: string | null;
  created_at: string;
}

export type MovementActionType = 
  | 'receive' 
  | 'validate' 
  | 'dispatch' 
  | 'forward' 
  | 'return' 
  | 'assign' 
  | 'reject' 
  | 'archive' 
  | 'sign';

export interface DocumentMovement {
  id: string;
  document_id: string;
  from_unit_id: string | null;
  to_unit_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  action_type: MovementActionType;
  dispatch_text: string | null;
  notes: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  // Relacionamentos
  from_unit?: OrganizationalUnit;
  to_unit?: OrganizationalUnit;
  from_user?: Profile;
  to_user?: Profile;
}

export type SignatureType = 'approval' | 'acknowledgment' | 'certification' | 'digital';

export interface DocumentSignature {
  id: string;
  document_id: string;
  signer_id: string;
  signature_type: SignatureType;
  signature_data: string | null;
  signed_at: string;
  ip_address: string | null;
  device_info: string | null;
  is_valid: boolean;
  // Relacionamentos
  signer?: Profile;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  author_id: string | null;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  author?: Profile;
}

export interface DocumentAuditLog {
  id: string;
  document_id: string;
  action: string;
  description: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  performed_by: string | null;
  ip_address: string | null;
  created_at: string;
}

// =============================================
// Tipos para criação/atualização
// =============================================

export interface CreateDocumentInput {
  title: string;
  description?: string;
  document_type_id?: string;
  classification_id?: string;
  origin?: string;
  origin_unit_id?: string;
  current_unit_id?: string;
  responsible_user_id?: string;
  priority?: DocumentPriority;
  confidentiality?: DocumentConfidentiality;
  due_date?: string;
  subject?: string;
  sender_name?: string;
  sender_institution?: string;
  external_reference?: string;
}

export interface UpdateDocumentInput extends Partial<CreateDocumentInput> {
  status?: DocumentStatus;
  is_archived?: boolean;
}

export interface CreateMovementInput {
  document_id: string;
  to_unit_id: string;
  to_user_id?: string;
  action_type: MovementActionType;
  dispatch_text?: string;
  notes?: string;
}

export interface CreateCommentInput {
  document_id: string;
  content: string;
  is_internal?: boolean;
}

// =============================================
// Tipos para filtros e pesquisa
// =============================================

export interface DocumentFilters {
  status?: DocumentStatus | DocumentStatus[];
  priority?: DocumentPriority | DocumentPriority[];
  document_type_id?: string;
  current_unit_id?: string;
  responsible_user_id?: string;
  classification_id?: string;
  is_archived?: boolean;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================
// Mapeamentos de labels
// =============================================

export const documentStatusLabels: Record<DocumentStatus, string> = {
  received: 'Recebido',
  validating: 'Em Validação',
  validated: 'Validado',
  in_progress: 'Em Andamento',
  pending_signature: 'Aguardando Assinatura',
  signed: 'Assinado',
  dispatched: 'Despachado',
  archived: 'Arquivado',
  rejected: 'Rejeitado',
};

export const documentStatusVariants: Record<DocumentStatus, 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  received: 'info',
  validating: 'warning',
  validated: 'success',
  in_progress: 'info',
  pending_signature: 'warning',
  signed: 'success',
  dispatched: 'success',
  archived: 'secondary',
  rejected: 'error',
};

export const documentPriorityLabels: Record<DocumentPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export const documentPriorityVariants: Record<DocumentPriority, 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  low: 'secondary',
  normal: 'info',
  high: 'warning',
  urgent: 'error',
};

export const confidentialityLabels: Record<DocumentConfidentiality, string> = {
  public: 'Público',
  internal: 'Interno',
  confidential: 'Confidencial',
  secret: 'Secreto',
};

export const movementActionLabels: Record<MovementActionType, string> = {
  receive: 'Recebido',
  validate: 'Validado',
  dispatch: 'Despachado',
  forward: 'Encaminhado',
  return: 'Devolvido',
  assign: 'Atribuído',
  reject: 'Rejeitado',
  archive: 'Arquivado',
  sign: 'Assinado',
};
