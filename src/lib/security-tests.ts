import { supabase } from "@/integrations/supabase/client";

export interface TestResult {
  id: string;
  category: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  expectedResult: string;
  actualResult: string;
  error?: string;
  critical: boolean;
}

export interface TestReport {
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  overallStatus: 'secure' | 'vulnerable' | 'partial';
}

export class SecurityTester {
  private results: TestResult[] = [];
  private currentUserId: string | null = null;

  async initialize() {
    const { data } = await supabase.auth.getUser();
    this.currentUserId = data.user?.id || null;
  }

  private addResult(result: Omit<TestResult, 'status'> & { status: TestResult['status'] }) {
    this.results.push(result as TestResult);
  }

  // CATEGORIA 1: Testes de Escalação de Privilégios
  async testPrivilegeEscalation() {
    console.log('🔴 CATEGORIA 1: Testes de Escalação de Privilégios');

    // Teste 1.1: Tentativa de Auto-Promoção via UPDATE
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'master' })
        .eq('user_id', this.currentUserId);

      this.addResult({
        id: '1.1',
        category: 'Escalação de Privilégios',
        name: 'Tentativa de Auto-Promoção via UPDATE',
        status: error ? 'passed' : 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: error ? `Bloqueado: ${error.message}` : 'VULNERÁVEL: Update permitido!',
        error: error ? undefined : 'RLS não bloqueou UPDATE de role',
        critical: true
      });
    } catch (e) {
      this.addResult({
        id: '1.1',
        category: 'Escalação de Privilégios',
        name: 'Tentativa de Auto-Promoção via UPDATE',
        status: 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: true
      });
    }

    // Teste 1.2: Tentativa de Inserção de Role Master
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ 
          user_id: this.currentUserId, 
          role: 'master' 
        });

      this.addResult({
        id: '1.2',
        category: 'Escalação de Privilégios',
        name: 'Tentativa de Inserção de Role Master',
        status: error ? 'passed' : 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: error ? `Bloqueado: ${error.message}` : 'VULNERÁVEL: Insert permitido!',
        error: error ? undefined : 'RLS não bloqueou INSERT de role master',
        critical: true
      });
    } catch (e) {
      this.addResult({
        id: '1.2',
        category: 'Escalação de Privilégios',
        name: 'Tentativa de Inserção de Role Master',
        status: 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: true
      });
    }

    // Teste 1.3: Tentativa de DELETE
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', this.currentUserId);

      this.addResult({
        id: '1.3',
        category: 'Escalação de Privilégios',
        name: 'Tentativa de DELETE de Role',
        status: error ? 'passed' : 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: error ? `Bloqueado: ${error.message}` : 'VULNERÁVEL: Delete permitido!',
        error: error ? undefined : 'RLS não bloqueou DELETE de role',
        critical: true
      });
    } catch (e) {
      this.addResult({
        id: '1.3',
        category: 'Escalação de Privilégios',
        name: 'Tentativa de DELETE de Role',
        status: 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: true
      });
    }
  }

  // CATEGORIA 2: Testes de Vazamento de Dados
  async testDataLeakage() {
    console.log('🔴 CATEGORIA 2: Testes de Vazamento de Dados');

    // Teste 2.1: Acesso a Emails via Query Direta
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url');

      if (error) {
        this.addResult({
          id: '2.1',
          category: 'Vazamento de Dados',
          name: 'Acesso a Emails via Query Direta',
          status: 'failed',
          expectedResult: 'Apenas próprio email visível',
          actualResult: `Erro: ${error.message}`,
          error: error.message,
          critical: true
        });
      } else {
        const outrosEmails = data?.filter(p => 
          p.id !== this.currentUserId && p.email !== null
        ) || [];

        this.addResult({
          id: '2.1',
          category: 'Vazamento de Dados',
          name: 'Acesso a Emails via Query Direta',
          status: outrosEmails.length === 0 ? 'passed' : 'failed',
          expectedResult: 'Apenas próprio email visível',
          actualResult: outrosEmails.length === 0 
            ? 'Seguro: Apenas próprio email acessível' 
            : `VULNERÁVEL: ${outrosEmails.length} emails de outros usuários vazaram!`,
          error: outrosEmails.length > 0 ? `Emails vazados: ${JSON.stringify(outrosEmails)}` : undefined,
          critical: true
        });
      }
    } catch (e) {
      this.addResult({
        id: '2.1',
        category: 'Vazamento de Dados',
        name: 'Acesso a Emails via Query Direta',
        status: 'failed',
        expectedResult: 'Apenas próprio email visível',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: true
      });
    }

    // Teste 2.2: Tentativa de Alterar Email de Outro Usuário
    try {
      // Primeiro, pegar ID de outro usuário
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', this.currentUserId)
        .limit(1);

      if (profiles && profiles.length > 0) {
        const outroUserId = profiles[0].id;
        const { error } = await supabase
          .from('profiles')
          .update({ email: 'hacker@test.com' })
          .eq('id', outroUserId);

        this.addResult({
          id: '2.2',
          category: 'Vazamento de Dados',
          name: 'Tentativa de Alterar Email de Outro Usuário',
          status: error ? 'passed' : 'failed',
          expectedResult: 'Erro de permissão RLS',
          actualResult: error ? `Bloqueado: ${error.message}` : 'VULNERÁVEL: Update permitido!',
          error: error ? undefined : 'RLS não bloqueou alteração de email alheio',
          critical: true
        });
      } else {
        this.addResult({
          id: '2.2',
          category: 'Vazamento de Dados',
          name: 'Tentativa de Alterar Email de Outro Usuário',
          status: 'skipped',
          expectedResult: 'Erro de permissão RLS',
          actualResult: 'Sem outros usuários para testar',
          critical: true
        });
      }
    } catch (e) {
      this.addResult({
        id: '2.2',
        category: 'Vazamento de Dados',
        name: 'Tentativa de Alterar Email de Outro Usuário',
        status: 'failed',
        expectedResult: 'Erro de permissão RLS',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: true
      });
    }
  }

  // CATEGORIA 3: Testes de Segurança de Tokens
  async testTokenSecurity() {
    console.log('🔴 CATEGORIA 3: Testes de Segurança de Tokens');

    // Teste 3.1: Listagem de Todos os Tokens
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('*');

      // Para usuário comum, deve dar erro ou retornar vazio
      const hasData = data && data.length > 0;
      
      this.addResult({
        id: '3.1',
        category: 'Segurança de Tokens',
        name: 'Listagem de Todos os Tokens',
        status: !hasData ? 'passed' : 'failed',
        expectedResult: 'Erro de permissão ou array vazio',
        actualResult: hasData 
          ? `VULNERÁVEL: ${data.length} tokens acessíveis!` 
          : error 
            ? `Bloqueado: ${error.message}` 
            : 'Seguro: Nenhum token acessível',
        error: hasData ? 'RLS não bloqueou acesso a tokens' : undefined,
        critical: true
      });
    } catch (e) {
      this.addResult({
        id: '3.1',
        category: 'Segurança de Tokens',
        name: 'Listagem de Todos os Tokens',
        status: 'passed',
        expectedResult: 'Erro de permissão ou array vazio',
        actualResult: 'Bloqueado por exceção',
        critical: true
      });
    }
  }

  // CATEGORIA 4: Testes de Integridade
  async testSystemIntegrity() {
    console.log('🟢 CATEGORIA 4: Testes de Integridade do Sistema');

    // Teste 4.1: Verificação de Funções de Segurança
    try {
      const { data: hasRoleResult, error: hasRoleError } = await supabase
        .rpc('has_role', { _user_id: this.currentUserId, _role: 'user' });

      this.addResult({
        id: '4.1',
        category: 'Integridade do Sistema',
        name: 'Função has_role() Disponível',
        status: !hasRoleError ? 'passed' : 'failed',
        expectedResult: 'Função disponível e funcional',
        actualResult: !hasRoleError 
          ? `Funcional: Retornou ${hasRoleResult}` 
          : `Erro: ${hasRoleError.message}`,
        error: hasRoleError?.message,
        critical: false
      });
    } catch (e) {
      this.addResult({
        id: '4.1',
        category: 'Integridade do Sistema',
        name: 'Função has_role() Disponível',
        status: 'failed',
        expectedResult: 'Função disponível e funcional',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: false
      });
    }

    // Teste 4.2: Verificação de Roles do Usuário Atual
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', this.currentUserId);

      this.addResult({
        id: '4.2',
        category: 'Integridade do Sistema',
        name: 'Usuário Possui Role Atribuída',
        status: !error && roles && roles.length > 0 ? 'passed' : 'failed',
        expectedResult: 'Usuário tem pelo menos uma role',
        actualResult: !error && roles 
          ? `Roles: ${roles.map(r => r.role).join(', ')}` 
          : error 
            ? `Erro: ${error.message}` 
            : 'Nenhuma role encontrada',
        error: (!roles || roles.length === 0) ? 'Usuário sem roles' : undefined,
        critical: false
      });
    } catch (e) {
      this.addResult({
        id: '4.2',
        category: 'Integridade do Sistema',
        name: 'Usuário Possui Role Atribuída',
        status: 'failed',
        expectedResult: 'Usuário tem pelo menos uma role',
        actualResult: 'Erro inesperado',
        error: String(e),
        critical: false
      });
    }
  }

  async runAllTests(): Promise<TestReport> {
    console.log('🛡️ Iniciando Testes de Segurança Automatizados...\n');
    
    await this.initialize();

    if (!this.currentUserId) {
      throw new Error('Usuário não autenticado. Faça login antes de executar os testes.');
    }

    this.results = [];

    await this.testPrivilegeEscalation();
    await this.testDataLeakage();
    await this.testTokenSecurity();
    await this.testSystemIntegrity();

    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const criticalFailed = this.results.filter(r => r.status === 'failed' && r.critical).length;

    const overallStatus: TestReport['overallStatus'] = 
      criticalFailed > 0 ? 'vulnerable' :
      failed > 0 ? 'partial' : 'secure';

    const report: TestReport = {
      timestamp: new Date(),
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      results: this.results,
      overallStatus
    };

    console.log('\n📊 Relatório Final:');
    console.log(`Total de Testes: ${report.totalTests}`);
    console.log(`✅ Passou: ${passed}`);
    console.log(`❌ Falhou: ${failed}`);
    console.log(`⏭️ Pulado: ${skipped}`);
    console.log(`🔴 Críticos Falhados: ${criticalFailed}`);
    console.log(`\n🎯 Status Geral: ${overallStatus.toUpperCase()}`);

    return report;
  }
}

// Função helper para executar no console
export async function runSecurityTests(): Promise<TestReport> {
  const tester = new SecurityTester();
  return await tester.runAllTests();
}
