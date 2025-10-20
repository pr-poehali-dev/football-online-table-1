import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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
  updated_at?: string;
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

export default function Index() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedTeam, setEditedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isPlayersDialogOpen, setIsPlayersDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchTeams = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setTeams(data.teams);
      setLoading(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить таблицу',
      });
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
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки игроков',
      });
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

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    setEditedTeam({ ...team });
  };

  const handleSave = async () => {
    if (!editedTeam) return;

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTeam),
      });

      if (response.ok) {
        toast({
          title: '✅ Сохранено',
          description: 'Изменения синхронизированы',
        });
        await fetchTeams();
        setEditingId(null);
        setEditedTeam(null);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка сохранения',
        description: 'Попробуйте еще раз',
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedTeam(null);
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Введите название команды',
      });
      return;
    }

    try {
      const newPosition = teams.length + 1;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          position: newPosition,
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Команда добавлена',
          description: `${newTeamName} в таблице!`,
        });
        setNewTeamName('');
        setIsAdding(false);
        await fetchTeams();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка добавления',
        description: 'Попробуйте еще раз',
      });
    }
  };

  const handleDelete = async (teamId: number, teamName: string) => {
    if (!confirm(`Удалить команду "${teamName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}?id=${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: '🗑️ Команда удалена',
          description: `${teamName} больше нет в таблице`,
        });
        await fetchTeams();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка удаления',
        description: 'Попробуйте еще раз',
      });
    }
  };

  const updateField = (field: keyof Team, value: string | number) => {
    if (!editedTeam) return;
    const numValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    
    const updated = { ...editedTeam, [field]: field === 'name' ? value : numValue };
    
    if (['won', 'drawn', 'lost', 'goals_for', 'goals_against'].includes(field)) {
      updated.points = updated.won * 3 + updated.drawn;
      updated.goal_difference = updated.goals_for - updated.goals_against;
    }
    
    setEditedTeam(updated);
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
              <div className="flex flex-col gap-4">
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
              
              {isAdding ? (
                <div className="flex gap-2 items-center bg-white/10 p-4 rounded-lg backdrop-blur-sm transition-all animate-in">
                  <Input
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Название новой команды"
                    className="bg-white text-gray-900 border-0 flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                    autoFocus
                  />
                  <Button
                    onClick={handleAddTeam}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="Check" size={18} />
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAdding(false);
                      setNewTeamName('');
                    }}
                    variant="outline"
                    className="bg-white/20 hover:bg-white/30 border-white/30"
                  >
                    <Icon name="X" size={18} />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAdding(true)}
                  className="bg-white/10 hover:bg-white/20 border border-white/30 w-full md:w-auto"
                >
                  <Icon name="Plus" size={18} />
                  <span className="ml-2">Добавить команду</span>
                </Button>
              )}
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
                    <TableHead className="text-center font-bold w-[120px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, index) => {
                    const isEditing = editingId === team.id;
                    const current = isEditing ? editedTeam! : team;
                    
                    return (
                      <TableRow 
                        key={team.id} 
                        className={`
                          transition-all duration-300 hover:bg-muted/30
                          ${isEditing ? 'bg-accent/10 scale-[1.02] shadow-lg' : ''}
                          ${index < 4 ? 'bg-green-50' : ''}
                          ${index >= teams.length - 3 ? 'bg-red-50' : ''}
                        `}
                      >
                        <TableCell className="text-center font-bold text-lg">
                          {team.position}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={current.name}
                              onChange={(e) => updateField('name', e.target.value)}
                              className="max-w-[250px] border-2 border-accent focus:ring-2 transition-all"
                            />
                          ) : (
                            <button
                              onClick={() => handleTeamClick(team)}
                              className="flex items-center gap-2 hover:text-secondary transition-colors cursor-pointer text-left"
                            >
                              <div className="text-xl">🏆</div>
                              <span className="text-base font-semibold">{team.name}</span>
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={current.played}
                              onChange={(e) => updateField('played', e.target.value)}
                              className="w-16 text-center border-2 border-accent mx-auto transition-all"
                            />
                          ) : (
                            team.played
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={current.won}
                              onChange={(e) => updateField('won', e.target.value)}
                              className="w-16 text-center border-2 border-accent mx-auto transition-all"
                            />
                          ) : (
                            team.won
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={current.drawn}
                              onChange={(e) => updateField('drawn', e.target.value)}
                              className="w-16 text-center border-2 border-accent mx-auto transition-all"
                            />
                          ) : (
                            team.drawn
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={current.lost}
                              onChange={(e) => updateField('lost', e.target.value)}
                              className="w-16 text-center border-2 border-accent mx-auto transition-all"
                            />
                          ) : (
                            team.lost
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={current.goals_for}
                              onChange={(e) => updateField('goals_for', e.target.value)}
                              className="w-16 text-center border-2 border-accent mx-auto transition-all"
                            />
                          ) : (
                            team.goals_for
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={current.goals_against}
                              onChange={(e) => updateField('goals_against', e.target.value)}
                              className="w-16 text-center border-2 border-accent mx-auto transition-all"
                            />
                          ) : (
                            team.goals_against
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          <span className={current.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {current.goal_difference > 0 ? '+' : ''}{current.goal_difference}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-lg px-3 py-1 bg-primary text-white rounded-lg">
                            {current.points}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 transition-all"
                              >
                                <Icon name="Check" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                className="transition-all"
                              >
                                <Icon name="X" size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(team)}
                                className="hover:bg-accent/20 transition-all"
                              >
                                <Icon name="Edit" size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(team.id, team.name)}
                                className="hover:bg-red-100 text-red-600 transition-all"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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