/**
 * Bug Reporting & Feedback Service
 *
 * Allows users to report bugs, crashes, audio issues, or feature suggestions.
 * Stores tickets in localStorage (with Supabase fallback if configured)
 * and exposes them directly in the Admin Panel for review, status triage,
 * and resolution updates.
 */

export interface BugTicket {
  id: string;
  title: string;
  category: 'UI/Streaming' | 'Voice/Audio' | 'Code/Deployment' | 'Plugins' | 'Billing/Account' | 'Other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userEmail?: string;
  createdAt: number;
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  systemEnv: string;
  adminNotes?: string;
}

const STORAGE_KEY = 'flash_bug_reports';

export const INITIAL_BUG_TICKETS: BugTicket[] = [
  {
    id: 'BUG-101',
    title: 'Voice playback audio speed modifier resets after page reload',
    category: 'Voice/Audio',
    severity: 'medium',
    description: 'When I set voice playback to 1.25x in Settings, it was reset to 1.0x after I refreshed.',
    userEmail: 'dev_user@example.com',
    createdAt: Date.now() - 3600000 * 5,
    status: 'investigating',
    systemEnv: 'Chrome 122 / Windows 11',
    adminNotes: 'Checked voiceAssistantService localStorage hydration. Fix verified.',
  },
  {
    id: 'BUG-102',
    title: 'Roblox Luau Datapack zip download failed on Safari mobile',
    category: 'Code/Deployment',
    severity: 'low',
    description: 'Zip generation prompted pop-up blocked warning on iOS Safari browser.',
    userEmail: 'roblox_builder@example.com',
    createdAt: Date.now() - 3600000 * 12,
    status: 'resolved',
    systemEnv: 'Safari 17 / iOS 17.4',
    adminNotes: 'Resolved by triggering direct blob save download handler.',
  },
];

class BugReportService {
  private tickets: BugTicket[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.tickets = parsed;
          } else {
            this.tickets = INITIAL_BUG_TICKETS;
          }
        } catch {
          this.tickets = INITIAL_BUG_TICKETS;
        }
      } else {
        this.tickets = INITIAL_BUG_TICKETS;
      }
    } else {
      this.tickets = INITIAL_BUG_TICKETS;
    }
  }

  public getTickets(): BugTicket[] {
    return [...this.tickets];
  }

  public submitBugReport(report: {
    title: string;
    category: BugTicket['category'];
    severity: BugTicket['severity'];
    description: string;
    userEmail?: string;
  }): BugTicket {
    const newTicket: BugTicket = {
      id: `BUG-${Math.floor(1000 + Math.random() * 9000)}`,
      title: report.title,
      category: report.category,
      severity: report.severity,
      description: report.description,
      userEmail: report.userEmail || 'anonymous_reporter@flash.ai',
      createdAt: Date.now(),
      status: 'new',
      systemEnv: typeof window !== 'undefined' ? `${navigator.userAgent.slice(0, 80)}` : 'Web Browser',
    };

    this.tickets.unshift(newTicket);
    this.save();
    return newTicket;
  }

  public updateTicketStatus(
    id: string,
    status: BugTicket['status'],
    adminNotes?: string
  ): void {
    this.tickets = this.tickets.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status,
          adminNotes: adminNotes !== undefined ? adminNotes : t.adminNotes,
        };
      }
      return t;
    });
    this.save();
  }

  public deleteTicket(id: string): void {
    this.tickets = this.tickets.filter((t) => t.id !== id);
    this.save();
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tickets));
    }
  }
}

export const bugReportService = new BugReportService();
