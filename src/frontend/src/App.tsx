import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import HistoryTab from "@/pages/HistoryTab";
import TodayTab from "@/pages/TodayTab";
import WeekTab from "@/pages/WeekTab";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  History,
  Loader2,
  LogOut,
  Zap,
} from "lucide-react";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AppInner() {
  const [activeTab, setActiveTab] = useState("today");
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-8">
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto">
              <Zap size={28} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold">
              Life Mastery Tracker
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Track your daily progress across all life dimensions and build
              lasting habits.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              data-ocid="auth.login_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Signing in…
                </>
              ) : (
                "Sign in to Get Started"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Secured by Internet Identity — no passwords required.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col min-h-screen"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 px-5 pt-5 pb-4 border-b border-border bg-background/90 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Zap size={16} className="text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold leading-none">
                  Life Mastery
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daily Excellence Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Desktop nav */}
              <TabsList className="hidden md:flex bg-muted/50 border border-border">
                <TabsTrigger
                  value="today"
                  data-ocid="nav.today_tab"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Today
                </TabsTrigger>
                <TabsTrigger
                  value="week"
                  data-ocid="nav.week_tab"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  This Week
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  data-ocid="nav.history_tab"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  History
                </TabsTrigger>
              </TabsList>
              <Button
                data-ocid="auth.logout_button"
                variant="ghost"
                size="sm"
                onClick={clear}
                className="text-muted-foreground hover:text-foreground"
                title="Sign out"
              >
                <LogOut size={16} />
                <span className="hidden md:inline ml-1.5">Sign out</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <TabsContent value="today" className="mt-0">
              <TodayTab />
            </TabsContent>
            <TabsContent value="week" className="mt-0">
              <WeekTab />
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <HistoryTab />
            </TabsContent>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden z-10 border-t border-border bg-card/95 backdrop-blur-sm">
          <TabsList className="w-full grid grid-cols-3 rounded-none h-16 bg-transparent">
            <TabsTrigger
              value="today"
              data-ocid="nav.today_tab"
              className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:text-primary data-[state=active]:bg-primary/10"
            >
              <CalendarDays size={20} />
              <span className="text-xs">Today</span>
            </TabsTrigger>
            <TabsTrigger
              value="week"
              data-ocid="nav.week_tab"
              className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:text-primary data-[state=active]:bg-primary/10"
            >
              <BarChart3 size={20} />
              <span className="text-xs">This Week</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              data-ocid="nav.history_tab"
              className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:text-primary data-[state=active]:bg-primary/10"
            >
              <History size={20} />
              <span className="text-xs">History</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      <Toaster richColors position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
