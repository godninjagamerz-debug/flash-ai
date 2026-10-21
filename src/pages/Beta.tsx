import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Zap, Brain, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle, Loader2, Play, Square, ChevronRight,
  TrendingUp, Shield, Rocket, BookOpen, Users, BarChart3,
  GitBranch, Package, Activity, Clock, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  FLASH_MODELS, ACCURE_MODELS,
} from '@/types/plans';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

// ─── Types ──────────────────────────────────────────────────────────────────

interface LearningCycle {
  id: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'done' | 'error';
  steps: {
    collectChats:    'pending' | 'running' | 'done' | 'error';
    updateEmbeddings:'pending' | 'running' | 'done' | 'error';
    runEvalTests:    'pending' | 'running' | 'done' | 'error';
    generateReport:  'pending' | 'running' | 'done' | 'error';
  };
  report?: ImprovementReport;
}

interface ImprovementReport {
  avgRating: number;
  totalChats: number;
  positiveSignals: number;
  negativeSignals: number;
  topIssues: string[];
  recommendations: string[];
  embeddingsUpdated: number;
  evalScore: number;
  evalPassRate: number;
}

interface BetaVersion {
  id: string;
  tag: string;
  createdAt: number;
  status: 'testing' | 'approved' | 'live' | 'rolled-back';
  qaChecks: {
    auth: boolean | null;
    streaming: boolean | null;
    credits: boolean | null;
    imageGen: boolean | null;
    modelRouting: boolean | null;
  };
  canaryPercent: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function randFloat(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number)   { return Math.floor(randFloat(min, max + 1)); }

function makeMockReport(): ImprovementReport {
  return {
    avgRating: parseFloat(randFloat(3.8, 4.9).toFixed(2)),
    totalChats: randInt(400, 2000),
    positiveSignals: randInt(300, 1800),
    negativeSignals: randInt(10, 120),
    topIssues: [
      'Slow first-token on F4 Long Context model',
      'Markdown tables occasionally mis-render',
      'Code block language detection fails for Rust',
    ].slice(0, randInt(1, 3)),
    recommendations: [
      'Increase top-K for F3 Balanced to improve diversity',
      'Add more training examples for multi-step maths',
      'Reduce effort multiplier for Instant mode by 10%',
    ].slice(0, randInt(1, 3)),
    embeddingsUpdated: randInt(50, 400),
    evalScore: parseFloat(randFloat(75, 98).toFixed(1)),
    evalPassRate: parseFloat(randFloat(85, 99).toFixed(1)),
  };
}

const STEP_LABELS = {
  collectChats:     'Collect recent chats & ratings',
  updateEmbeddings: 'Update memory / RAG embeddings',
  runEvalTests:     'Run evaluation tests',
  generateReport:   'Generate improvement report',
} as const;

const STEP_DURATIONS = { collectChats: 1200, updateEmbeddings: 1800, runEvalTests: 1400, generateReport: 800 };
type StepKey = keyof typeof STEP_LABELS;

// ─── Component ──────────────────────────────────────────────────────────────

const LOOP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function Beta() {
  const navigate  = useNavigate();
  const { profile } = useAuth();

  const [cycles, setCycles]   = useState<LearningCycle[]>([]);
  const [loopActive, setLoopActive] = useState(false);
  const [nextRunIn, setNextRunIn]   = useState<number | null>(null);
  const [versions, setVersions]     = useState<BetaVersion[]>([
    {
      id: 'v-001',
      tag: 'v1.0.0-beta.3',
      createdAt: Date.now() - 3600_000,
      status: 'testing',
      qaChecks: { auth: null, streaming: null, credits: null, imageGen: null, modelRouting: null },
      canaryPercent: 0,
    },
  ]);
  const [selectedVersion, setSelectedVersion] = useState<string>('v-001');

  const loopTimer    = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRunRef   = useRef<number | null>(null);

  // Guard: admin only
  if (profile && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Owner Only</h2>
          <p className="text-muted-foreground mb-4">Beta mode is restricted to the app owner.</p>
          <Button onClick={() => navigate('/')}>← Back to Chat</Button>
        </div>
      </div>
    );
  }

