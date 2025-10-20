import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Team {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
}

interface Player {
  id: number;
  team_id: number;
  name: string;
  number: number;
  position: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
}

interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_team_name: string;
  away_team_name: string;
  home_score: number;
  away_score: number;
  match_date: string;
  status: string;
}

const API_URL = 'https://functions.poehali.dev/ec30d765-4275-4c64-9c43-6a7008c00ebc';
const MATCHES_API = 'https://functions.poehali.dev/95113a0c-9721-4a3a-9cf2-726679781c99';
const PLAYERS_API = 'https://functions.poehali.dev/1bcac70b-6cdc-4de2-837a-10524c1cc035';

export default function PublicView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isPlayersDialogOpen, setIsPlayersDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTeams(data.teams);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки таблицы', error);
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch(MATCHES_API);
      const data = await response.json();
      setMatches(data.matches);
    } catch (error) {
      console.error('Ошибка загрузки матчей', error);
    }
  };

  const fetchPlayers = async (teamId: number) => {
    try {
      const response = await fetch(`${PLAYERS_API}?team_id=${teamId}`);
      const data = await response.json();
      setPlayers(data.players);
    } catch (error) {
      console.error('Ошибка загрузки игроков', error);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchMatches();
    const interval = setInterval(() => {
      fetchTeams();
      fetchMatches();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    fetchPlayers(team.id);
    setIsPlayersDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
        <div className="text-white text-2xl font-bold animate-pulse">⚽ Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-6xl md:text-8xl font-bebas text-white tracking-wider mb-2">
          ЛДЛ ВОРОНЕЖ
        </h1>
        <div className="text-secondary text-xl font-semibold">Любительская Футбольная Лига</div>
      </div>

      <Tabs defaultValue="table" className="max-w-7xl mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 backdrop-blur-sm">
          <TabsTrigger value="table" className="text-white data-[state=active]:bg-secondary data-[state=active]:text-white">
            <Icon name="Trophy" size={18} className="mr-2" />
            Турнирная таблица
          </TabsTrigger>
          <TabsTrigger value="matches" className="text-white data-[state=active]:bg-secondary data-[state=active]:text-white">
            <Icon name="Calendar" size={18} className="mr-2" />
            Календарь матчей
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary to-secondary/90 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🏆</div>
                  <CardTitle className="text-2xl md:text-3xl font-bebas tracking-wide">ТАБЛИЦА</CardTitle>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-12 text-center font-bold">#</TableHead>
                      <TableHead className="font-bold min-w-[200px]">Команда</TableHead>
                      <TableHead className="text-center font-bold">И</TableHead>
                      <TableHead className="text-center font-bold">В</TableHead>
                      <TableHead className="text-center font-bold">Н</TableHead>
                      <TableHead className="text-center font-bold">П</TableHead>
                      <TableHead className="text-center font-bold">ЗГ</TableHead>
                      <TableHead className="text-center font-bold">ПГ</TableHead>
                      <TableHead className="text-center font-bold">РГ</TableHead>
                      <TableHead className="text-center font-bold">О</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team, index) => (
                      <TableRow
                        key={team.id}
                        className={`
                          transition-all duration-300 hover:bg-muted/30 cursor-pointer
                          ${index < 4 ? 'bg-green-50' : ''}
                          ${index >= teams.length - 3 ? 'bg-red-50' : ''}
                        `}
                        onClick={() => handleTeamClick(team)}
                      >
                        <TableCell className="text-center font-bold text-lg">{team.position}</TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            <div className="text-xl">🏆</div>
                            <span className="text-base">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{team.played}</TableCell>
                        <TableCell className="text-center">{team.won}</TableCell>
                        <TableCell className="text-center">{team.drawn}</TableCell>
                        <TableCell className="text-center">{team.lost}</TableCell>
                        <TableCell className="text-center">{team.goals_for}</TableCell>
                        <TableCell className="text-center">{team.goals_against}</TableCell>
                        <TableCell className="text-center font-bold">
                          <span className={team.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-lg px-3 py-1 bg-primary text-white rounded-lg">
                            {team.points}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span className="font-medium">Зона Лиги Чемпионов</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                <span className="font-medium">Зона вылета</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matches">
          <Card className="shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-secondary to-secondary/90 text-white p-6">
              <CardTitle className="text-2xl md:text-3xl font-bebas tracking-wide flex items-center gap-3">
                <Icon name="Calendar" size={32} />
                КАЛЕНДАРЬ МАТЧЕЙ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <div className="font-bold text-lg">{match.home_team_name}</div>
                      </div>
                      <div className="px-6">
                        <div className="text-3xl font-bebas text-secondary">
                          {match.home_score} : {match.away_score}
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          {new Date(match.match_date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg">{match.away_team_name}</div>
                      </div>
                      <div className="ml-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            match.status === 'finished'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {match.status === 'finished' ? 'Завершен' : 'Запланирован'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isPlayersDialogOpen} onOpenChange={setIsPlayersDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas tracking-wide flex items-center gap-2">
              <Icon name="Users" size={24} />
              {selectedTeam?.name} - Состав команды
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">№</TableHead>
                  <TableHead>Игрок</TableHead>
                  <TableHead>Позиция</TableHead>
                  <TableHead className="text-center">Голы</TableHead>
                  <TableHead className="text-center">Пасы</TableHead>
                  <TableHead className="text-center">ЖК</TableHead>
                  <TableHead className="text-center">КК</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="text-center font-bold">{player.number}</TableCell>
                    <TableCell className="font-semibold">{player.name}</TableCell>
                    <TableCell className="text-muted-foreground">{player.position}</TableCell>
                    <TableCell className="text-center">{player.goals}</TableCell>
                    <TableCell className="text-center">{player.assists}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block w-6 h-6 bg-yellow-400 rounded text-xs leading-6 font-bold">
                        {player.yellow_cards || ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-block w-6 h-6 bg-red-600 text-white rounded text-xs leading-6 font-bold">
                        {player.red_cards || ''}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
