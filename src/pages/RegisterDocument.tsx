import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { AuditLogReference } from "@/components/common/AuditLogReference";
import { RegisterDocumentWizard } from "@/components/documents/RegisterDocumentWizard";

const RegisterDocument = () => {
  return (
    <DashboardLayout 
      title="Registar Novo Documento" 
      subtitle="Registe um novo documento no sistema em passos simples"
    >
      <PageBreadcrumb 
        items={[
          { label: "Documentos", href: "/documents" },
          { label: "Registar Novo Documento" }
        ]} 
      />

      <RegisterDocumentWizard />

      <div className="mt-6">
        <AuditLogReference context="Ver histórico de registos" />
      </div>
    </DashboardLayout>
  );
};

export default RegisterDocument;
