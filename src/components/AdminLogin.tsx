import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AdminLoginProps {
  onLogin: (password: string) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'ldl2025') {
      onLogin(password);
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-secondary to-secondary/90 text-white">
          <CardTitle className="text-2xl font-bebas tracking-wide flex items-center gap-2">
            <Icon name="Lock" size={24} />
            АДМИН-ПАНЕЛЬ ЛДЛ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Пароль администратора</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </div>
            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90">
              <Icon name="LogIn" size={18} className="mr-2" />
              Войти
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Пароль по умолчанию: <code className="bg-muted px-2 py-1 rounded">ldl2025</code>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
