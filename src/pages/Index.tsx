import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const API_URL = 'https://functions.poehali.dev/ec30d765-4275-4c64-9c43-6a7008c00ebc';

export default function Index() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedTeam, setEditedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
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

  useEffect(() => {
    fetchTeams();
    const interval = setInterval(fetchTeams, 3000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-secondary to-secondary/90 text-white p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">⚽</div>
                  <CardTitle className="text-3xl md:text-4xl font-bold">Турнирная таблица</CardTitle>
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
                            <div className="flex items-center gap-2">
                              <div className="text-xl">🏆</div>
                              <span className="text-base">{team.name}</span>
                            </div>
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
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Обновляется каждые 3 секунды</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}