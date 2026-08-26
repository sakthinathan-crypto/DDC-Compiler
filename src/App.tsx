import React, { useState, useEffect } from 'react';
import {
  Contest,
  Participant,
  ParticipantAccount,
  Question,
  Submission,
  LeaderboardEntry,
} from './types';
import { api } from './lib/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { ParticipantLogin } from './components/ParticipantLogin';
import { ParticipantSignUp } from './components/ParticipantSignUp';
import { ParticipantDashboardHub } from './components/ParticipantDashboardHub';
import { ParticipantProfile } from './components/ParticipantProfile';
import { MyResultsView } from './components/MyResultsView';
import { CompetitionDashboard } from './components/CompetitionDashboard';
import { QuestionWorkspace } from './components/QuestionWorkspace';
import { LeaderboardView } from './components/LeaderboardView';
import { ResultPage } from './components/ResultPage';
import { AdminDashboard } from './components/AdminDashboard';
import { RulesModal } from './components/RulesModal';
import { Bell, Sparkles } from 'lucide-react';
import { DEFAULT_CONTESTS } from './lib/constants';

export function App() {
  const [currentView, setCurrentView] = useState<
    | 'landing'
    | 'login'
    | 'signup'
    | 'dashboard'
    | 'contest_overview'
    | 'question'
    | 'leaderboard'
    | 'results'
    | 'profile'
    | 'result'
    | 'admin'
  >('landing');

  const [account, setAccount] = useState<ParticipantAccount | null>(null);
  const [contests, setContests] = useState<Contest[]>(DEFAULT_CONTESTS);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(DEFAULT_CONTESTS[0]);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [liveAlert, setLiveAlert] = useState<string | null>(null);

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Initial load: fetch contests and restore saved participant account session
  useEffect(() => {
    loadContests();
    checkSavedAccount();

    // Check URL hash for direct routing (e.g. #admin, #login, #signup)
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#login') {
        setCurrentView('login');
      } else if (hash === '#signup') {
        setCurrentView('signup');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    // Subscribe to real-time contest updates from Admin Center
    const unsubscribeContests = api.subscribeContests((updatedList) => {
      if (updatedList && updatedList.length > 0) {
        setContests(updatedList);
        setLiveAlert('Contest schedule or questions updated by Administrators.');
        setTimeout(() => setLiveAlert(null), 5000);
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHash);
      unsubscribeContests();
    };
  }, []);

  const loadContests = async () => {
    try {
      const list = await api.getContests();
      if (list && list.length > 0) {
        setContests(list);
        const flagship =
          list.find((c) => c.id === 'breach-the-bug-round-2') ||
          list.find((c) => c.id === 'breach-the-bug-round-3') ||
          list[0];
        setSelectedContest(flagship);
        loadContestQuestions(flagship.id);
      } else {
        setContests(DEFAULT_CONTESTS);
        setSelectedContest(DEFAULT_CONTESTS[0]);
        loadContestQuestions(DEFAULT_CONTESTS[0].id);
      }
    } catch (_) {
      setContests(DEFAULT_CONTESTS);
      setSelectedContest(DEFAULT_CONTESTS[0]);
      loadContestQuestions(DEFAULT_CONTESTS[0].id);
    }
  };

  const loadContestQuestions = async (contestId: string) => {
    try {
      const qs = await api.getQuestions(contestId);
      setQuestions(qs);
    } catch (_) {}
  };

  const checkSavedAccount = async () => {
    const savedAccountJson = localStorage.getItem('ddc_participant_account');
    if (savedAccountJson) {
      try {
        const parsed: ParticipantAccount = JSON.parse(savedAccountJson);
        setAccount(parsed);

        // Fetch fresh profile from server
        const fresh = await api.getParticipantProfile(parsed.participantId);
        setAccount(fresh);
        localStorage.setItem('ddc_participant_account', JSON.stringify(fresh));

        // Restore active contest if any
        const savedContestId = localStorage.getItem('ddc_contest_id');
        if (savedContestId) {
          const res = await api.getParticipant(savedContestId, fresh.participantId);
          setParticipant(res.participant);
          setTimeRemainingSeconds(res.timeRemainingSeconds);
          loadContestQuestions(savedContestId);
          loadParticipantSubmissions(savedContestId, fresh.participantId);
        }
      } catch (_) {
        localStorage.removeItem('ddc_participant_account');
      }
    }
  };

  // Timer countdown hook (synchronized with server ticks)
  useEffect(() => {
    if (!participant || participant.status === 'completed' || timeRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [participant?.participantId, participant?.status, timeRemainingSeconds]);

  // Periodic resync with server every 30 seconds for clock drift
  useEffect(() => {
    if (!participant || !selectedContest || participant.status === 'completed') return;

    const syncInterval = setInterval(async () => {
      try {
        const res = await api.getParticipant(selectedContest.id, participant.participantId);
        setParticipant(res.participant);
        setTimeRemainingSeconds(res.timeRemainingSeconds);
      } catch (_) {}
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [participant?.participantId, selectedContest?.id]);

  const loadParticipantSubmissions = async (cId: string, pId: string) => {
    try {
      const subs = await api.getSubmissions(cId, pId);
      setSubmissions(subs);
    } catch (_) {}
  };

  const handleTimeExpired = async () => {
    if (participant && selectedContest) {
      try {
        const res = await api.getParticipant(selectedContest.id, participant.participantId);
        setParticipant(res.participant);
        const lb = await api.getLeaderboard(selectedContest.id);
        setLeaderboard(lb);
        setCurrentView('result');
      } catch (_) {}
    }
  };

  // Handle participant entering a contest
  const handleEnterContest = async (contest: Contest) => {
    setSelectedContest(contest);
    loadContestQuestions(contest.id);

    // If not logged in, prompt to login
    if (!account) {
      setCurrentView('login');
      return;
    }

    try {
      // Join or resume contest session with logged-in account
      const joinRes = await api.joinContest(contest.id, account.participantId);
      setParticipant(joinRes.participant);
      setTimeRemainingSeconds(joinRes.timeRemainingSeconds);
      localStorage.setItem('ddc_contest_id', contest.id);
      loadParticipantSubmissions(contest.id, account.participantId);

      // Open contest overview or question workspace
      setCurrentView('contest_overview');
    } catch (err: any) {
      alert(err.message || 'Failed to join contest');
    }
  };

  const handleLoginSuccess = (loggedInAccount: ParticipantAccount) => {
    setAccount(loggedInAccount);
    localStorage.setItem('ddc_participant_account', JSON.stringify(loggedInAccount));
    setCurrentView('dashboard');
  };

  const handleSignUpSuccess = (newAccount: ParticipantAccount) => {
    setAccount(newAccount);
    localStorage.setItem('ddc_participant_account', JSON.stringify(newAccount));
    setCurrentView('dashboard');
  };

  const handleSubmissionSuccess = (
    submission: Submission,
    updatedParticipant: Participant
  ) => {
    setParticipant(updatedParticipant);
    setSubmissions((prev) => [submission, ...prev.filter((s) => s.id !== submission.id)]);

    if (selectedContest) {
      api.getLeaderboard(selectedContest.id).then((lb) => setLeaderboard(lb));
    }
  };

  const handleFinishEarly = async () => {
    if (
      window.confirm(
        'Are you sure you want to finish the competition now and finalize your score?'
      )
    ) {
      if (participant && selectedContest) {
        try {
          await api.participantAction(selectedContest.id, participant.participantId, 'finish');
          const res = await api.getParticipant(selectedContest.id, participant.participantId);
          setParticipant(res.participant);
          const lb = await api.getLeaderboard(selectedContest.id);
          setLeaderboard(lb);
          setCurrentView('result');
        } catch (_) {}
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm('Log out from Designers Domain Club Compiler?')) {
      localStorage.removeItem('ddc_participant_account');
      localStorage.removeItem('ddc_contest_id');
      localStorage.removeItem('ddc_participant_id');
      setAccount(null);
      setParticipant(null);
      setTimeRemainingSeconds(0);
      setCurrentView('landing');
    }
  };

  const selectedQuestion = questions.find((q) => q.id === selectedQuestionId);

  return (
    <div className="min-h-screen flex flex-col bg-[#080808] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Real-time Toast Alert */}
      {liveAlert && (
        <div className="fixed top-16 right-4 z-50 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{liveAlert}</span>
        </div>
      )}

      {/* Universal Header with Official Club Logo */}
      <Header
        activeContest={selectedContest}
        participant={participant}
        account={account}
        timeRemainingSeconds={timeRemainingSeconds}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'rules') {
            setIsRulesModalOpen(true);
          } else {
            setCurrentView(view as any);
          }
        }}
        onLogout={account ? handleLogout : undefined}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 flex flex-col">
        {/* Landing Page (Public Catalog) */}
        {currentView === 'landing' && (
          <LandingPage
            contests={contests}
            account={account}
            onEnterContest={handleEnterContest}
            onViewLeaderboard={(c) => {
              setSelectedContest(c);
              setCurrentView('leaderboard');
            }}
            onViewRules={(c) => {
              if (c) setSelectedContest(c);
              setIsRulesModalOpen(true);
            }}
            onNavigateToLogin={() => setCurrentView('login')}
            onNavigateToSignUp={() => setCurrentView('signup')}
            onNavigateToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {/* Participant Login View */}
        {currentView === 'login' && (
          <ParticipantLogin
            onSuccess={handleLoginSuccess}
            onNavigateToSignUp={() => setCurrentView('signup')}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {/* Participant Sign Up View */}
        {currentView === 'signup' && (
          <ParticipantSignUp
            onSuccess={handleSignUpSuccess}
            onNavigateToLogin={() => setCurrentView('login')}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {/* Participant Dashboard Hub (Logged-in Home) */}
        {currentView === 'dashboard' && account && (
          <ParticipantDashboardHub
            account={account}
            contests={contests}
            onEnterContest={handleEnterContest}
            onViewResults={() => setCurrentView('results')}
            onViewProfile={() => setCurrentView('profile')}
            onViewRules={(c) => {
              if (c) setSelectedContest(c);
              setIsRulesModalOpen(true);
            }}
            onLogout={handleLogout}
          />
        )}

        {/* My Performance Results */}
        {currentView === 'results' && account && (
          <MyResultsView
            account={account}
            onSelectContestLeaderboard={(contestId) => {
              const c = contests.find((x) => x.id === contestId);
              if (c) setSelectedContest(c);
              setCurrentView('leaderboard');
            }}
            onEnterContest={(contestId) => {
              const c = contests.find((x) => x.id === contestId);
              if (c) handleEnterContest(c);
            }}
            onBrowseContests={() => setCurrentView('dashboard')}
          />
        )}

        {/* Participant Profile & Settings */}
        {currentView === 'profile' && account && (
          <ParticipantProfile
            account={account}
            onProfileUpdate={(updated) => {
              setAccount(updated);
              localStorage.setItem('ddc_participant_account', JSON.stringify(updated));
            }}
            onViewResults={() => setCurrentView('results')}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onLogout={handleLogout}
          />
        )}

        {/* Active Contest Overview & Question List */}
        {currentView === 'contest_overview' && participant && selectedContest && (
          <CompetitionDashboard
            contest={selectedContest}
            participant={participant}
            questions={questions}
            submissions={submissions}
            timeRemainingSeconds={timeRemainingSeconds}
            onSelectQuestion={(qId) => {
              setSelectedQuestionId(qId);
              setCurrentView('question');
            }}
            onFinishCompetition={handleFinishEarly}
            onBackToCatalog={() => setCurrentView('dashboard')}
          />
        )}

        {/* Coding & Debugging Workspace (Monaco Editor) */}
        {currentView === 'question' && selectedQuestion && participant && selectedContest && (
          <QuestionWorkspace
            contestId={selectedContest.id}
            contestTitle={selectedContest.title}
            question={selectedQuestion}
            participant={participant}
            timeRemainingSeconds={timeRemainingSeconds}
            onBack={() => setCurrentView('contest_overview')}
            onSubmitSuccess={handleSubmissionSuccess}
          />
        )}

        {/* Live Leaderboard View */}
        {currentView === 'leaderboard' && (
          <LeaderboardView
            currentParticipantId={account?.participantId || participant?.participantId}
            activeContest={selectedContest}
            contests={contests}
            onSelectContest={(c) => {
              setSelectedContest(c);
              loadContestQuestions(c.id);
            }}
            onBackToDashboard={() =>
              setCurrentView(participant ? 'contest_overview' : account ? 'dashboard' : 'landing')
            }
          />
        )}

        {/* Contest Finish & Celebratory Result View */}
        {currentView === 'result' && participant && (
          <ResultPage
            contest={selectedContest}
            participant={participant}
            questions={questions}
            submissions={submissions}
            leaderboard={leaderboard}
            onReviewQuestions={() => setCurrentView('contest_overview')}
            onReturnToDashboard={() => setCurrentView(account ? 'dashboard' : 'landing')}
          />
        )}

        {/* Admin Dashboard (Single Source of Truth, preserved & accessible via #admin) */}
        {currentView === 'admin' && (
          <AdminDashboard
            onBack={() => {
              loadContests();
              setCurrentView(account ? 'dashboard' : 'landing');
            }}
          />
        )}
      </main>

      {/* Universal Footer with Official Aegis Branding */}
      <Footer onNavigateToAdmin={() => setCurrentView('admin')} />

      {/* Rules and Guidelines Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        contest={selectedContest}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}

export default App;
