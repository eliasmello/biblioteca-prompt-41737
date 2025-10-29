import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Play, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { SecurityTester, TestReport, TestResult } from "@/lib/security-tests";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";

export default function SecurityTests() {
  const { user } = useAuth();
  const [report, setReport] = useState<TestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useSEO({
    title: "Testes de Segurança",
    description: "Execute testes automatizados de segurança para validar a proteção do sistema"
  });

  const runTests = async () => {
    setIsRunning(true);
    setReport(null);

    try {
      const tester = new SecurityTester();
      const result = await tester.runAllTests();
      setReport(result);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants: Record<TestResult['status'], 'default' | 'destructive' | 'secondary' | 'outline'> = {
      passed: 'default',
      failed: 'destructive',
      skipped: 'secondary',
      running: 'outline'
    };

    return (
      <Badge variant={variants[status]}>
        {status === 'passed' && '✅ Passou'}
        {status === 'failed' && '❌ Falhou'}
        {status === 'skipped' && '⏭️ Pulado'}
        {status === 'running' && '⏳ Executando'}
      </Badge>
    );
  };

  const getOverallStatusColor = (status: TestReport['overallStatus']) => {
    switch (status) {
      case 'secure':
        return 'bg-green-500/10 border-green-500/20';
      case 'partial':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'vulnerable':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Você precisa estar autenticado para executar os testes de segurança.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
              <Shield className="h-10 w-10" />
              Testes de Segurança
            </h1>
            <p className="text-muted-foreground">
              Execute testes automatizados para validar a segurança do sistema
            </p>
          </div>
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            size="lg"
          >
            <Play className="h-5 w-5 mr-2" />
            {isRunning ? 'Executando...' : 'Executar Testes'}
          </Button>
        </div>

        {isRunning && (
          <Alert className="mb-6">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Executando testes de segurança... Isso pode levar alguns segundos.
            </AlertDescription>
          </Alert>
        )}

        {report && (
          <div className="space-y-6">
            {/* Resumo Geral */}
            <Card className={`border-2 ${getOverallStatusColor(report.overallStatus)}`}>
              <CardHeader>
                <CardTitle className="text-2xl">📊 Resumo Geral</CardTitle>
                <CardDescription>
                  Executado em {new Date(report.timestamp).toLocaleString('pt-BR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{report.totalTests}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">{report.passed}</div>
                    <div className="text-sm text-muted-foreground">Passou</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">{report.failed}</div>
                    <div className="text-sm text-muted-foreground">Falhou</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-500">{report.skipped}</div>
                    <div className="text-sm text-muted-foreground">Pulado</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {report.overallStatus === 'secure' && '🛡️ SEGURO'}
                      {report.overallStatus === 'partial' && '⚠️ PARCIAL'}
                      {report.overallStatus === 'vulnerable' && '🚨 VULNERÁVEL'}
                    </div>
                    <div className="text-sm text-muted-foreground">Status</div>
                  </div>
                </div>

                {report.overallStatus === 'vulnerable' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      ⚠️ ATENÇÃO: Foram detectadas vulnerabilidades críticas que precisam ser corrigidas imediatamente!
                    </AlertDescription>
                  </Alert>
                )}

                {report.overallStatus === 'secure' && (
                  <Alert className="mt-4 bg-green-500/10 border-green-500/20">
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      ✅ Parabéns! Todos os testes críticos de segurança foram aprovados.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Resultados por Categoria */}
            {['Escalação de Privilégios', 'Vazamento de Dados', 'Segurança de Tokens', 'Integridade do Sistema'].map(category => {
              const categoryResults = report.results.filter(r => r.category === category);
              if (categoryResults.length === 0) return null;

              const criticalCount = categoryResults.filter(r => r.critical).length;
              const failedCount = categoryResults.filter(r => r.status === 'failed').length;

              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category}</span>
                      {criticalCount > 0 && (
                        <Badge variant="destructive">🔴 {criticalCount} Críticos</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {categoryResults.length} testes - {failedCount > 0 ? `${failedCount} falhas` : 'Todos passaram'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryResults.map(test => (
                        <div 
                          key={test.id} 
                          className={`p-4 border rounded-lg ${
                            test.status === 'failed' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                            test.status === 'passed' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' :
                            'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              <span className="font-semibold">Teste {test.id}: {test.name}</span>
                              {test.critical && (
                                <Badge variant="destructive" className="text-xs">CRÍTICO</Badge>
                              )}
                            </div>
                            {getStatusBadge(test.status)}
                          </div>
                          
                          <div className="grid gap-2 text-sm mt-3">
                            <div>
                              <span className="font-medium">Esperado:</span>
                              <span className="ml-2 text-muted-foreground">{test.expectedResult}</span>
                            </div>
                            <div>
                              <span className="font-medium">Resultado:</span>
                              <span className={`ml-2 ${test.status === 'failed' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {test.actualResult}
                              </span>
                            </div>
                            {test.error && (
                              <div className="mt-2 p-2 bg-red-100 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-900">
                                <span className="font-medium text-red-700 dark:text-red-400">Detalhes:</span>
                                <pre className="mt-1 text-xs text-red-600 dark:text-red-500 overflow-x-auto">
                                  {test.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!report && !isRunning && (
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Esta ferramenta executa uma bateria completa de testes automatizados para validar a segurança do sistema:
              </p>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="text-2xl">🔴</div>
                  <div>
                    <strong>Categoria 1: Escalação de Privilégios</strong>
                    <p className="text-sm text-muted-foreground">
                      Testa se usuários podem elevar suas próprias permissões
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-2xl">🔴</div>
                  <div>
                    <strong>Categoria 2: Vazamento de Dados</strong>
                    <p className="text-sm text-muted-foreground">
                      Verifica se dados sensíveis estão protegidos contra acesso não autorizado
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-2xl">🔴</div>
                  <div>
                    <strong>Categoria 3: Segurança de Tokens</strong>
                    <p className="text-sm text-muted-foreground">
                      Valida a proteção de tokens de convite e acesso
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="text-2xl">🟢</div>
                  <div>
                    <strong>Categoria 4: Integridade do Sistema</strong>
                    <p className="text-sm text-muted-foreground">
                      Confirma que funções de segurança estão funcionando corretamente
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Os testes são executados com as permissões do usuário atual. 
                  Para testes completos, execute como usuário comum e depois como master.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
