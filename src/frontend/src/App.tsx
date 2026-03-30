import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart2,
  Building2,
  Calendar,
  CalendarDays,
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Megaphone,
  MessageSquare,
  Newspaper,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Local type definitions matching backend.d.ts
type UserRole = { admin: null } | { user: null } | { guest: null };
interface NewsPost {
  id: bigint;
  title: string;
  body: string;
  author: Principal;
  timestamp: bigint;
}
interface Announcement {
  id: bigint;
  title: string;
  text: string;
  author: Principal;
  timestamp: bigint;
}
interface ForumTopic {
  id: bigint;
  title: string;
  body: string;
  author: Principal;
  timestamp: bigint;
}
interface ForumReply {
  id: bigint;
  topicId: bigint;
  body: string;
  author: Principal;
  timestamp: bigint;
}
interface Poll {
  id: bigint;
  question: string;
  options: string[];
  author: Principal;
  timestamp: bigint;
}
interface PollResults {
  pollId: bigint;
  question: string;
  options: string[];
  votes: bigint[];
  userVoted: [] | [bigint];
}
interface Event {
  id: bigint;
  title: string;
  description: string;
  date: string;
  location: string;
  author: Principal;
  timestamp: bigint;
}
interface Service {
  id: bigint;
  name: string;
  category: string;
  phone: string;
  description: string;
}
interface CommunityBackend {
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  isCallerAdmin(): Promise<boolean>;
  createNews(title: string, body: string): Promise<bigint>;
  getNews(): Promise<NewsPost[]>;
  deleteNews(id: bigint): Promise<void>;
  createAnnouncement(title: string, text: string): Promise<bigint>;
  getAnnouncements(): Promise<Announcement[]>;
  deleteAnnouncement(id: bigint): Promise<void>;
  createTopic(title: string, body: string): Promise<bigint>;
  getTopics(): Promise<ForumTopic[]>;
  createReply(topicId: bigint, body: string): Promise<bigint>;
  getReplies(topicId: bigint): Promise<ForumReply[]>;
  createPoll(question: string, options: string[]): Promise<bigint>;
  getPolls(): Promise<Poll[]>;
  vote(pollId: bigint, optionIndex: bigint): Promise<void>;
  getPollResults(pollId: bigint): Promise<[] | [PollResults]>;
  createEvent(
    title: string,
    description: string,
    date: string,
    location: string,
  ): Promise<bigint>;
  getEvents(): Promise<Event[]>;
  deleteEvent(id: bigint): Promise<void>;
  createService(
    name: string,
    category: string,
    phone: string,
    description: string,
  ): Promise<bigint>;
  getServices(): Promise<Service[]>;
  deleteService(id: bigint): Promise<void>;
}
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { getSecretParameter } from "./utils/urlParams";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв тому`;
  if (hours < 24) return `${hours} год тому`;
  if (days < 7) return `${days} дн тому`;
  return new Date(ms).toLocaleDateString("uk-UA");
}

function truncatePrincipal(p: { toString(): string }): string {
  const s = p.toString();
  return s.length > 12 ? `${s.slice(0, 6)}...${s.slice(-4)}` : s;
}

function isAdmin(role: UserRole | null): boolean {
  return role !== null && "admin" in role;
}

function isUser(role: UserRole | null): boolean {
  return role !== null && ("admin" in role || "user" in role);
}

function isGuest(role: UserRole | null): boolean {
  return role === null || "guest" in role;
}

function RoleBadge({ role }: { role: UserRole | null }) {
  if (!role) return null;
  if ("admin" in role)
    return (
      <Badge className="bg-primary text-primary-foreground text-xs">
        Адмін
      </Badge>
    );
  if ("user" in role)
    return (
      <Badge variant="secondary" className="text-xs">
        Модератор
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs">
      Учасник
    </Badge>
  );
}

function EmptyState({
  message,
  icon,
}: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      {icon && <div className="text-4xl opacity-40">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── News Tab ──────────────────────────────────────────────────────────────────

function NewsTab({ role }: { role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: news = [], isLoading } = useQuery<NewsPost[]>({
    queryKey: ["news"],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getNews() : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createNews(title, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      setTitle("");
      setBody("");
      setShowForm(false);
      toast.success("Новину опубліковано");
    },
    onError: () => toast.error("Помилка при створенні"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as CommunityBackend).deleteNews(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      toast.success("Видалено");
    },
  });

  const sorted = [...news].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-4">
      {isUser(role) && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="news.open_modal_button"
            >
              <Plus className="w-4 h-4" /> Додати новину
            </Button>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">
                  Нова новина
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Заголовок"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-ocid="news.input"
                />
                <Textarea
                  placeholder="Текст новини..."
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  data-ocid="news.textarea"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={!title || !body || createMut.isPending}
                    data-ocid="news.submit_button"
                  >
                    {createMut.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Опублікувати
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    data-ocid="news.cancel_button"
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="news.loading_state"
        >
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div data-ocid="news.empty_state">
          <EmptyState
            message="Новин поки немає. Будьте першим!"
            icon={<Newspaper />}
          />
        </div>
      )}
      <div className="space-y-4">
        {sorted.map((n, i) => (
          <motion.div
            key={String(n.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="shadow-card hover:shadow-md transition-shadow"
              data-ocid={`news.item.${i + 1}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg leading-snug">
                    {n.title}
                  </CardTitle>
                  {isUser(role) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive shrink-0 h-8 w-8"
                      onClick={() => deleteMut.mutate(n.id)}
                      data-ocid={`news.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs flex gap-2 items-center">
                  <User className="w-3 h-3" />
                  {truncatePrincipal(n.author)} · {formatTimestamp(n.timestamp)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {n.body}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────────────────────

function AnnouncementsTab({ role }: { role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getAnnouncements() : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createAnnouncement(title, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setTitle("");
      setText("");
      setShowForm(false);
      toast.success("Оголошення опубліковано");
    },
    onError: () => toast.error("Помилка"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as CommunityBackend).deleteAnnouncement(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Видалено");
    },
  });

  const sorted = [...announcements].sort((a, b) =>
    Number(b.timestamp - a.timestamp),
  );

  return (
    <div className="space-y-4">
      {isUser(role) && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="announcements.open_modal_button"
            >
              <Plus className="w-4 h-4" /> Додати оголошення
            </Button>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">
                  Нове оголошення
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Заголовок"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-ocid="announcements.input"
                />
                <Textarea
                  placeholder="Текст оголошення..."
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  data-ocid="announcements.textarea"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={!title || !text || createMut.isPending}
                    data-ocid="announcements.submit_button"
                  >
                    {createMut.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Опублікувати
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    data-ocid="announcements.cancel_button"
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="announcements.loading_state"
        >
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div data-ocid="announcements.empty_state">
          <EmptyState message="Оголошень поки немає" icon={<Megaphone />} />
        </div>
      )}
      <div className="space-y-3">
        {sorted.map((a, i) => (
          <motion.div
            key={String(a.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card
              className="border-l-4 border-l-accent shadow-card"
              data-ocid={`announcements.item.${i + 1}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-base">
                    {a.title}
                  </CardTitle>
                  {isUser(role) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive shrink-0 h-8 w-8"
                      onClick={() => deleteMut.mutate(a.id)}
                      data-ocid={`announcements.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {truncatePrincipal(a.author)} · {formatTimestamp(a.timestamp)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {a.text}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Forum Tab ─────────────────────────────────────────────────────────────────

function ForumReplies({
  topicId,
  role,
}: { topicId: bigint; role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [replyBody, setReplyBody] = useState("");

  const { data: replies = [], isLoading } = useQuery<ForumReply[]>({
    queryKey: ["replies", String(topicId)],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getReplies(topicId) : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createReply(topicId, replyBody),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["replies", String(topicId)] });
      setReplyBody("");
      toast.success("Відповідь додано");
    },
    onError: () => toast.error("Помилка"),
  });

  const sorted = [...replies].sort((a, b) => Number(a.timestamp - b.timestamp));

  return (
    <div className="space-y-3 mt-4">
      <Separator />
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Відповіді
      </h3>
      {isLoading && <Loader2 className="animate-spin text-primary w-5 h-5" />}
      {!isLoading && sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">Відповідей ще немає</p>
      )}
      {sorted.map((r, i) => (
        <div
          key={String(r.id)}
          className="bg-muted/50 rounded-md p-3"
          data-ocid={`forum.item.${i + 1}`}
        >
          <p className="text-sm whitespace-pre-wrap">{r.body}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {truncatePrincipal(r.author)} · {formatTimestamp(r.timestamp)}
          </p>
        </div>
      ))}
      {!isGuest(role) && (
        <div className="space-y-2 pt-2">
          <Textarea
            placeholder="Написати відповідь..."
            rows={3}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            data-ocid="forum.textarea"
          />
          <Button
            size="sm"
            onClick={() => createMut.mutate()}
            disabled={!replyBody || createMut.isPending}
            data-ocid="forum.submit_button"
          >
            {createMut.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Відповісти
          </Button>
        </div>
      )}
    </div>
  );
}

function ForumTab({ role }: { role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: topics = [], isLoading } = useQuery<ForumTopic[]>({
    queryKey: ["topics"],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getTopics() : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createTopic(title, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      setTitle("");
      setBody("");
      setShowForm(false);
      toast.success("Тему створено");
    },
    onError: () => toast.error("Помилка"),
  });

  const sorted = [...topics].sort((a, b) => Number(b.timestamp - a.timestamp));

  if (selectedTopic) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTopic(null)}
          className="gap-1"
          data-ocid="forum.secondary_button"
        >
          <ArrowLeft className="w-4 h-4" /> Назад до тем
        </Button>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-xl">
              {selectedTopic.title}
            </CardTitle>
            <CardDescription>
              {truncatePrincipal(selectedTopic.author)} ·{" "}
              {formatTimestamp(selectedTopic.timestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {selectedTopic.body}
            </p>
            <ForumReplies topicId={selectedTopic.id} role={role} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isGuest(role) && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="forum.open_modal_button"
            >
              <Plus className="w-4 h-4" /> Нова тема
            </Button>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">
                  Нова тема
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Назва теми"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-ocid="forum.input"
                />
                <Textarea
                  placeholder="Опис теми..."
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={!title || !body || createMut.isPending}
                    data-ocid="forum.primary_button"
                  >
                    {createMut.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Створити тему
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    data-ocid="forum.cancel_button"
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="forum.loading_state"
        >
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div data-ocid="forum.empty_state">
          <EmptyState
            message="Форум порожній. Розпочніть першу тему!"
            icon={<MessageSquare />}
          />
        </div>
      )}
      <div className="space-y-3">
        {sorted.map((t, i) => (
          <motion.div
            key={String(t.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card
              className="shadow-card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTopic(t)}
              data-ocid={`forum.item.${i + 1}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base hover:text-primary transition-colors">
                    {t.title}
                  </CardTitle>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
                <CardDescription className="text-xs">
                  {truncatePrincipal(t.author)} · {formatTimestamp(t.timestamp)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {t.body}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Polls Tab ─────────────────────────────────────────────────────────────────

function PollCard({
  poll,
  role,
  index,
}: { poll: Poll; role: UserRole | null; index: number }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const { data: resultsArr, isLoading } = useQuery<[] | [PollResults]>({
    queryKey: ["poll-results", String(poll.id)],
    queryFn: async () =>
      actor
        ? (actor as unknown as CommunityBackend).getPollResults(poll.id)
        : [],
    enabled: !!actor && !isFetching,
  });

  const results: PollResults | null | undefined =
    resultsArr && resultsArr.length > 0 ? resultsArr[0] : null;
  const userVoted = results
    ? results.userVoted.length > 0
      ? Number(results.userVoted[0])
      : null
    : null;
  const totalVotes = results
    ? results.votes.reduce((s, v) => s + Number(v), 0)
    : 0;

  const voteMut = useMutation({
    mutationFn: (optIdx: number) =>
      (actor as unknown as CommunityBackend).vote(poll.id, BigInt(optIdx)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["poll-results", String(poll.id)] });
      toast.success("Ваш голос зараховано!");
    },
    onError: () => toast.error("Помилка голосування"),
  });

  const canVote = !isGuest(role) && userVoted === null && !voteMut.isPending;

  return (
    <Card className="shadow-card" data-ocid={`polls.item.${index + 1}`}>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base leading-snug">
          {poll.question}
        </CardTitle>
        <CardDescription className="text-xs">
          {truncatePrincipal(poll.author)} · {formatTimestamp(poll.timestamp)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Loader2 className="animate-spin text-primary w-4 h-4" />}
        {poll.options.map((opt, i) => {
          const votes = results ? Number(results.votes[i] ?? 0n) : 0;
          const pct =
            totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isChosen = userVoted === i;
          return (
            <div key={opt} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => canVote && voteMut.mutate(i)}
                  disabled={!canVote}
                  className={`text-sm text-left flex-1 transition-colors ${
                    canVote
                      ? "hover:text-primary cursor-pointer"
                      : "cursor-default"
                  } ${isChosen ? "font-semibold text-primary" : ""}`}
                  data-ocid="polls.toggle"
                >
                  {opt}
                </button>
                <span className="text-xs text-muted-foreground shrink-0">
                  {pct}% ({votes})
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${isChosen ? "bg-primary" : "bg-accent"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
        {userVoted !== null && (
          <p className="text-xs text-muted-foreground pt-1">
            ✓ Ви проголосували · {totalVotes} голосів
          </p>
        )}
        {isGuest(role) && (
          <p className="text-xs text-muted-foreground">
            Увійдіть, щоб проголосувати
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PollsTab({ role }: { role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [showForm, setShowForm] = useState(false);

  const { data: polls = [], isLoading } = useQuery<Poll[]>({
    queryKey: ["polls"],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getPolls() : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createPoll(
        question,
        options.filter(Boolean),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["polls"] });
      setQuestion("");
      setOptions(["", ""]);
      setShowForm(false);
      toast.success("Опитування створено");
    },
    onError: () => toast.error("Помилка"),
  });

  const sorted = [...polls].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-4">
      {isUser(role) && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="polls.open_modal_button"
            >
              <Plus className="w-4 h-4" /> Створити опитування
            </Button>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">
                  Нове опитування
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Питання"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  data-ocid="polls.input"
                />
                {options.map((opt, i) => (
                  <Input
                    key={String(i)}
                    placeholder={`Варіант ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const o = [...options];
                      o[i] = e.target.value;
                      setOptions(o);
                    }}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions([...options, ""])}
                >
                  + Варіант
                </Button>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={
                      !question ||
                      options.filter(Boolean).length < 2 ||
                      createMut.isPending
                    }
                    data-ocid="polls.submit_button"
                  >
                    {createMut.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Опублікувати
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    data-ocid="polls.cancel_button"
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="polls.loading_state"
        >
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div data-ocid="polls.empty_state">
          <EmptyState message="Опитувань поки немає" icon={<BarChart2 />} />
        </div>
      )}
      <div className="space-y-4">
        {sorted.map((p, i) => (
          <PollCard key={String(p.id)} poll={p} role={role} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────────────────────

function EventsTab({ role }: { role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getEvents() : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createEvent(
        title,
        description,
        date,
        location,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
      setShowForm(false);
      toast.success("Подію додано");
    },
    onError: () => toast.error("Помилка"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as CommunityBackend).deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Видалено");
    },
  });

  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="space-y-4">
      {isUser(role) && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="events.open_modal_button"
            >
              <Plus className="w-4 h-4" /> Додати подію
            </Button>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">
                  Нова подія
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Назва події"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-ocid="events.input"
                />
                <Textarea
                  placeholder="Опис"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-ocid="events.textarea"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="event-date"
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      Дата
                    </label>
                    <Input
                      id="event-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="event-location"
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      Місце
                    </label>
                    <Input
                      id="event-location"
                      placeholder="Місце проведення"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={!title || !date || createMut.isPending}
                    data-ocid="events.submit_button"
                  >
                    {createMut.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Додати
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    data-ocid="events.cancel_button"
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="events.loading_state"
        >
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div data-ocid="events.empty_state">
          <EmptyState message="Подій не заплановано" icon={<CalendarDays />} />
        </div>
      )}
      <div className="space-y-3">
        {sorted.map((e, i) => (
          <motion.div
            key={String(e.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="shadow-card" data-ocid={`events.item.${i + 1}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display text-base">
                      {e.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {e.date}
                      </span>
                      {e.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {e.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUser(role) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive shrink-0 h-8 w-8"
                      onClick={() => deleteMut.mutate(e.id)}
                      data-ocid={`events.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              {e.description && (
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed">{e.description}</p>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Services Tab ──────────────────────────────────────────────────────────────

function ServicesTab({ role }: { role: UserRole | null }) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [desc, setDesc] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("");

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () =>
      actor ? (actor as unknown as CommunityBackend).getServices() : [],
    enabled: !!actor && !isFetching,
  });

  const createMut = useMutation({
    mutationFn: () =>
      (actor as unknown as CommunityBackend).createService(
        name,
        category,
        phone,
        desc,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      setName("");
      setCategory("");
      setPhone("");
      setDesc("");
      setShowForm(false);
      toast.success("Службу додано");
    },
    onError: () => toast.error("Помилка"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: bigint) =>
      (actor as unknown as CommunityBackend).deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Видалено");
    },
  });

  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean)),
  );
  const filtered = filterCat
    ? services.filter((s) => s.category === filterCat)
    : services;

  return (
    <div className="space-y-4">
      {isUser(role) && (
        <div>
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2"
              data-ocid="services.open_modal_button"
            >
              <Plus className="w-4 h-4" /> Додати службу
            </Button>
          ) : (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-display">
                  Нова служба
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Назва"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-ocid="services.input"
                  />
                  <Input
                    placeholder="Категорія (напр. Медицина)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Телефон"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Textarea
                  placeholder="Опис"
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  data-ocid="services.textarea"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => createMut.mutate()}
                    disabled={!name || createMut.isPending}
                    data-ocid="services.submit_button"
                  >
                    {createMut.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Додати
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    data-ocid="services.cancel_button"
                  >
                    Скасувати
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filterCat === "" ? "default" : "outline"}
            onClick={() => setFilterCat("")}
            data-ocid="services.tab"
          >
            Усі
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={filterCat === c ? "default" : "outline"}
              onClick={() => setFilterCat(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      )}

      {isLoading && (
        <div
          className="flex justify-center py-8"
          data-ocid="services.loading_state"
        >
          <Loader2 className="animate-spin text-primary" />
        </div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div data-ocid="services.empty_state">
          <EmptyState message="Служб поки немає" icon={<Building2 />} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s, i) => (
          <motion.div
            key={String(s.id)}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card
              className="shadow-card h-full"
              data-ocid={`services.item.${i + 1}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-display text-base">
                      {s.name}
                    </CardTitle>
                    {s.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {s.category}
                      </Badge>
                    )}
                  </div>
                  {isUser(role) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive shrink-0 h-8 w-8"
                      onClick={() => deleteMut.mutate(s.id)}
                      data-ocid={`services.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {s.phone && (
                  <a
                    href={`tel:${s.phone}`}
                    className="text-sm flex items-center gap-1 text-primary hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    {s.phone}
                  </a>
                )}
                {s.description && (
                  <p className="text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Admin Tab ─────────────────────────────────────────────────────────────────

function AdminTab() {
  return (
    <div className="space-y-4" data-ocid="admin.panel">
      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Панель
            адміністратора
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="bg-accent/20 rounded-lg p-4 space-y-2">
            <p className="font-semibold">🔑 Токен адміністратора</p>
            <p className="text-muted-foreground leading-relaxed">
              Перший користувач, який увійде з правильним секретним токеном
              адміністратора, автоматично отримує роль <strong>Адмін</strong>.
              Токен задається при розгортанні платформи.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Щоб увійти як адмін, відкрийте сторінку з параметром:
            </p>
            <code className="block bg-muted rounded px-3 py-2 text-xs font-mono break-all">
              ?adminSecret=ВАШ_ТОКЕН
            </code>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-semibold">👥 Ролі користувачів</p>
            <div className="space-y-1 text-muted-foreground">
              <p>
                <Badge className="bg-primary text-primary-foreground text-xs mr-2">
                  Адмін
                </Badge>{" "}
                Повний доступ: керування контентом та ролями
              </p>
              <p>
                <Badge variant="secondary" className="text-xs mr-2">
                  Модератор
                </Badge>{" "}
                Може створювати та видаляти контент
              </p>
              <p>
                <Badge variant="outline" className="text-xs mr-2">
                  Учасник
                </Badge>{" "}
                Може переглядати, коментувати та голосувати
              </p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="font-semibold">📋 Поради для початку</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Увійдіть з токеном адміністратора для отримання прав</li>
              <li>Додайте кілька новин та оголошень</li>
              <li>Створіть перші події та служби громади</li>
              <li>Поділіться посиланням з учасниками</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({
  role,
  identity,
  onLogout,
  actor,
}: {
  role: UserRole | null;
  identity: { getPrincipal(): { toString(): string } } | null;
  onLogout: () => void;
  actor: unknown;
}) {
  const [debugRole, setDebugRole] = useState<string | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || !identity) return;
    console.log(
      "[DEBUG] Calling getCallerUserRole directly, principal:",
      identity.getPrincipal().toString(),
    );
    setDebugLoading(true);
    setDebugError(null);
    (actor as unknown as CommunityBackend)
      .getCallerUserRole()
      .then((result) => {
        console.log(
          "[DEBUG] getCallerUserRole result:",
          JSON.stringify(result),
        );
        const label = !result
          ? "null"
          : "admin" in result
            ? "admin"
            : "user" in result
              ? "user"
              : "guest/unknown";
        setDebugRole(label);
        setDebugLoading(false);
      })
      .catch((err) => {
        console.error("[DEBUG] getCallerUserRole error:", err);
        setDebugError(String(err));
        setDebugLoading(false);
      });
    // biome-ignore lint/correctness/useExhaustiveDependencies: actor is unknown type
  }, [actor, identity]);
  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
        <User className="w-12 h-12 opacity-30" />
        <p className="text-sm">Увійдіть, щоб побачити профіль</p>
      </div>
    );
  }
  const principal = identity.getPrincipal().toString();
  const roleLabel = !role
    ? "Гість"
    : "admin" in role
      ? "Адміністратор"
      : "user" in role
        ? "Учасник"
        : "Гість";
  const roleDesc = !role
    ? "Перегляд публічного контенту"
    : "admin" in role
      ? "Повний доступ: керування контентом, ролями та налаштуваннями платформи"
      : "user" in role
        ? "Може переглядати контент, коментувати, голосувати та створювати нові публікації"
        : "Перегляд публічного контенту";

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5" />
            Мій профіль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Principal ID</p>
            <code
              className="block bg-muted rounded px-3 py-2 text-xs font-mono break-all"
              data-ocid="profile.panel"
            >
              {principal}
            </code>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Ваша роль</p>
            <div className="flex items-center gap-2">
              <RoleBadge role={role} />
              <span className="text-sm font-medium">{roleLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{roleDesc}</p>
          </div>
          <Separator />
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 w-full"
            onClick={onLogout}
            data-ocid="profile.secondary_button"
          >
            <LogOut className="w-4 h-4" />
            Вийти з платформи
          </Button>
        </CardContent>
      </Card>

      <Card className="border-yellow-400 border-2">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-700">
            🔍 DEBUG: getCallerUserRole (пряме звернення до canister)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1">
          {debugLoading && (
            <p className="text-muted-foreground">Завантаження...</p>
          )}
          {debugError && (
            <p className="text-destructive font-mono">{debugError}</p>
          )}
          {debugRole !== null && !debugLoading && (
            <p>
              Роль з canister:{" "}
              <code className="bg-muted px-1 rounded font-bold">
                {debugRole}
              </code>
            </p>
          )}
          {!debugLoading && debugRole === null && !debugError && (
            <p className="text-muted-foreground">Ще не завантажено</p>
          )}
          <p className="text-muted-foreground">
            Principal: {identity?.getPrincipal().toString()}
          </p>
        </CardContent>
      </Card>
      {isAdmin(role) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Адміністрування
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">🔑 Вхід як адміністратор</p>
              <p className="text-xs text-muted-foreground">
                Щоб увійти з правами адміністратора, відкрийте платформу з
                параметром у URL:
              </p>
              <code className="block bg-muted rounded px-3 py-2 text-xs font-mono break-all">
                ?adminSecret=ВАШ_ТОКЕН
              </code>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">👥 Управління користувачами</p>
              <p className="text-xs text-muted-foreground">
                Розширене управління ролями та користувачами доступне у вкладці{" "}
                <strong>Адмін</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms),
  );
  return Promise.race([promise, timeout]);
}

export default function App() {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [activeTab, setActiveTab] = useState("news");

  const isLoggingIn = loginStatus === "logging-in";

  // Token input state for the login form
  const [tokenInput, setTokenInput] = useState("");

  // Read admin secret: URL hash first, then localStorage fallback (survives II redirect)
  const urlSecret =
    getSecretParameter("adminSecret") ??
    getSecretParameter("caffeineAdminToken") ??
    "";
  const storedSecret =
    typeof window !== "undefined"
      ? (localStorage.getItem("adminSecret") ?? "")
      : "";
  const adminSecret = urlSecret || storedSecret;

  // If there's a URL secret, persist it to localStorage so it survives II redirect
  useEffect(() => {
    if (urlSecret) {
      localStorage.setItem("adminSecret", urlSecret);
    }
  }, [urlSecret]);

  const { data: role = null, isLoading: roleLoading } =
    useQuery<UserRole | null>({
      queryKey: ["role", identity?.getPrincipal().toString()],
      queryFn: async () => {
        if (!actor || !identity) return null;
        // Initialize access control with admin token if present
        if (adminSecret !== "") {
          try {
            await withTimeout(
              (
                actor as unknown as CommunityBackend
              )._initializeAccessControlWithSecret(adminSecret),
              12000,
            );
          } catch {
            // If init fails or times out, still try to get the role
          }
        }
        localStorage.removeItem("adminSecret");
        console.log(
          "[DEBUG] Calling getCallerUserRole, identity principal:",
          identity?.getPrincipal().toString(),
        );
        try {
          return await withTimeout(
            (actor as unknown as CommunityBackend).getCallerUserRole(),
            8000,
          );
        } catch {
          return null;
        }
      },
      enabled: !!actor && !!identity && !isFetching,
      retry: false,
    });

  const handleLogout = useCallback(() => {
    clear();
    toast.success("Ви вийшли з платформи");
  }, [clear]);

  const principal = identity?.getPrincipal().toString();

  const tabs = [
    { id: "news", label: "Новини", icon: <Newspaper className="w-4 h-4" /> },
    {
      id: "announcements",
      label: "Оголошення",
      icon: <Megaphone className="w-4 h-4" />,
    },
    {
      id: "forum",
      label: "Форум",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "polls",
      label: "Опитування",
      icon: <BarChart2 className="w-4 h-4" />,
    },
    {
      id: "events",
      label: "Події",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "services",
      label: "Служби",
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: "profile",
      label: "Профіль",
      icon: <User className="w-4 h-4" />,
    },
    ...(isAdmin(role)
      ? [
          {
            id: "admin",
            label: "Адмін",
            icon: <ShieldCheck className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">
                🌿
              </span>
            </div>
            <h1 className="font-display text-lg font-semibold text-foreground leading-none">
              Платформа Громади
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {(isFetching || isInitializing || roleLoading) && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {identity ? (
              <div className="flex items-center gap-2">
                <RoleBadge role={role} />
                <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
                  {principal
                    ? `${principal.slice(0, 6)}...${principal.slice(-4)}`
                    : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="gap-1"
                  data-ocid="auth.secondary_button"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Вийти</span>
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => login()}
                disabled={isLoggingIn}
                className="gap-1"
                data-ocid="auth.primary_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Увійти
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Guest welcome or role notice */}
      <AnimatePresence>
        {identity && role && isGuest(role) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-accent/30 border-b border-accent/50"
          >
            <div className="max-w-4xl mx-auto px-4 py-2 text-sm text-accent-foreground flex items-center gap-2">
              <span>👋</span>
              <span>
                Ласкаво просимо! Ви зареєстровані як учасник громади. Ви можете
                переглядати контент, коментувати та голосувати.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {!identity ? (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="w-full max-w-sm">
              <Card className="shadow-md">
                <CardHeader className="text-center pb-2">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🌿</span>
                  </div>
                  <CardTitle className="text-xl">Платформа Громади</CardTitle>
                  <CardDescription>
                    Увійдіть через Internet Identity, щоб продовжити
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="admin-token-input"
                      className="text-sm font-medium text-foreground flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                      Токен адміністратора
                      <span className="text-muted-foreground font-normal">
                        (необов&apos;язково)
                      </span>
                    </label>
                    <Input
                      id="admin-token-input"
                      type="password"
                      placeholder="Введіть токен, щоб отримати права адміна"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Залиште порожнім для звичайного входу
                    </p>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      if (tokenInput.trim()) {
                        localStorage.setItem("adminSecret", tokenInput.trim());
                      }
                      login();
                    }}
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    Увійти через Internet Identity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : identity && roleLoading ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground"
            data-ocid="app.loading_state"
          >
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Завантаження профілю...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab list - scrollable on mobile */}
            <div className="overflow-x-auto pb-1 -mx-4 px-4">
              <TabsList
                className="flex w-max gap-1 bg-muted/50 p-1 rounded-lg h-auto"
                data-ocid="nav.tab"
              >
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
                    data-ocid={`nav.${t.id}.tab`}
                  >
                    {t.icon}
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="mt-6">
              <TabsContent value="news" className="mt-0">
                <NewsTab role={role} />
              </TabsContent>
              <TabsContent value="announcements" className="mt-0">
                <AnnouncementsTab role={role} />
              </TabsContent>
              <TabsContent value="forum" className="mt-0">
                <ForumTab role={role} />
              </TabsContent>
              <TabsContent value="polls" className="mt-0">
                <PollsTab role={role} />
              </TabsContent>
              <TabsContent value="events" className="mt-0">
                <EventsTab role={role} />
              </TabsContent>
              <TabsContent value="services" className="mt-0">
                <ServicesTab role={role} />
              </TabsContent>
              <TabsContent value="profile" className="mt-0">
                <ProfileTab
                  role={role}
                  identity={identity ?? null}
                  onLogout={handleLogout}
                  actor={actor}
                />
              </TabsContent>
              <TabsContent value="admin" className="mt-0">
                <AdminTab />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Платформа Громади. Зроблено з{" "}
          <span className="text-destructive">♥</span> за допомогою{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