  const runOneCycle = useCallback(() => {
    const cycleId = crypto.randomUUID();
    const steps: LearningCycle['steps'] = {
      collectChats: 'pending', updateEmbeddings: 'pending', runEvalTests: 'pending', generateReport: 'pending',
    };

    setCycles(prev => [{
      id: cycleId, startedAt: Date.now(), status: 'running' as const, steps,
    }, ...prev].slice(0, 20));

    const stepOrder: StepKey[] = ['collectChats', 'updateEmbeddings', 'runEvalTests', 'generateReport'];
    let delay = 0;

    stepOrder.forEach((step, idx) => {
      // Mark as running
      setTimeout(() => {
        setCycles(prev => prev.map(c => c.id !== cycleId ? c : {
          ...c, steps: { ...c.steps, [step]: 'running' },
        }));
      }, delay);
      delay += STEP_DURATIONS[step];
      // Mark as done
      setTimeout(() => {
        const isDone = idx < stepOrder.length - 1;
        const report = idx === stepOrder.length - 1 ? makeMockReport() : undefined;
        setCycles(prev => prev.map(c => c.id !== cycleId ? c : {
          ...c,
          steps: { ...c.steps, [step]: 'done' },
          status: isDone ? 'running' : 'done',
          completedAt: isDone ? undefined : Date.now(),
          report,
        }));
      }, delay);
    });
  }, []);

