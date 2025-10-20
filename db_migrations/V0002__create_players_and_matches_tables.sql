-- Создание таблицы игроков
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    name VARCHAR(100) NOT NULL,
    number INTEGER,
    position VARCHAR(50),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы матчей
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    home_team_id INTEGER REFERENCES teams(id),
    away_team_id INTEGER REFERENCES teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    match_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team_id);

-- Добавление тестовых игроков для первой команды
INSERT INTO players (team_id, name, number, position, goals, assists) VALUES
(1, 'Иван Петров', 10, 'Нападающий', 8, 5),
(1, 'Алексей Смирнов', 7, 'Полузащитник', 4, 7),
(1, 'Дмитрий Козлов', 1, 'Вратарь', 0, 0),
(1, 'Сергей Морозов', 5, 'Защитник', 1, 2),
(2, 'Андрей Волков', 9, 'Нападающий', 6, 3),
(2, 'Павел Соколов', 11, 'Полузащитник', 5, 4)
ON CONFLICT DO NOTHING;

-- Добавление тестовых матчей
INSERT INTO matches (home_team_id, away_team_id, home_score, away_score, match_date, status) VALUES
(1, 2, 2, 1, '2025-10-25 18:00:00', 'scheduled'),
(3, 4, 0, 0, '2025-10-26 16:00:00', 'scheduled'),
(5, 6, 1, 1, '2025-10-27 19:00:00', 'scheduled'),
(1, 3, 3, 0, '2025-10-20 15:00:00', 'finished'),
(2, 4, 1, 2, '2025-10-19 17:00:00', 'finished')
ON CONFLICT DO NOTHING;