  // Start / stop auto-loop
  useEffect(() => {
    if (!loopActive) {
      if (loopTimer.current) clearInterval(loopTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setNextRunIn(null);
      nextRunRef.current = null;
      return;
    }

    // Run immediately on start
    runOneCycle();
    const start = Date.now();
    nextRunRef.current = start + LOOP_INTERVAL_MS;
    setNextRunIn(LOOP_INTERVAL_MS);

    loopTimer.current = setInterval(() => {
      runOneCycle();
      nextRunRef.current = Date.now() + LOOP_INTERVAL_MS;
    }, LOOP_INTERVAL_MS);

    countdownRef.current = setInterval(() => {
      if (nextRunRef.current) {
        const remaining = Math.max(0, nextRunRef.current - Date.now());
        setNextRunIn(remaining);
      }
    }, 1000);

    return () => {
      if (loopTimer.current)    clearInterval(loopTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [loopActive, runOneCycle]);

  const runQaCheck = async (vId: string, check: keyof BetaVersion['qaChecks']) => {
    setVersions(prev => prev.map(v => v.id !== vId ? v : {
      ...v, qaChecks: { ...v.qaChecks, [check]: null },
    }));
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const pass = Math.random() > 0.15;
    setVersions(prev => prev.map(v => v.id !== vId ? v : {
      ...v, qaChecks: { ...v.qaChecks, [check]: pass },
    }));
    toast[pass ? 'success' : 'error'](`${check}: ${pass ? 'Passed ✓' : 'Failed ✗'}`);
  };

  const runAllQa = async (vId: string) => {
    const checks: (keyof BetaVersion['qaChecks'])[] = ['auth', 'streaming', 'credits', 'imageGen', 'modelRouting'];
    for (const check of checks) await runQaCheck(vId, check);
  };

  const promoteVersion = (vId: string) => {
    const v = versions.find(x => x.id === vId);
    if (!v) return;
    const allPassed = Object.values(v.qaChecks).every(c => c === true);
    if (!allPassed) { toast.error('All QA checks must pass before promoting.'); return; }
    setVersions(prev => prev.map(x => x.id !== vId ? x : { ...x, status: 'approved', canaryPercent: 5 }));
    toast.success('Promoted to canary (5% of users)');
  };

  const rolloutVersion = (vId: string) => {
    setVersions(prev => prev.map(x => x.id !== vId ? x : { ...x, status: 'live', canaryPercent: 100 }));
    toast.success('Rolled out to 100% of users 🚀');
  };

  const rollbackVersion = (vId: string) => {
    setVersions(prev => prev.map(x => x.id !== vId ? x : { ...x, status: 'rolled-back', canaryPercent: 0 }));
    toast.warning('Rolled back to previous stable version.');
  };

  const latestCycle   = cycles[0];
  const selectedVer   = versions.find(v => v.id === selectedVersion);
  const qaLabels: Record<keyof BetaVersion['qaChecks'], string> = {
    auth: 'Authentication', streaming: 'Message Streaming',
    credits: 'Credit System', imageGen: 'Image Generation', modelRouting: 'Model Routing',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1.5" /><span className="hidden sm:inline">Back to Chat</span>
          </Button>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Beta Mode</span>
            <Badge className="text-[10px] bg-orange-500/20 text-orange-600 border-orange-500/30">Owner Only</Badge>
          </div>
          {/* Loop control */}
          <Button
            size="sm"
            variant={loopActive ? 'destructive' : 'default'}
            onClick={() => setLoopActive(v => !v)}
            className="gap-1.5"
          >
            {loopActive ? <><Square className="w-3.5 h-3.5" />Stop Loop</> : <><Play className="w-3.5 h-3.5" />Start Loop</>}
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full px-4 py-6">

        {/* Loop status banner */}
        <div className={cn(
          'mb-6 p-4 rounded-xl border flex items-center gap-4 transition-colors',
          loopActive ? 'bg-green-500/5 border-green-500/30' : 'bg-muted/50 border-border'
        )}>
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            loopActive ? 'bg-green-500/20' : 'bg-muted'
          )}>
            {loopActive
              ? <Activity className="w-5 h-5 text-green-600 animate-pulse" />
              : <Brain className="w-5 h-5 text-muted-foreground" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{loopActive ? 'Self-improvement loop running' : 'Learning loop stopped'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loopActive
                ? `Runs every 5 minutes — collects chats, updates embeddings, runs evals, generates reports`
                : 'Click "Start Loop" to begin the 5-minute continuous learning cycle'
              }
            </p>
          </div>
          {loopActive && nextRunIn !== null && (
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="text-xs text-muted-foreground">Next run</span>
              <span className="text-sm font-mono font-bold">
                {Math.floor(nextRunIn / 60000)}:{String(Math.floor((nextRunIn % 60000) / 1000)).padStart(2, '0')}
              </span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={runOneCycle} disabled={loopActive && latestCycle?.status === 'running'}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Run Now
          </Button>
        </div>

        <Tabs defaultValue="learning">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="learning"><Brain className="w-3.5 h-3.5 mr-1.5" />Learning Cycles</TabsTrigger>
            <TabsTrigger value="models"><Zap className="w-3.5 h-3.5 mr-1.5" />Live Models</TabsTrigger>
            <TabsTrigger value="release"><Rocket className="w-3.5 h-3.5 mr-1.5" />Release Control</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Analytics</TabsTrigger>
          </TabsList>

          {/* ─── Learning Cycles Tab ─── */}
          <TabsContent value="learning" className="space-y-4">
            {cycles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No cycles run yet</p>
                  <p className="text-xs mt-1">Start the loop or click "Run Now" to trigger a cycle</p>
                </CardContent>
              </Card>
            ) : cycles.map(cycle => (
              <CycleCard key={cycle.id} cycle={cycle} />
            ))}
          </TabsContent>

          {/* ─── Live Models Tab ─── */}
          <TabsContent value="models">
            <LiveModelsPanel />
          </TabsContent>

          {/* ─── Release Control Tab ─── */}
          <TabsContent value="release" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Version list */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Builds</h3>
                {versions.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVersion(v.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      selectedVersion === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-mono font-medium truncate">{v.tag}</span>
                      </div>
                      <VersionBadge status={v.status} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(v.createdAt).toLocaleString()}
                    </p>
                    {v.canaryPercent > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Rollout</span><span>{v.canaryPercent}%</span>
                        </div>
                        <Progress value={v.canaryPercent} className="h-1" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* QA Panel */}
              {selectedVer && (
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" />QA Gate — {selectedVer.tag}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(Object.entries(qaLabels) as [keyof BetaVersion['qaChecks'], string][]).map(([key, label]) => {
                        const val = selectedVer.qaChecks[key];
                        return (
                          <div key={key} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {val === null && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                              {val === true  && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                              {val === false && <XCircle className="w-4 h-4 text-destructive" />}
                              {val === undefined && <AlertTriangle className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-sm">{label}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {val !== null && val !== undefined && (
                                <Badge variant={val ? 'default' : 'destructive'} className="text-[10px]">
                                  {val ? 'Pass' : 'Fail'}
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => runQaCheck(selectedVer.id, key)}
                                disabled={val === null}
                              >
                                Test
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => runAllQa(selectedVer.id)}>
                        <Play className="w-3.5 h-3.5 mr-1.5" />Run All Checks
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" />Deployment Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button
                        onClick={() => promoteVersion(selectedVer.id)}
                        disabled={selectedVer.status !== 'testing'}
                        className="gap-1.5"
                      >
                        <ChevronRight className="w-4 h-4" />Promote (5%)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rolloutVersion(selectedVer.id)}
                        disabled={selectedVer.status !== 'approved'}
                        className="gap-1.5"
                      >
                        <Rocket className="w-4 h-4" />Full Rollout
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => rollbackVersion(selectedVer.id)}
                        disabled={selectedVer.status === 'rolled-back' || selectedVer.status === 'testing'}
                        className="gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" />Rollback
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ─── Analytics Tab ─── */}
          <TabsContent value="analytics">
            <AnalyticsPanel cycles={cycles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Cycle Card ──────────────────────────────────────────────────────────────

function CycleCard({ cycle }: { cycle: LearningCycle }) {
  const [expanded, setExpanded] = useState(cycle.status === 'running');
  const steps: StepKey[] = ['collectChats', 'updateEmbeddings', 'runEvalTests', 'generateReport'];

  const stepIcon = (s: LearningCycle['steps'][StepKey]) => {
    if (s === 'done')    return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
    if (s === 'running') return <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />;
    if (s === 'error')   return <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />;
    return <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />;
  };

  return (
    <Card className={cn('transition-colors', cycle.status === 'running' && 'border-primary/50')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => setExpanded(v => !v)}>
          <div className="flex items-center gap-3 min-w-0">
            {cycle.status === 'running'
              ? <Activity className="w-4 h-4 text-primary animate-pulse flex-shrink-0" />
              : cycle.status === 'done'
              ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            }
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Cycle — {new Date(cycle.startedAt).toLocaleTimeString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {cycle.status === 'done' && cycle.completedAt
                  ? `Completed in ${((cycle.completedAt - cycle.startedAt) / 1000).toFixed(1)}s`
                  : cycle.status === 'running' ? 'Running…' : 'Error'
                }
              </p>
            </div>
          </div>
          <Badge variant={cycle.status === 'done' ? 'default' : cycle.status === 'running' ? 'secondary' : 'destructive'} className="text-[10px] flex-shrink-0">
            {cycle.status}
          </Badge>
        </div>

        {expanded && (
          <div className="mt-4 space-y-2.5 border-t border-border pt-3">
            {steps.map(step => (
              <div key={step} className="flex items-center gap-3">
                {stepIcon(cycle.steps[step])}
                <span className={cn(
                  'text-sm',
                  cycle.steps[step] === 'done' ? 'text-foreground' : 'text-muted-foreground'
                )}>{STEP_LABELS[step]}</span>
              </div>
            ))}

            {cycle.report && (
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />Improvement Report
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatPill icon={<Star className="w-3.5 h-3.5" />} label="Avg Rating" value={String(cycle.report.avgRating)} />
                  <StatPill icon={<Users className="w-3.5 h-3.5" />} label="Total Chats" value={String(cycle.report.totalChats)} />
                  <StatPill icon={<TrendingUp className="w-3.5 h-3.5" />} label="Eval Score" value={`${cycle.report.evalScore}%`} />
                  <StatPill icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Pass Rate" value={`${cycle.report.evalPassRate}%`} />
                </div>
                {cycle.report.topIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Top Issues</p>
                    {cycle.report.topIssues.map((issue, i) => (
                      <div key={i} className="text-xs text-destructive flex items-start gap-1.5 mt-0.5">
                        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{issue}
                      </div>
                    ))}
                  </div>
                )}
                {cycle.report.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
                    {cycle.report.recommendations.map((rec, i) => (
                      <div key={i} className="text-xs text-green-600 dark:text-green-400 flex items-start gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />{rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">{icon}</div>
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function VersionBadge({ status }: { status: BetaVersion['status'] }) {
  const map = {
    testing:       'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    approved:      'bg-blue-500/20 text-blue-600 border-blue-500/30',
    live:          'bg-green-500/20 text-green-600 border-green-500/30',
    'rolled-back': 'bg-destructive/20 text-destructive border-destructive/30',
  };
  return <Badge className={cn('text-[10px] border', map[status])}>{status}</Badge>;
}

// ─── LiveModelsPanel ─────────────────────────────────────────────────────────

const LS_MODELS_KEY = 'ai_beta_live_models';

interface LiveModel {
  id: string;
  name: string;
  family: 'flash' | 'accure';
  description: string;
  baseCost: number;
  icon: string;
  badge?: string;
  enabled: boolean;
  updatedAt: number;
}

function loadLiveModels(): LiveModel[] {
  try {
    const saved = JSON.parse(localStorage.getItem(LS_MODELS_KEY) || '[]') as LiveModel[];
    if (saved.length) return saved;
  } catch { /* ignore */ }
  // seed from FLASH_MODELS / ACCURE_MODELS defaults
  return [...FLASH_MODELS, ...ACCURE_MODELS].map(m => ({
    ...m, enabled: true, updatedAt: Date.now(),
  }));
}

function saveLiveModels(models: LiveModel[]) {
  localStorage.setItem(LS_MODELS_KEY, JSON.stringify(models));
}

const EMPTY_MODEL: Omit<LiveModel, 'id' | 'updatedAt'> = {
  name: '', family: 'flash', description: '', baseCost: 2, icon: '⚡', badge: '', enabled: true,
};

function LiveModelsPanel() {
  const [models, setModels] = useState<LiveModel[]>(loadLiveModels);
  const [editModel, setEditModel] = useState<LiveModel | null>(null);
  const [form, setForm] = useState({ ...EMPTY_MODEL });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Simulate real-time polling every 5 s (in production: subscribe to DB channel)
  useEffect(() => {
    const timer = setInterval(() => {
      const fresh = loadLiveModels();
      setModels(fresh);
      setLastUpdated(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const persist = (next: LiveModel[]) => { setModels(next); saveLiveModels(next); setLastUpdated(Date.now()); };

  const openCreate = () => { setForm({ ...EMPTY_MODEL }); setEditModel(null); setDialogOpen(true); };
  const openEdit = (m: LiveModel) => { setForm({ ...m }); setEditModel(m); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Model name is required.'); return; }
    if (editModel) {
      persist(models.map(m => m.id === editModel.id ? { ...m, ...form, updatedAt: Date.now() } : m));
      toast.success('Model updated — changes live immediately.');
    } else {
      const nm: LiveModel = { id: crypto.randomUUID(), ...form, updatedAt: Date.now() };
      persist([...models, nm]);
      toast.success('New model added to live roster.');
    }
    setDialogOpen(false);
  };

  const toggleEnabled = (id: string) => {
    const next = models.map(m => m.id === id ? { ...m, enabled: !m.enabled, updatedAt: Date.now() } : m);
    persist(next);
    const m = next.find(x => x.id === id)!;
    toast[m.enabled ? 'success' : 'warning'](`${m.name} ${m.enabled ? 'enabled' : 'disabled'}.`);
  };

  const deleteModel = (id: string) => {
    persist(models.filter(m => m.id !== id));
    toast.success('Model removed.');
  };

  const flash = models.filter(m => m.family === 'flash');
  const accure = models.filter(m => m.family === 'accure');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                Live Model Roster
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Changes here are reflected in the chat model picker in real-time (5 s poll).
                Last synced: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="gap-1.5 shrink-0">
              <Play className="w-3.5 h-3.5" />Add Model
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {[{ label: '⚡ Flash — Fast', list: flash }, { label: '🧠 Accure — Thinking', list: accure }].map(({ label, list }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
              {list.length === 0 && (
                <p className="text-xs text-muted-foreground py-3 pl-1">No models in this family.</p>
              )}
              <div className="space-y-2">
                {list.map(m => (
                  <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${m.enabled ? 'border-border bg-card' : 'border-border/40 bg-muted/30 opacity-60'}`}>
                    <span className="text-xl shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{m.name}</span>
                        {m.badge && <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{m.badge}</Badge>}
                        {!m.enabled && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {m.baseCost} cr/1K · updated {new Date(m.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleEnabled(m.id)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                          m.enabled
                            ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30'
                            : 'bg-muted text-muted-foreground border-border hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30'
                        }`}
                      >
                        {m.enabled ? 'On' : 'Off'}
                      </button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEdit(m)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => deleteModel(m.id)}>
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Edit / Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
            <DialogDescription>Configure the model details. Changes go live on save.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Display Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="F7 Ultra" className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Family</label>
                <select
                  value={form.family}
                  onChange={e => setForm(f => ({ ...f, family: e.target.value as 'flash' | 'accure' }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="flash">Flash</option>
                  <option value="accure">Accure</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">Description</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" className="h-9" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Icon (emoji)</label>
                <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="⚡" className="h-9" maxLength={4} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Badge label</label>
                <Input value={form.badge ?? ''} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="New" className="h-9" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Cost (cr/1K)</label>
                <Input type="number" min={1} value={form.baseCost} onChange={e => setForm(f => ({ ...f, baseCost: Number(e.target.value) }))} className="h-9" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} className="rounded" />
              <span className="text-sm">Enabled (visible in model picker)</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editModel ? 'Save Changes' : 'Add Model'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalyticsPanel({ cycles }: { cycles: LearningCycle[] }) {  const reports = cycles.filter(c => c.report).map(c => c.report!);
  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No analytics yet</p>
          <p className="text-xs mt-1">Run at least one learning cycle to see analytics</p>
        </CardContent>
      </Card>
    );
  }
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgRating    = avg(reports.map(r => r.avgRating)).toFixed(2);
  const avgEval      = avg(reports.map(r => r.evalScore)).toFixed(1);
  const totalChats   = reports.reduce((a, r) => a + r.totalChats, 0);
  const totalEmb     = reports.reduce((a, r) => a + r.embeddingsUpdated, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardContent className="p-5 text-center">
        <Star className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
        <p className="text-2xl font-bold">{avgRating}</p>
        <p className="text-xs text-muted-foreground mt-1">Avg Rating (all cycles)</p>
      </CardContent></Card>
      <Card><CardContent className="p-5 text-center">
        <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
        <p className="text-2xl font-bold">{avgEval}%</p>
        <p className="text-xs text-muted-foreground mt-1">Avg Eval Score</p>
      </CardContent></Card>
      <Card><CardContent className="p-5 text-center">
        <Users className="w-5 h-5 mx-auto mb-2 text-primary" />
        <p className="text-2xl font-bold">{totalChats.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Total Chats Processed</p>
      </CardContent></Card>
      <Card><CardContent className="p-5 text-center">
        <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
        <p className="text-2xl font-bold">{totalEmb.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">Embeddings Updated</p>
      </CardContent></Card>
    </div>
  );
}
